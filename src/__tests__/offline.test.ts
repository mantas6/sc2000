/**
 * Tests for offline catch-up (`computeOffline`): the elapsed-time → tick-count
 * math, the 8-hour cap, and the never-die clamp that stops simulation just
 * before a fatal tick. Uses a fixed `randp` for determinism.
 */

import { describe, expect, it } from 'vitest'
import { tick } from '../game/engine'
import { createInitialState } from '../game/initialState'
import { OFFLINE_MAX_TICKS, OFFLINE_TICK_MS, computeOffline } from '../game/offline'
import type { GameState } from '../game/types'

/** Deterministic RNG for the thought roll (never triggers a random thought). */
const fixedRandp = () => 0

describe('computeOffline — elapsed → ticks', () => {
  it('does nothing when no time has elapsed', () => {
    const state = createInitialState()
    const { state: after, summary } = computeOffline(state, 1000, 1000, { randp: fixedRandp })
    expect(after).toBe(state)
    expect(summary.ticks).toBe(0)
    expect(summary.elapsedMs).toBe(0)
  })

  it('does nothing when the clock ran backwards', () => {
    const state = createInitialState()
    const { summary } = computeOffline(state, 5000, 1000, { randp: fixedRandp })
    expect(summary.ticks).toBe(0)
    expect(summary.elapsedMs).toBe(0)
  })

  it('simulates one tick per elapsed second (floored)', () => {
    const state = createInitialState()
    const savedAt = 0
    const now = 10 * OFFLINE_TICK_MS + 500 // 10.5 s → 10 ticks
    const { state: after, summary } = computeOffline(state, savedAt, now, { randp: fixedRandp })
    expect(summary.ticks).toBe(10)
    expect(after.time).toBe(state.time + 10)
  })

  it('matches running the pure tick() the same number of times', () => {
    const state = createInitialState()
    const now = 25 * OFFLINE_TICK_MS
    const { state: viaOffline } = computeOffline(state, 0, now, { randp: fixedRandp })

    let manual: GameState = state
    for (let i = 0; i < 25; i++) {
      manual = tick(manual, { randp: fixedRandp }).state
    }
    expect(viaOffline).toEqual(manual)
  })

  it('reports the money delta accrued while away', () => {
    // Give the character a steady income so money climbs each tick.
    const state: GameState = { ...createInitialState(), moneyincome: 100, taxes: 1 }
    const now = 5 * OFFLINE_TICK_MS
    const { summary } = computeOffline(state, 0, now, { randp: fixedRandp })
    expect(summary.ticks).toBe(5)
    expect(summary.moneyDelta).toBeCloseTo(summary.after.money - state.money)
    expect(summary.moneyDelta).toBeGreaterThan(0)
  })

  it('is a no-op while paused', () => {
    const state: GameState = { ...createInitialState(), pause: true }
    const now = 100 * OFFLINE_TICK_MS
    const { state: after, summary } = computeOffline(state, 0, now, { randp: fixedRandp })
    expect(after).toBe(state)
    expect(summary.ticks).toBe(0)
  })
})

describe('computeOffline — 8-hour cap', () => {
  it('never simulates more than OFFLINE_MAX_TICKS and flags the clamp', () => {
    const state = createInitialState()
    // Away for a full day — far past the cap.
    const now = 24 * 60 * 60 * OFFLINE_TICK_MS
    const { summary } = computeOffline(state, 0, now, { randp: fixedRandp })
    expect(summary.ticks).toBeLessThanOrEqual(OFFLINE_MAX_TICKS)
    expect(summary.cappedByTime).toBe(true)
  })

  it('does not flag the cap when within the window', () => {
    const state = createInitialState()
    const now = 60 * OFFLINE_TICK_MS
    const { summary } = computeOffline(state, 0, now, { randp: fixedRandp })
    expect(summary.cappedByTime).toBe(false)
  })
})

describe('computeOffline — never-die clamp', () => {
  it('stops before a fatal tick and leaves the character alive', () => {
    // A near-death state: almost no health and nothing to sustain it, so the
    // very next ticks would kill the character.
    const doomed: GameState = {
      ...createInitialState(),
      health: 1,
      energy: 0,
      hydration: 0,
      stomach: 0,
    }
    const now = 10 * OFFLINE_TICK_MS
    const { state: after, summary } = computeOffline(doomed, 0, now, { randp: fixedRandp })

    expect(summary.stoppedBeforeDeath).toBe(true)
    // Fewer ticks ran than the elapsed budget (it bailed early)…
    expect(summary.ticks).toBeLessThan(10)
    // …and the character is NOT reset to a fresh life (health didn't reset to
    // the full initial 1000, which is what an in-tick death would produce).
    expect(after.health).not.toBe(createInitialState().health)
    expect(after.health).toBeGreaterThan(0)
  })

  it('does not flag a death stop for a healthy character', () => {
    const state = createInitialState()
    const now = 30 * OFFLINE_TICK_MS
    const { summary } = computeOffline(state, 0, now, { randp: fixedRandp })
    expect(summary.stoppedBeforeDeath).toBe(false)
    expect(summary.ticks).toBe(30)
  })
})
