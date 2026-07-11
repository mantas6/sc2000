/**
 * Pure onboarding guidance derived from the game state — the data behind the
 * contextual hint bar and the danger styling on the vitals bars.
 *
 * DOM-free and non-mutating: every function is a pure read of `GameState`, so
 * it can be unit-tested without React and never touches simulation numbers.
 *
 * WHY NOT A PLAIN FILL-% THRESHOLD: several vitals (energy, hydration) have very
 * large caps that the character never fills — energy sits in the low hundreds
 * against a 10000 cap, so its bar reads ~2% even when the character is in no
 * danger. Colouring those bars red by raw fill-fraction would make a fresh game
 * look like an emergency, which defeats the point of the onboarding work. So
 * danger for the large-cap vitals is measured against how close the value is to
 * the zero-floor where the engine actually starts draining health, while
 * bounded vitals (health, stamina) use their fill fraction directly, and
 * temperature uses proximity to its lethal bands.
 */

import type { GameState } from './types'

/** Severity of a vital's danger, or `null` when the vital is comfortable. */
export type DangerLevel = 'warn' | 'critical' | null

/** The six vitals shown as bars in the stats panel. */
export type VitalKind = 'health' | 'stamina' | 'stomach' | 'energy' | 'hydration' | 'temp'

/* ------------------------------------------------------------------ *
 * Thresholds
 * ------------------------------------------------------------------ */

/** Bounded-vital fill fractions (health, stamina): warn at 35%, critical 15%. */
const RATIO_WARN = 0.35
const RATIO_CRITICAL = 0.15

/** Stomach fill fractions — near-empty is the danger (empty stomach hurts). */
const STOMACH_WARN = 0.12
const STOMACH_CRITICAL = 0.05

/** Large-cap vitals — absolute distance to the zero-floor that drains health. */
const ENERGY_WARN = 120
const ENERGY_CRITICAL = 30
const HYDRATION_WARN = 120
const HYDRATION_CRITICAL = 30

/** Temperature bands (°C) — approaching the engine's danger/lethal states. */
const TEMP_WARN_HOT = 38.5
const TEMP_CRITICAL_HOT = 41
const TEMP_WARN_COLD = 35
const TEMP_CRITICAL_COLD = 33

/** Danger from a fill fraction against `warn`/`crit` thresholds. */
function ratioDanger(value: number, cap: number, warn: number, crit: number): DangerLevel {
  const ratio = cap > 0 ? value / cap : 0
  if (ratio <= crit) return 'critical'
  if (ratio <= warn) return 'warn'
  return null
}

/** Danger from an absolute value against `warn`/`crit` floors. */
function absoluteDanger(value: number, warn: number, crit: number): DangerLevel {
  if (value <= crit) return 'critical'
  if (value <= warn) return 'warn'
  return null
}

/**
 * The danger level for a single vital, using the per-vital measure documented
 * above. Drives the amber/critical styling on {@link StatBar}.
 */
export function statDanger(kind: VitalKind, g: GameState): DangerLevel {
  switch (kind) {
    case 'health':
      return ratioDanger(g.health, g.healthcap, RATIO_WARN, RATIO_CRITICAL)
    case 'stamina':
      return ratioDanger(g.stamina, g.staminacap, RATIO_WARN, RATIO_CRITICAL)
    case 'stomach':
      return ratioDanger(g.stomach, g.stomachcap, STOMACH_WARN, STOMACH_CRITICAL)
    case 'energy':
      return absoluteDanger(g.energy, ENERGY_WARN, ENERGY_CRITICAL)
    case 'hydration':
      return absoluteDanger(g.hydration, HYDRATION_WARN, HYDRATION_CRITICAL)
    case 'temp':
      if (g.temp >= TEMP_CRITICAL_HOT || g.temp <= TEMP_CRITICAL_COLD) return 'critical'
      if (g.temp >= TEMP_WARN_HOT || g.temp <= TEMP_WARN_COLD) return 'warn'
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Contextual hints
 * ------------------------------------------------------------------ */

/** A one-line contextual hint tied to the vital that triggered it. */
export interface Hint {
  /** Stable key (also the React key / test handle). */
  id: VitalKind | 'temp-cold' | 'temp-hot'
  /** The actionable one-liner shown to the player. */
  text: string
}

/**
 * The single most pressing contextual hint, or `null` when nothing is amiss.
 *
 * Deterministic (never random): candidates are evaluated in a fixed priority
 * order — most immediately lethal first — and the first vital found at its warn
 * threshold wins, so the hint never flickers between competing vitals. This
 * complements the random {@link ThoughtsLog} with concrete, tab-pointing
 * guidance and intentionally reuses the same thresholds as the bar styling.
 */
export function deriveHint(g: GameState): Hint | null {
  if (statDanger('health', g) !== null) {
    return { id: 'health', text: 'Health is critical — keep every vital topped up so your body can heal.' }
  }
  if (g.temp >= TEMP_WARN_HOT) {
    return { id: 'temp-hot', text: 'Overheating — switch to looser clothing from the Clothing tab.' }
  }
  if (g.temp <= TEMP_WARN_COLD) {
    return { id: 'temp-cold', text: 'Body temperature dropping — buy warmer clothing from the Clothing tab.' }
  }
  if (statDanger('hydration', g) !== null) {
    return { id: 'hydration', text: 'Hydration low — buy a drink from the Drink tab.' }
  }
  if (statDanger('energy', g) !== null) {
    return { id: 'energy', text: 'Energy low — eat food from the Food tab.' }
  }
  if (statDanger('stomach', g) !== null) {
    return { id: 'stomach', text: 'Your stomach is nearly empty — eat something from the Food tab.' }
  }
  if (statDanger('stamina', g) !== null) {
    return { id: 'stamina', text: 'Stamina low — hold off on working so it can recover.' }
  }
  return null
}
