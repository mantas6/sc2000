/**
 * Canvas character — animation layer (pure, React-free).
 *
 * `deriveAppearance` (see `character.ts`) is a *stateless* snapshot: it maps a
 * single {@link GameState} onto normalized look parameters. That is exactly
 * what we want it to be — pure and trivially testable — but it means every
 * parameter can jump instantly when the simulation ticks once per second, and
 * it has no notion of the little involuntary movements (blinks, glances, weight
 * shifts) that make a figure read as *alive*.
 *
 * This module supplies that missing, time-dependent layer. It is still pure in
 * the functional sense — every function is deterministic given its inputs (an
 * explicit `rng` is threaded where randomness is wanted) and touches no DOM —
 * but it is *stateful*: callers thread a small mutable {@link MotionState} bag
 * across frames. Nothing here allocates on the hot path beyond the state it is
 * handed, so it stays cheap at 60fps.
 *
 * The public entry points are:
 *   - {@link smoothAppearance} — eases the slow, "what state am I in" params of
 *     an {@link Appearance} toward a freshly-derived target so state changes
 *     ramp in organically instead of snapping.
 *   - {@link stepMotion} — advances all the involuntary motion (breathing
 *     phase, blinks, gaze, exhaustion nod, idle sway, belly jiggle, spring-eased
 *     collapse) and returns the {@link Motion} that `drawCharacter` consumes.
 *
 * The smaller primitives ({@link expApproach}, {@link stepSpring},
 * {@link stepBlink}, {@link stepGaze}, {@link stepFidget}) are exported so they
 * can be unit-tested in isolation.
 */

import type { Appearance, Motion } from './character'

/** Clamp a number into the inclusive `[0, 1]` range. */
function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/** Two-π, hoisted so the phase math avoids recomputing it each frame. */
const TAU = Math.PI * 2

/* ------------------------------------------------------------------ *
 * Scalar smoothing primitives
 * ------------------------------------------------------------------ */

/**
 * Frame-rate-independent exponential approach of `current` toward `target`.
 *
 * `tau` is the time constant in seconds: after `tau` seconds the gap has shrunk
 * to `1/e` (~37%) of its original size, regardless of frame timing. This is the
 * standard "damped move" that never overshoots — ideal for easing colour/pose
 * parameters. A non-positive `tau` snaps straight to `target`.
 */
export function expApproach(current: number, target: number, dt: number, tau: number): number {
  if (tau <= 0 || dt <= 0) return dt <= 0 ? current : target
  const k = 1 - Math.exp(-dt / tau)
  return current + (target - current) * k
}

/** A 1-D spring: `value` chases a target, `velocity` carries its momentum. */
export interface Spring {
  value: number
  velocity: number
}

/**
 * Advance a {@link Spring} one step toward `target` (semi-implicit Euler).
 *
 * `stiffness` pulls harder toward the target (faster, springier); `damping`
 * bleeds off velocity (higher = less bounce). Under-damped values overshoot and
 * settle, which is exactly what sells a "flop to the floor" collapse or a belly
 * jiggle. Mutates `s` in place and returns it.
 */
export function stepSpring(
  s: Spring,
  target: number,
  dt: number,
  stiffness: number,
  damping: number,
): Spring {
  // Clamp dt so a long pause (e.g. a backgrounded tab) can't explode the spring.
  const h = Math.min(dt, 0.05)
  const force = (target - s.value) * stiffness - s.velocity * damping
  s.velocity += force * h
  s.value += s.velocity * h
  return s
}

/* ------------------------------------------------------------------ *
 * Blink controller
 * ------------------------------------------------------------------ */

/** Duration of a single blink (eyes shut and back open), seconds. */
const BLINK_DURATION = 0.13
/** Gap between the two blinks of a double-blink, seconds. */
const DOUBLE_BLINK_GAP = 0.12
/** Chance a blink is followed by a second one (a natural double-blink). */
const DOUBLE_BLINK_CHANCE = 0.35
/** Randomized rest between blink bursts, seconds. */
const BLINK_MIN_REST = 2.2
const BLINK_MAX_REST = 5.5

