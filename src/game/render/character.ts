/**
 * Canvas character — pure, React-free rendering module (build step 7).
 *
 * Two responsibilities, both free of DOM/React state:
 *
 *  - `deriveAppearance(state)` maps the raw {@link GameState} onto a small bag
 *    of *normalized* (mostly 0–1) parameters that describe how the little
 *    figure should look, per the TODO.md "Canvas character" mapping:
 *
 *      health   → pallor / damage tint       (`vitality`, `pallor`)
 *      temp     → cold (blue + shiver +       (`cold`, `hot`)
 *                 breath puffs) / hot (red + sweat)
 *      hydration→ skin dryness                (`dryness`)
 *      energy   → posture / eyelids           (`energy`, `droop`)
 *      stamina  → breathing rate / amplitude  (`breathRate`, `breathDepth`)
 *      stomach  → belly size                  (`belly`)
 *      death    → collapse                    (`collapse`, `dead`)
 *
 *  - `drawCharacter(ctx, appearance, t)` paints a simple original vector figure
 *    (head, torso, limbs) into a 2D context, animated purely from the time
 *    param `t` (seconds): breathing, shivering, blinking, and sweat / breath /
 *    vomit particles. No external assets, no persistent state — everything is a
 *    function of `(appearance, t)`, so animation is decoupled from the 1s tick.
 *
 * The transient `vomit` / `damage` cue fields are not derivable from a single
 * `GameState` snapshot (they are *events*), so `deriveAppearance` seeds them to
 * 0 and the canvas component overwrites them from its own event tracking.
 */

import { DEATH_HEALTH, NORMAL_TEMP, TEMP_LETHAL_COLD, TEMP_LETHAL_HOT } from '../constants'
import type { GameState } from '../types'

/** Normalized appearance parameters consumed by {@link drawCharacter}. */
export interface Appearance {
  /** Health as a fraction of its cap (1 = full, 0 = dead). */
  vitality: number
  /** Paleness / damage tint (0 = healthy, 1 = ashen). `1 - vitality`. */
  pallor: number
  /** Cold intensity below normal temperature (0 = normal, 1 = lethal cold). */
  cold: number
  /** Heat intensity above normal temperature (0 = normal, 1 = lethal hot). */
  hot: number
  /** Skin dryness from low hydration (0 = hydrated, 1 = parched). */
  dryness: number
  /** Energy as a fraction of its cap (1 = alert, 0 = spent). */
  energy: number
  /** Posture slump / eyelid droop (0 = upright, 1 = slumped). `1 - energy`. */
  droop: number
  /** Breaths per second — rises as stamina falls (heavier panting). */
  breathRate: number
  /** Breathing amplitude 0–1 — rises as stamina falls (deeper heaving). */
  breathDepth: number
  /** Belly fullness from stomach contents (0 = empty, 1 = distended). */
  belly: number
  /** Collapse progression toward the ground (0 = standing, 1 = collapsed). */
  collapse: number
  /** Whether the figure is effectively dead (drives the collapse pose). */
  dead: boolean
  /** Transient vomit cue 0–1 (event-driven; seeded 0, set by the canvas). */
  vomit: number
  /** Transient damage-flash cue 0–1 (event-driven; seeded 0, set by canvas). */
  damage: number
}

/**
 * Per-frame *animation* signals layered on top of {@link Appearance}.
 *
 * Where `Appearance` says *what state the figure is in* (derived, smoothed),
 * `Motion` carries the live, stateful wiggle that makes it feel alive: the
 * current breathing phase, blink/eyelid openness, eye direction, the exhaustion
 * head-nod, the idle weight-shift, belly jiggle, and the spring-eased collapse
 * amount. It is produced by the animation layer (`render/animation.ts`) and
 * consumed only by {@link drawCharacter}; keeping it separate leaves
 * `deriveAppearance` pure and snapshot-testable.
 */
export interface Motion {
  /** Breathing signal −1…1 from an accumulated phase (no jumps on rate change). */
  breath: number
  /** Eyelid openness 0 (shut) … 1 (wide), folding blinks + tired droop. */
  eyeOpen: number
  /** Horizontal eye/gaze direction −1…1. */
  gazeX: number
  /** Vertical eye/gaze direction −1…1. */
  gazeY: number
  /** Extra downward head tilt (radians) — exhaustion nodding-off. */
  headNod: number
  /** Horizontal weight-shift / tremble offset in design px. */
  swayX: number
  /** Belly jiggle offset in design px (lags the body's sway). */
  bellyWobble: number
  /** Spring-eased collapse amount 0…~1 (animated fall + settle). */
  collapse: number
}

