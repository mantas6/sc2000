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
 * figure looks the same at any canvas size. All motion derives from `t`.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  appearance: Appearance,
  t: number,
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
  const shiver = appearance.cold * Math.sin(t * 34) * 1.6

  ctx.save()
  // Centre the design box in the surface, then apply the fit scale.
  ctx.translate(w / 2, h / 2)
  ctx.scale(scale, scale)
  ctx.translate(-BOX_W / 2, -BOX_H / 2)

  // Collapse: rotate the whole figure down around the feet.
  if (appearance.collapse > 0) {
    const pivotX = BOX_W / 2
    const pivotY = 224
    ctx.translate(pivotX, pivotY)
    ctx.rotate(appearance.collapse * (Math.PI / 2) * 0.92)
    ctx.translate(-pivotX, -pivotY)
  }

  ctx.translate(shiver, 0)

  const cx = BOX_W / 2
  // Breathing raises the chest a touch and swells the torso.
  const breath = Math.sin(t * appearance.breathRate * Math.PI * 2)
  const breathRise = breath * appearance.breathDepth * 3
  const chestSwell = (breath * 0.5 + 0.5) * appearance.breathDepth
  // Low energy slumps the shoulders / head downward.
  const slump = appearance.droop * 10

  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const shoulderY = 96 + slump - breathRise
  const hipY = 150

  /* Legs */
  ctx.strokeStyle = outline
  ctx.fillStyle = rgb(skin)
  ctx.lineWidth = 3
  const legW = 15
  const feetY = 216
  for (const dir of [-1, 1]) {
    const lx = cx + dir * 16 - legW / 2
    roundRect(ctx, lx, hipY - 6, legW, feetY - (hipY - 6), 8)
    ctx.fill()
    ctx.stroke()
  }

  /* Arms — hang lower and swing slightly as posture slumps */
  const armW = 12
  const armLen = 62 + slump * 0.4
  for (const dir of [-1, 1]) {
    ctx.save()
    const shoulderX = cx + dir * 30
    ctx.translate(shoulderX, shoulderY + 6)
    ctx.rotate(dir * (0.12 + appearance.droop * 0.1) + breath * 0.02 * dir)
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

  /* Belly — an ellipse that grows with stomach fullness */
  if (appearance.belly > 0.02) {
    const bellyR = 12 + appearance.belly * 22
    ctx.beginPath()
    ctx.ellipse(cx, hipY - 6, bellyR, bellyR * 0.85, 0, 0, Math.PI * 2)
    ctx.fillStyle = rgb(mix(skin, [40, 30, 26], 0.08))
    ctx.fill()
    ctx.stroke()
  }

  /* Neck */
  ctx.fillStyle = rgb(skin)
  roundRect(ctx, cx - 8, torsoTop - 14, 16, 20, 6)
  ctx.fill()
  ctx.stroke()

  /* Head */
  const headR = 30
  const headY = torsoTop - 14 - headR + 4 + slump * 0.2
  ctx.beginPath()
  ctx.arc(cx, headY, headR, 0, Math.PI * 2)
  ctx.fillStyle = rgb(skin)
  ctx.fill()
  ctx.stroke()

  /* Cheeks — flushed when hot, bluish nose-tip when cold */
  if (appearance.hot > 0.05) {
    ctx.fillStyle = rgb([220, 90, 80], 0.35 * appearance.hot)
    for (const dir of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(cx + dir * 15, headY + 6, 7, 5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (appearance.cold > 0.05) {
    ctx.fillStyle = rgb([120, 160, 220], 0.5 * appearance.cold)
    ctx.beginPath()
    ctx.ellipse(cx, headY + 10, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /* Eyes — blink periodically; droop keeps them half-lidded */
  const eyeY = headY - 4
  const eyeDX = 11
  const eyeR = 5
  // Blink: brief closure every ~4s.
  const blinkCycle = t % 4
  const blinking = blinkCycle < 0.14
  const openBase = clamp01(1 - appearance.droop * 0.7)
  const open = blinking ? 0.05 : Math.max(0.05, openBase)
  for (const dir of [-1, 1]) {
    const ex = cx + dir * eyeDX
    // Eye white / socket.
    ctx.fillStyle = rgb([250, 250, 250])
    ctx.beginPath()
    ctx.ellipse(ex, eyeY, eyeR, eyeR * open, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 1.5
    ctx.stroke()
    // Pupil (only when reasonably open).
    if (open > 0.25) {
      ctx.fillStyle = rgb([40, 34, 30])
      ctx.beginPath()
      ctx.arc(ex, eyeY, eyeR * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.lineWidth = 3
  ctx.strokeStyle = outline

  /* Mouth — expression shifts with distress (pallor / temp / vomit) */
  const mouthY = headY + 15
  const distress = clamp01(appearance.pallor * 0.6 + appearance.hot * 0.4 + appearance.cold * 0.4)
  ctx.beginPath()
  if (appearance.vomit > 0.05) {
    // Open mouth mid-heave.
    ctx.ellipse(cx, mouthY, 6, 6, 0, 0, Math.PI * 2)
  } else {
    // Smile when healthy, frown when distressed.
    const curve = lerp(6, -6, distress)
    ctx.moveTo(cx - 8, mouthY)
    ctx.quadraticCurveTo(cx, mouthY + curve, cx + 8, mouthY)
  }
  ctx.stroke()

  /* Sweat drops — trickle down when hot */
  const sweatN = Math.round(appearance.hot * 4)
  ctx.fillStyle = rgb([120, 190, 235], 0.85)
  for (let i = 0; i < sweatN; i++) {
    const phase = (t * 0.6 + i * 0.37) % 1
    const sx = cx + (i % 2 === 0 ? -1 : 1) * (18 + (i % 3) * 3)
    const sy = headY - 18 + phase * 44
    ctx.beginPath()
    ctx.ellipse(sx, sy, 2.2, 3.2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /* Breath puffs — fog exhaled when cold */
  if (appearance.cold > 0.15) {
    const period = 2.4
    for (let i = 0; i < 2; i++) {
      const phase = ((t + i * (period / 2)) % period) / period
      const alpha = (1 - phase) * 0.4 * appearance.cold
      const px = cx + 10 + phase * 26
      const py = mouthY + 2 - phase * 10
      ctx.fillStyle = rgb([235, 240, 250], alpha)
      ctx.beginPath()
      ctx.arc(px, py, 4 + phase * 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /* Vomit — greenish stream from the mouth while the cue is active */
  if (appearance.vomit > 0.05) {
    const n = 6
    for (let i = 0; i < n; i++) {
      const phase = (t * 1.6 + i * 0.18) % 1
      const vx = cx + Math.sin(i * 1.7) * 6
      const vy = mouthY + 4 + phase * 40
      ctx.fillStyle = rgb([120, 170, 70], appearance.vomit * (1 - phase))
      ctx.beginPath()
      ctx.ellipse(vx, vy, 3 + phase * 2, 4 + phase * 3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()

  /* Damage flash — a brief red wash over the whole surface */
  if (appearance.damage > 0.01) {
    ctx.save()
    ctx.fillStyle = rgb([255, 60, 60], appearance.damage * 0.35)
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }
}