/** Blink state machine: openness plus scheduling for natural double-blinks. */
export interface BlinkState {
  /** Current eyelid openness 0 (shut) … 1 (wide). */
  openness: number
  /** Seconds until the next blink starts (when not mid-blink). */
  cooldown: number
  /** Progress through the current blink 0…1, or `-1` when the eyes are open. */
  progress: number
  /** Blinks still queued after this one (1 → a double-blink is in progress). */
  queued: number
}

/** A fresh, eyes-open blink state with a short initial delay. */
export function createBlinkState(): BlinkState {
  return { openness: 1, cooldown: 1.5, progress: -1, queued: 0 }
}

/** Uniform sample in `[min, max)` from a `[0, 1)` rng. */
function randRange(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng()
}

/**
 * Advance the blink model by `dt` and return the current eyelid openness.
 *
 * Idle life: blinks fire at randomized intervals and ~35% of the time come in
 * natural double-blink pairs. `rate` (default 1) scales how quickly the lids
 * move — the caller can slow it below 1 for heavy, tired blinks. Deterministic
 * given `rng`, so it is fully unit-testable.
 */
export function stepBlink(s: BlinkState, dt: number, rng: () => number, rate = 1): number {
  if (s.progress >= 0) {
    // Mid-blink: run the closure curve, then either queue the pair's second
    // blink or schedule the next rest.
    s.progress += (dt / BLINK_DURATION) * rate
    if (s.progress >= 1) {
      s.progress = -1
      if (s.queued > 0) {
        s.queued -= 1
        s.cooldown = DOUBLE_BLINK_GAP
      } else {
        s.cooldown = randRange(rng, BLINK_MIN_REST, BLINK_MAX_REST)
      }
      s.openness = 1
    } else {
      // Open → shut → open over the blink; `sin` gives a smooth close/reopen.
      s.openness = 1 - Math.sin(Math.PI * s.progress)
    }
    return s.openness
  }

  s.cooldown -= dt
  if (s.cooldown <= 0) {
    s.progress = 0
    s.queued = rng() < DOUBLE_BLINK_CHANCE ? 1 : 0
  }
  s.openness = 1
  return s.openness
}

/* ------------------------------------------------------------------ *
 * Gaze controller
 * ------------------------------------------------------------------ */

/** How fast the eyes dart to a new target (saccade time-constant, seconds). */
const GAZE_SACCADE_TAU = 0.05
const GAZE_MIN_HOLD = 0.8
const GAZE_MAX_HOLD = 2.8

/** Eye-direction state: the pupils saccade to fresh targets and hold. */
export interface GazeState {
  /** Current look direction −1…1. */
  x: number
  y: number
  /** Target the eyes are darting toward. */
  targetX: number
  targetY: number
  /** Seconds until a new target is chosen. */
  cooldown: number
}

/** A fresh, forward-looking gaze state. */
export function createGazeState(): GazeState {
  return { x: 0, y: 0, targetX: 0, targetY: 0, cooldown: 1.2 }
}

/**
 * Advance the gaze: occasionally pick a new look target, then saccade toward it.
 * Mutates `s` in place; read `s.x` / `s.y` afterward. Deterministic given `rng`.
 */
export function stepGaze(s: GazeState, dt: number, rng: () => number): void {
  s.cooldown -= dt
  if (s.cooldown <= 0) {
    s.targetX = randRange(rng, -1, 1) * 0.7
    s.targetY = randRange(rng, -1, 1) * 0.5
    s.cooldown = randRange(rng, GAZE_MIN_HOLD, GAZE_MAX_HOLD)
  }
  s.x = expApproach(s.x, s.targetX, dt, GAZE_SACCADE_TAU)
  s.y = expApproach(s.y, s.targetY, dt, GAZE_SACCADE_TAU)
}

/* ------------------------------------------------------------------ *
 * Fidget / nod-jerk pulse
 * ------------------------------------------------------------------ */

/** Seconds an idle fidget impulse takes to decay from 1 → 0. */
const FIDGET_DECAY = 0.5