/** A still, neutral pose — used when {@link drawCharacter} is called bare. */
export const NEUTRAL_MOTION: Motion = {
  breath: 0,
  eyeOpen: 1,
  gazeX: 0,
  gazeY: 0,
  headNod: 0,
  swayX: 0,
  bellyWobble: 0,
  collapse: 0,
}

/** Reused left/right iteration order — avoids a per-frame array allocation. */
const DIRS = [-1, 1] as const

/** Clamp a number into the inclusive `[0, 1]` range. */
function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/** Linear interpolation between `a` and `b` by `t` (unclamped). */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Smooth Hermite ease of `x` across the `[edge0, edge1]` range → `[0, 1]`. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1
  const k = clamp01((x - edge0) / (edge1 - edge0))
  return k * k * (3 - 2 * k)
}

/** Safe `value / cap` clamped to `[0, 1]`; guards a non-positive cap. */
function safeRatio(value: number, cap: number): number {
  if (cap <= 0) return 0
  return clamp01(value / cap)
}

/**
 * Health fraction at or below which the figure is treated as dead / collapsing.
 * Death in the engine happens at `health <= DEATH_HEALTH` and immediately
 * resets, so this only ever shows for the dying frame(s); the canvas component
 * additionally forces the collapse pose while a death summary is pending.
 */
const DEAD_VITALITY = 0.02

/** Vitality below which the collapse pose starts ramping in. */
const COLLAPSE_START = 0.1

/**
 * Map raw game state onto normalized rendering parameters.
 *
 * Pure and total: never mutates `state`, never touches the DOM, and returns
 * finite numbers for any (even degenerate) input. Threshold anchors are drawn
 * from the shared engine constants so the visuals track the simulation.
 */
export function deriveAppearance(state: GameState): Appearance {
  const vitality = safeRatio(state.health, state.healthcap)
  const pallor = clamp01(1 - vitality)

  // Temperature: 0 at normal, ramping to 1 at the lethal cold / hot bounds.
  const cold = clamp01((NORMAL_TEMP - state.temp) / (NORMAL_TEMP - TEMP_LETHAL_COLD))
  const hot = clamp01((state.temp - NORMAL_TEMP) / (TEMP_LETHAL_HOT - NORMAL_TEMP))

  const hydration = safeRatio(state.hydration, state.hydrationcap)
  const dryness = clamp01(1 - hydration)

  const energy = safeRatio(state.energy, state.energycap)
  const droop = clamp01(1 - energy)

  // Stamina: full → calm & slow; empty → fast & heavy breathing.
  const stamina = safeRatio(state.stamina, state.staminacap)
  const exertion = 1 - stamina
  const breathRate = lerp(0.2, 0.9, exertion)
  const breathDepth = lerp(0.35, 1, exertion)

  const belly = safeRatio(state.stomach, state.stomachcap)

  // Collapse ramps in as vitality nears zero; also fires at true death health.
  const dyingRamp = clamp01((COLLAPSE_START - vitality) / COLLAPSE_START)
  const dead = state.health <= DEATH_HEALTH || vitality <= DEAD_VITALITY
  const collapse = dead ? 1 : dyingRamp

  return {
    vitality,
    pallor,
    cold,
    hot,
    dryness,
    energy,
    droop,
    breathRate,
    breathDepth,
    belly,
    collapse,
    dead,
    vomit: 0,
    damage: 0,
  }
}

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

/** An `[r, g, b]` colour triple. */
type RGB = [number, number, number]

/** Interpolate between two RGB triples by `t` (0–1). */
function mix(a: RGB, b: RGB, t: number): RGB {
  const k = clamp01(t)
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]
}

/** Format an RGB triple (optionally with alpha) as a CSS colour string. */
function rgb([r, g, b]: RGB, a = 1): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
}

/** Design-space dimensions the figure is laid out in (then scaled to fit). */
const BOX_W = 180
const BOX_H = 240

const SKIN_BASE: RGB = [235, 199, 172]
const SKIN_PALE: RGB = [205, 198, 196]
const SKIN_COLD: RGB = [150, 178, 214]
const SKIN_HOT: RGB = [226, 128, 118]

