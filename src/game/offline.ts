/**
 * Offline progression — pure catch-up simulation run when a save is loaded.
 *
 * When the player returns, we diff the save's `savedAt` timestamp against the
 * wall clock and replay the missed seconds by iterating the unchanged pure
 * {@link tick}. Two guards keep it fair and cheap:
 *
 *  - CAP: never simulate more than {@link OFFLINE_MAX_TICKS} (8 h) of ticks, so
 *    a save left for a week doesn't spend minutes catching up.
 *  - NEVER-DIE: if a tick would drop health to zero (the engine returns a
 *    `death`), stop *before* adopting that tick. The character is left in the
 *    last survivable state instead of being killed while the player was away.
 *
 * DOM-free and side-effect-free: it takes a state + timestamps and returns the
 * caught-up state plus a summary. The engine's per-tick numbers are untouched —
 * this only decides how many times to call `tick`.
 */

import { tick, type TickOptions } from './engine'
import type { GameState } from './types'

/** Wall-clock milliseconds per simulation tick (mirrors the 1s game loop). */
export const OFFLINE_TICK_MS = 1000

/** Hard cap on catch-up: 8 hours' worth of one-second ticks. */
export const OFFLINE_MAX_TICKS = 8 * 60 * 60

/** Summary of an offline catch-up, surfaced by the "Welcome back" modal. */
export interface OfflineSummary {
  /** Real time the player was away (millis, un-clamped). */
  elapsedMs: number
  /** Number of ticks actually simulated (0 when nothing happened). */
  ticks: number
  /** True when the away time exceeded the cap and was clamped. */
  cappedByTime: boolean
  /** True when simulation stopped early to avoid killing the character. */
  stoppedBeforeDeath: boolean
  /** State before catch-up (for computing notable vital changes). */
  before: GameState
  /** State after catch-up. */
  after: GameState
  /** Money gained (positive) or lost (negative) while away. */
  moneyDelta: number
}

/** Result of {@link computeOffline}: the caught-up state + its summary. */
export interface OfflineResult {
  state: GameState
  summary: OfflineSummary
}

/**
 * Simulate the time between `savedAt` and `now`, capped and clamped so it never
 * kills the character. Returns the original state unchanged (with a zero-tick
 * summary) when there is nothing to do — the game is paused, no time has
 * meaningfully elapsed, or the clock went backwards.
 *
 * `options.randp` is forwarded to {@link tick} so tests can make the run
 * deterministic.
 */
export function computeOffline(
  state: GameState,
  savedAt: number,
  now: number,
  options: TickOptions = {},
): OfflineResult {
  const elapsedMs = Math.max(0, now - savedAt)
  const rawTicks = Math.floor(elapsedMs / OFFLINE_TICK_MS)
  const cappedByTime = rawTicks > OFFLINE_MAX_TICKS
  const budget = Math.min(rawTicks, OFFLINE_MAX_TICKS)

  const base: OfflineSummary = {
    elapsedMs,
    ticks: 0,
    cappedByTime,
    stoppedBeforeDeath: false,
    before: state,
    after: state,
    moneyDelta: 0,
  }

  // Nothing to simulate: no elapsed budget, or the game is paused.
  if (budget <= 0 || state.pause) {
    return { state, summary: base }
  }

  let current = state
  let ran = 0
  let stoppedBeforeDeath = false

  for (let i = 0; i < budget; i++) {
    const result = tick(current, options)
    // Never let the player die while away: stop before adopting a lethal tick.
    if (result.death !== null) {
      stoppedBeforeDeath = true
      break
    }
    current = result.state
    ran++
  }

  return {
    state: current,
    summary: {
      ...base,
      ticks: ran,
      stoppedBeforeDeath,
      after: current,
      moneyDelta: current.money - state.money,
    },
  }
}