/** A recurring impulse used for idle fidgets and exhaustion "wake-up" jerks. */
export interface FidgetState {
  /** Seconds until the next impulse fires. */
  cooldown: number
  /** Current impulse magnitude, decaying 1 → 0 after each firing. */
  impulse: number
}

/** A fresh fidget state that waits a beat before its first impulse. */
export function createFidgetState(): FidgetState {
  return { cooldown: 4, impulse: 0 }
}

/**
 * Advance the fidget pulse and return its current impulse (0…1).
 *
 * Between firings the impulse decays to 0; when the cooldown elapses it snaps
 * back to 1 and the next interval is randomized around `meanInterval`.
 * Deterministic given `rng`.
 */
export function stepFidget(
  s: FidgetState,
  dt: number,
  rng: () => number,
  meanInterval = 6,
): number {
  if (s.impulse > 0) s.impulse = Math.max(0, s.impulse - dt / FIDGET_DECAY)
  s.cooldown -= dt
  if (s.cooldown <= 0) {
    s.impulse = 1
    s.cooldown = randRange(rng, meanInterval * 0.5, meanInterval * 1.5)
  }
  return s.impulse
}

/* ------------------------------------------------------------------ *
 * Appearance smoothing
 * ------------------------------------------------------------------ */

/**
 * Per-field time constants (seconds) for {@link smoothAppearance}. Slower
 * fields (colour, panting rate) ease in gently; the belly reacts quickest so
 * eating still feels responsive.
 */
const APPEARANCE_TAU = {
  vitality: 0.5,
  pallor: 0.5,
  cold: 0.6,
  hot: 0.6,
  dryness: 0.8,
  energy: 0.5,
  droop: 0.5,
  breathRate: 0.7,
  breathDepth: 0.5,
  belly: 0.35,
} as const

/**
 * Ease the *slow* look parameters of `smoothed` toward `target` by `dt`, so a
 * once-per-second simulation tick reads as a smooth transition rather than a
 * snap. The event-driven / discretely-handled fields (`vomit`, `damage`,
 * `dead`, `collapse`) are copied straight through — their timing is owned
 * elsewhere (decays in the canvas layer, the collapse spring in
 * {@link stepMotion}). Mutates `smoothed` in place and returns it.
 */
export function smoothAppearance(smoothed: Appearance, target: Appearance, dt: number): Appearance {
  for (const key in APPEARANCE_TAU) {
    const k = key as keyof typeof APPEARANCE_TAU
    smoothed[k] = expApproach(smoothed[k], target[k], dt, APPEARANCE_TAU[k])
  }
  // Pass event / discretely-driven fields through untouched.
  smoothed.vomit = target.vomit
  smoothed.damage = target.damage
  smoothed.dead = target.dead
  smoothed.collapse = target.collapse
  return smoothed
}

/* ------------------------------------------------------------------ *
 * Composite motion
 * ------------------------------------------------------------------ */

/** Collapse spring tuning — under-damped so the fall overshoots and settles. */
const COLLAPSE_STIFFNESS = 90
const COLLAPSE_DAMPING = 12
/** Belly-jiggle spring tuning — loose and bouncy so it wobbles behind the body. */
const BELLY_STIFFNESS = 120
const BELLY_DAMPING = 11

/** All persistent motion state threaded across frames by {@link stepMotion}. */
export interface MotionState {
  blink: BlinkState
  gaze: GazeState
  fidget: FidgetState
  /** Spring driving the animated collapse/fall. */
  collapse: Spring
  /** Spring driving the belly's lagging jiggle. */
  belly: Spring
  /** Accumulated breathing phase (radians) — advanced by the smoothed rate. */
  breathPhase: number
  /** Eased exhaustion head-nod (radians). */
  headNod: number
  /** Previous frame's sway, to drive the belly spring from its velocity. */
  prevSway: number
  /** Reused output object — avoids a per-frame allocation. */
  out: Motion
}