/**
 * Logical (CSS-pixel) size of the drawing surface. The canvas component scales
 * the context by `devicePixelRatio` for HiDPI, so the backing store is larger
 * than the CSS box; dividing by the transform's scale recovers CSS pixels.
 * Falls back gracefully when `getTransform` is unavailable (e.g. jsdom).
 */
function logicalSize(ctx: CanvasRenderingContext2D): { w: number; h: number } {
  const canvas = ctx.canvas
  let sx = 1
  let sy = 1
  if (typeof ctx.getTransform === 'function') {
    try {
      const m = ctx.getTransform()
      if (m.a) sx = m.a
      if (m.d) sy = m.d
    } catch {
      /* ignore — fall back to raw backing-store size */
    }
  }
  return { w: canvas.width / sx, h: canvas.height / sy }
}

/** Rounded-rectangle path helper (torso / limb bodies). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * Paint the character. Layout happens in a fixed {@link BOX_W}×{@link BOX_H}
 * design space that is centred and scaled to fill the current context, so the
 * figure looks the same at any canvas size.
 *
 * `t` (seconds) drives the cheap, purely-periodic motion (shiver, sweat drips,
 * breath fog). The stateful, organic motion — breathing phase, blinks, gaze,
 * the exhaustion nod, idle sway, belly jiggle and the spring-eased collapse —
 * arrives pre-computed in {@link Motion}; when omitted the figure stands in a
 * still {@link NEUTRAL_MOTION} pose.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  appearance: Appearance,
  t: number,
  motion: Motion = NEUTRAL_MOTION,
): void {
  const { w, h } = logicalSize(ctx)
  if (!w || !h) return

  const scale = Math.min(w / BOX_W, h / BOX_H)

  // Skin colour: pale first, then push toward cold/hot whichever dominates.
  let skin = mix(SKIN_BASE, SKIN_PALE, appearance.pallor * 0.85)
  if (appearance.cold >= appearance.hot) {
    skin = mix(skin, SKIN_COLD, appearance.cold * 0.6)
  } else {
    skin = mix(skin, SKIN_HOT, appearance.hot * 0.6)
  }
  // Dry skin reads slightly duller / darker.
  skin = mix(skin, [188, 158, 138], appearance.dryness * 0.18)

  const outline = rgb(mix(skin, [40, 30, 26], 0.55))
  // Shivering: two detuned sines give a nervous "chatter" rather than a hum;
  // amplitude scales hard with cold so it reads as violent shaking near-lethal.
  const shiver = appearance.cold * (Math.sin(t * 34) * 0.7 + Math.sin(t * 57) * 0.3) * 1.9

  const breath = motion.breath
  const collapse = clamp01(motion.collapse)
  const cx = BOX_W / 2
  const feetY = 216

  ctx.save()
  // Centre the design box in the surface, then apply the fit scale.
  ctx.translate(w / 2, h / 2)
  ctx.scale(scale, scale)
  ctx.translate(-BOX_W / 2, -BOX_H / 2)

  /* Ground shadow — stays on the floor; widens & flattens as the figure falls,
     and slides a touch with the weight-shift so the body feels grounded. */
  {
    const shadowW = 44 * (1 + collapse * 0.55)
    const shadowH = 7 * (1 - collapse * 0.3)
    ctx.beginPath()
    ctx.ellipse(cx + motion.swayX * 0.5, 227, shadowW, shadowH, 0, 0, Math.PI * 2)
    ctx.fillStyle = rgb([0, 0, 0], 0.2 + collapse * 0.05)
    ctx.fill()
  }

  // Vomit choreography, read straight from the decaying cue (1 → 0):
  //   ~1.00–0.75  anticipation heave (lean in, chest coils)
  //   ~0.75–0.05  the stream flows and the head recoils back
  const vomit = appearance.vomit
  const heave = smoothstep(0.75, 1, vomit)
  const recoil = smoothstep(0.7, 0.2, vomit)
  const bodyLean = heave * 0.13 - recoil * 0.05

  ctx.save()
  // Collapse: rotate the whole figure down around the feet (spring-eased amount
  // gives an animated fall that overshoots slightly and settles).
  if (collapse > 0.001) {
    ctx.translate(cx, 224)
    ctx.rotate(collapse * (Math.PI / 2) * 0.92)
    ctx.translate(-cx, -224)
  }

  // Weight-shift / tremble slides the body; a matching lean rotates it about
  // the feet so the sway looks like shifting balance, not sliding on ice.
  ctx.translate(shiver + motion.swayX, 0)
  ctx.translate(cx, feetY)
  ctx.rotate(motion.swayX * 0.004 + bodyLean)
  ctx.translate(-cx, -feetY)

  const breathRise = breath * appearance.breathDepth * 3
  const chestSwell = (breath * 0.5 + 0.5) * appearance.breathDepth
  // Low energy slumps the shoulders / head downward.
  const slump = appearance.droop * 10
  // Heavy panting (spent stamina) hunches the shoulders forward; low health
  // adds a frail hunch of its own.
  const pant = clamp01((appearance.breathDepth - 0.55) / 0.45)
  const hunch = pant * 5 + smoothstep(0.4, 0, appearance.vitality) * 6

  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const shoulderY = 96 + slump + hunch - breathRise
  const hipY = 150

  /* Legs */
  ctx.strokeStyle = outline
  ctx.fillStyle = rgb(skin)
  ctx.lineWidth = 3
  const legW = 15
  for (const dir of DIRS) {
    const lx = cx + dir * 16 - legW / 2
    roundRect(ctx, lx, hipY - 6, legW, feetY - (hipY - 6), 8)
    ctx.fill()
    ctx.stroke()
  }

  /* Arms — hang lower and swing slightly as posture slumps; the trailing arm
     counter-swings with the weight-shift for a little life. */
  const armW = 12
  const armLen = 62 + slump * 0.4
  for (const dir of DIRS) {
    ctx.save()
    const shoulderX = cx + dir * 30
    ctx.translate(shoulderX, shoulderY + 6)
    ctx.rotate(
      dir * (0.12 + appearance.droop * 0.1) + breath * 0.02 * dir + motion.swayX * 0.01 * dir,
    )
    roundRect(ctx, -armW / 2, 0, armW, armLen, 6)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  /* Torso */
  const torsoW = 62 + chestSwell * 6
  const torsoTop = shoulderY
  const torsoH = hipY - shoulderY + 12
  ctx.fillStyle = rgb(skin)
  roundRect(ctx, cx - torsoW / 2, torsoTop, torsoW, torsoH, 20)
  ctx.fill()
  ctx.stroke()

  /* Belly — an ellipse that grows with stomach fullness and jiggles: it lags
     the body's sway (`bellyWobble`) and squashes/stretches with that offset. */
  if (appearance.belly > 0.02) {
    const wob = motion.bellyWobble
    const bellyR = 12 + appearance.belly * 22
    ctx.beginPath()
    ctx.ellipse(
      cx + wob,
      hipY - 6 + Math.abs(wob) * 0.12,
      bellyR + wob * 0.2,
      bellyR * 0.85 - Math.abs(wob) * 0.12,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fillStyle = rgb(mix(skin, [40, 30, 26], 0.08))
    ctx.fill()
    ctx.stroke()
  }

  /* Neck */
  ctx.fillStyle = rgb(skin)
  roundRect(ctx, cx - 8, torsoTop - 14, 16, 20, 6)
  ctx.fill()
  ctx.stroke()

  /* Head — bobs gently with the breath and droops with the exhaustion nod. */
  const headR = 30
  const headBob = breath * 1.2
  const nodDrop = motion.headNod * 55
  const headY = torsoTop - 14 - headR + 4 + slump * 0.2 + headBob + nodDrop
  // Recoil nudges the head backward (up) as the stream flows.
  const headX = cx - recoil * 3
  ctx.beginPath()
  ctx.arc(headX, headY, headR, 0, Math.PI * 2)
  ctx.fillStyle = rgb(skin)
  ctx.fill()
  ctx.stroke()

  /* Cheeks — flushed when hot, bluish nose-tip when cold */
  if (appearance.hot > 0.05) {
    ctx.fillStyle = rgb([220, 90, 80], 0.35 * appearance.hot)
    for (const dir of DIRS) {
      ctx.beginPath()
      ctx.ellipse(headX + dir * 15, headY + 6, 7, 5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (appearance.cold > 0.05) {
    ctx.fillStyle = rgb([120, 160, 220], 0.5 * appearance.cold)
    ctx.beginPath()
    ctx.ellipse(headX, headY + 10, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /* Eyes — openness comes from the blink/lid model; the pupils track gaze. */
  const eyeY = headY - 4
  const eyeDX = 11
  const eyeR = 5
  const open = Math.max(0.04, motion.eyeOpen)
  const gx = motion.gazeX * eyeR * 0.55
  const gy = motion.gazeY * eyeR * open * 0.6
  for (const dir of DIRS) {
    const ex = headX + dir * eyeDX
    // Eye white / socket.
    ctx.fillStyle = rgb([250, 250, 250])
    ctx.beginPath()
    ctx.ellipse(ex, eyeY, eyeR, eyeR * open, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 1.5
    ctx.stroke()
    // Pupil (only when reasonably open) — follows the gaze direction.
    if (open > 0.25) {
      ctx.fillStyle = rgb([40, 34, 30])
      ctx.beginPath()
      ctx.arc(ex + gx, eyeY + gy, eyeR * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.lineWidth = 3
  ctx.strokeStyle = outline

  /* Mouth — neutral smile → frown with distress, an open pant when winded, a
     wide "O" mid-heave. */
  const mouthY = headY + 15
  const distress = clamp01(appearance.pallor * 0.6 + appearance.hot * 0.4 + appearance.cold * 0.4)
  const panting = pant * clamp01(appearance.droop * 1.4 + 0.15)
  if (vomit > 0.05) {
    // Open mouth mid-heave, widening with the anticipation.
    const r = 5 + heave * 3
    ctx.beginPath()
    ctx.ellipse(headX, mouthY, r * 0.9, r, 0, 0, Math.PI * 2)
    ctx.fillStyle = rgb([90, 40, 40], 0.55)
    ctx.fill()
    ctx.stroke()
  } else if (panting > 0.2) {
    // Panting: the mouth gapes open on the inhale.
    const openAmt = 2 + panting * 5 * (0.55 + 0.45 * breath)
    ctx.beginPath()
    ctx.ellipse(headX, mouthY + 1, 5, openAmt, 0, 0, Math.PI * 2)
    ctx.fillStyle = rgb([90, 40, 40], 0.4)
    ctx.fill()
    ctx.stroke()
  } else {
    // Smile when healthy, frown when distressed.
    const curve = lerp(6, -6, distress)
    ctx.beginPath()
    ctx.moveTo(headX - 8, mouthY)
    ctx.quadraticCurveTo(headX, mouthY + curve, headX + 8, mouthY)
    ctx.stroke()
  }

  /* Sweat drops — bead near the brow then drip with gravity (accelerating,
     drifting a little), fading as they fall. */
  const sweatN = Math.round(appearance.hot * 5)
  for (let i = 0; i < sweatN; i++) {
    const phase = (t * 0.55 + i * 0.31) % 1
    const g = phase * phase // gravitational acceleration down the face
    const sx = headX + (i % 2 === 0 ? -1 : 1) * (15 + (i % 3) * 4) + Math.sin(phase * 6 + i) * 1.2
    const sy = headY - 20 + g * 52
    ctx.fillStyle = rgb([120, 190, 235], 0.85 * (1 - g * 0.25))
    ctx.beginPath()
    ctx.ellipse(sx, sy, 2.1 + phase * 0.7, 3 + phase * 1.4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /* Breath puffs — fog exhaled when cold, timed to the exhale (breath falling
     through zero) so it looks like actual breathing. */
  if (appearance.cold > 0.15) {
    const period = 2.4
    for (let i = 0; i < 2; i++) {
      const phase = ((t + i * (period / 2)) % period) / period
      const alpha = (1 - phase) * 0.4 * appearance.cold
      const px = headX + 10 + phase * 26
      const py = mouthY + 2 - phase * 10
      ctx.fillStyle = rgb([235, 240, 250], alpha)
      ctx.beginPath()
      ctx.arc(px, py, 4 + phase * 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /* Vomit — greenish stream arcing from the mouth while the cue is active. */
  if (vomit > 0.05) {
    const n = 7
    const flow = smoothstep(0.05, 0.6, vomit)
    for (let i = 0; i < n; i++) {
      const phase = (t * 1.6 + i * 0.16) % 1
      const vx = headX + Math.sin(i * 1.7) * 6 + phase * 3
      const vy = mouthY + 4 + phase * phase * 44
      ctx.fillStyle = rgb([120, 170, 70], vomit * flow * (1 - phase))
      ctx.beginPath()
      ctx.ellipse(vx, vy, 3 + phase * 2, 4 + phase * 3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
  ctx.restore()

  /* Damage flash — a brief red wash over the whole surface */
  if (appearance.damage > 0.01) {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = rgb([255, 60, 60], appearance.damage * 0.35)
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.restore()
  }
}