/** Build a fresh, upright motion state. */
export function createMotionState(): MotionState {
  return {
    blink: createBlinkState(),
    gaze: createGazeState(),
    fidget: createFidgetState(),
    collapse: { value: 0, velocity: 0 },
    belly: { value: 0, velocity: 0 },
    breathPhase: 0,
    headNod: 0,
    prevSway: 0,
    out: {
      breath: 0,
      eyeOpen: 1,
      gazeX: 0,
      gazeY: 0,
      headNod: 0,
      swayX: 0,
      bellyWobble: 0,
      collapse: 0,
    },
  }
}

/**
 * Advance every involuntary-motion channel by `dt` and return the {@link Motion}
 * for {@link drawCharacter} to paint this frame.
 *
 * `a` should be the *smoothed* appearance (see {@link smoothAppearance}); `t`
 * is the absolute animation clock in seconds (used for the slow, purely
 * periodic sway). `rng` is threaded so tests can make the whole thing
 * deterministic. The returned object is `ms.out`, reused every frame.
 */
export function stepMotion(
  ms: MotionState,
  a: Appearance,
  dt: number,
  t: number,
  rng: () => number = Math.random,
): Motion {
  const out = ms.out

  // Breathing: accumulate phase from the (smoothed) rate so changing the rate
  // never snaps the phase. Wrap to keep the number small.
  ms.breathPhase = (ms.breathPhase + dt * a.breathRate * TAU) % TAU
  const breath = Math.sin(ms.breathPhase)
  out.breath = breath

  // Blinks slow down as the figure tires (heavy lids); combine with a lid droop
  // so exhaustion keeps the eyes half-closed even between blinks.
  const blinkRate = 1 - a.droop * 0.45
  const lid = clamp01(1 - a.droop * 0.55)
  out.eyeOpen = stepBlink(ms.blink, dt, rng, blinkRate) * lid

  // Gaze wanders less and drifts downward when tired.
  stepGaze(ms.gaze, dt, rng)
  const gazeDamp = 1 - a.droop * 0.5
  out.gazeX = ms.gaze.x * gazeDamp
  out.gazeY = ms.gaze.y * gazeDamp + a.droop * 0.2

  // Exhaustion nodding-off: the head drifts down (slow bob), then the fidget
  // pulse fires a "wake-up" jerk that briefly lifts it — a nod-off recovery.
  const jerk = stepFidget(ms.fidget, dt, rng, 5)
  const nodBase = a.droop * (0.14 + 0.1 * (0.5 + 0.5 * Math.sin(t * 0.55)))
  ms.headNod = expApproach(ms.headNod, nodBase, dt, 0.4)
  out.headNod = Math.max(0, ms.headNod * (1 - jerk * 0.9))

  // Idle weight-shift sway, amplified by tiredness and killed while collapsing;
  // trembling (high-frequency) adds in as health and warmth fail.
  const swayAmp = 2.5 * (1 - a.collapse) * (1 + a.droop * 0.4)
  const baseSway = Math.sin(t * 0.8) * swayAmp
  const trembleAmp = (clamp01((0.4 - a.vitality) / 0.4) * 1.6 + a.cold * 0.8) * (1 - a.collapse)
  const tremble = trembleAmp * Math.sin(t * 26)
  const swayX = baseSway + tremble
  out.swayX = swayX

  // Belly jiggle: drive the spring's velocity from the body's sway velocity and
  // the breath so a full belly lags and wobbles behind the motion.
  const swayVel = (swayX - ms.prevSway) / Math.max(dt, 1e-4)
  ms.prevSway = swayX
  ms.belly.velocity += (swayVel * 0.015 + breath * 0.6) * Math.min(dt, 0.05)
  stepSpring(ms.belly, 0, dt, BELLY_STIFFNESS, BELLY_DAMPING)
  out.bellyWobble = ms.belly.value * a.belly

  // Collapse: spring the eased amount toward the target so death is an animated
  // fall that overshoots a touch and settles, not an instant rotation.
  stepSpring(ms.collapse, a.collapse, dt, COLLAPSE_STIFFNESS, COLLAPSE_DAMPING)
  out.collapse = Math.max(0, ms.collapse.value)

  return out
}
