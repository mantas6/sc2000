import { describe, expect, it } from 'vitest'
import {
  createBlinkState,
  createGazeState,
  createFidgetState,
  createMotionState,
  expApproach,
  smoothAppearance,
  stepBlink,
  stepFidget,
  stepGaze,
  stepMotion,
  stepSpring,
  type Spring,
} from '../game/render/animation'
import { deriveAppearance } from '../game/render/character'
import { createInitialState } from '../game/initialState'
import type { Appearance } from '../game/render/character'
import type { GameState } from '../game/types'

/** Same healthy-baseline builder used by the appearance tests. */
function make(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState()
  const healthy: GameState = {
    ...base,
    health: 1000,
    healthcap: 1000,
    hydration: 2500,
    hydrationcap: 2500,
    energy: 10000,
    energycap: 10000,
    stamina: 200,
    staminacap: 200,
    stomach: 100,
    stomachcap: 500,
    temp: 36.6,
  }
  return { ...healthy, ...overrides }
}

/** A deterministic rng that cycles through a fixed sequence. */
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('expApproach', () => {
  it('moves a fraction 1 - 1/e of the way when dt equals tau', () => {
    // After one time-constant the remaining gap should be ~1/e.
    expect(expApproach(0, 1, 1, 1)).toBeCloseTo(1 - Math.exp(-1), 6)
  })

  it('is monotonic toward and converges on the target', () => {
    let v = 0
    for (let i = 0; i < 200; i++) v = expApproach(v, 10, 1 / 60, 0.3)
    expect(v).toBeGreaterThan(9.99)
    expect(v).toBeLessThanOrEqual(10)
  })

  it('never overshoots the target', () => {
    let v = 0
    let prev = -1
    for (let i = 0; i < 500; i++) {
      v = expApproach(v, 5, 1 / 60, 0.1)
      expect(v).toBeLessThanOrEqual(5)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('snaps to target for a non-positive tau', () => {
    expect(expApproach(3, 9, 0.016, 0)).toBe(9)
  })

  it('holds current for a non-positive dt', () => {
    expect(expApproach(3, 9, 0, 0.5)).toBe(3)
  })
})

describe('stepSpring', () => {
  it('settles at the target', () => {
    const s: Spring = { value: 0, velocity: 0 }
    for (let i = 0; i < 600; i++) stepSpring(s, 1, 1 / 60, 90, 14)
    expect(s.value).toBeCloseTo(1, 2)
    expect(Math.abs(s.velocity)).toBeLessThan(0.01)
  })

  it('overshoots when under-damped (gives the collapse its bounce)', () => {
    const s: Spring = { value: 0, velocity: 0 }
    let maxValue = 0
    for (let i = 0; i < 600; i++) {
      stepSpring(s, 1, 1 / 60, 120, 4)
      maxValue = Math.max(maxValue, s.value)
    }
    expect(maxValue).toBeGreaterThan(1)
  })
})

describe('stepBlink', () => {
  it('keeps the eyes open until a blink is due', () => {
    const s = createBlinkState()
    // Well before the initial cooldown elapses the eyes stay wide.
    expect(stepBlink(s, 0.1, () => 0.9)).toBe(1)
  })

  it('closes the eye at mid-blink and reopens fully', () => {
    const s = createBlinkState()
    // rng >= DOUBLE_BLINK_CHANCE so no double-blink is queued.
    const rng = () => 0.99
    // Run out the initial cooldown.
    let openness = 1
    for (let i = 0; i < 40 && s.progress < 0; i++) openness = stepBlink(s, 0.1, rng)
    expect(s.progress).toBeGreaterThanOrEqual(0)
    // Now step through the blink and record the minimum openness.
    let min = 1
    for (let i = 0; i < 40; i++) {
      openness = stepBlink(s, 0.02, rng)
      min = Math.min(min, openness)
      if (s.progress < 0) break
    }
    expect(min).toBeLessThan(0.2) // eye clearly shut mid-blink
    expect(openness).toBeCloseTo(1, 5) // reopened afterward
  })

  it('queues a second blink when the rng rolls a double-blink', () => {
    const s = createBlinkState()
    // rng below DOUBLE_BLINK_CHANCE (0.35) triggers a double-blink.
    const rng = () => 0.1
    // Advance to the first blink starting.
    for (let i = 0; i < 40 && s.progress < 0; i++) stepBlink(s, 0.1, rng)
    expect(s.queued).toBe(1)
    // Finish the first blink; a short gap cooldown to the second should be set.
    for (let i = 0; i < 40 && s.progress >= 0; i++) stepBlink(s, 0.02, rng)
    expect(s.queued).toBe(0)
    expect(s.cooldown).toBeLessThan(0.5)
  })
})

describe('stepGaze', () => {
  it('picks a target and saccades toward it', () => {
    const s = createGazeState()
    const rng = seqRng([0.9, 0.1]) // targetX ~ +0.56, targetY ~ -0.4
    // First step trips the cooldown and sets a target.
    stepGaze(s, 2, rng)
    const tx = s.targetX
    expect(tx).not.toBe(0)
    for (let i = 0; i < 60; i++) stepGaze(s, 1 / 60, () => 0.5)
    expect(s.x).toBeCloseTo(tx, 2)
  })

  it('stays within the eye-travel bounds', () => {
    const s = createGazeState()
    const rng = seqRng([0, 1, 0.5])
    for (let i = 0; i < 500; i++) {
      stepGaze(s, 1 / 60, rng)
      expect(Math.abs(s.x)).toBeLessThanOrEqual(0.75)
      expect(Math.abs(s.y)).toBeLessThanOrEqual(0.55)
    }
  })
})

describe('stepFidget', () => {
  it('fires an impulse when the cooldown elapses, then decays to 0', () => {
    const s = createFidgetState()
    const rng = () => 0.5
    // Cross the initial cooldown to fire.
    let fired = 0
    for (let i = 0; i < 100 && fired === 0; i++) fired = stepFidget(s, 0.1, rng)
    expect(fired).toBe(1)
    // It then decays back toward 0.
    for (let i = 0; i < 40; i++) stepFidget(s, 0.02, rng)
    expect(s.impulse).toBeLessThan(1)
  })
})

describe('smoothAppearance', () => {
  it('eases slow params toward the target rather than snapping', () => {
    const start = deriveAppearance(make())
    const target = deriveAppearance(make({ temp: 20 })) // full cold
    const smoothed: Appearance = { ...start }
    smoothAppearance(smoothed, target, 1 / 60)
    // After one frame it has moved toward, but not reached, full cold.
    expect(smoothed.cold).toBeGreaterThan(0)
    expect(smoothed.cold).toBeLessThan(target.cold)
  })

  it('converges on the target over time', () => {
    const start = deriveAppearance(make())
    const target = deriveAppearance(make({ hydration: 0 })) // full dryness
    const smoothed: Appearance = { ...start }
    for (let i = 0; i < 600; i++) smoothAppearance(smoothed, target, 1 / 60)
    expect(smoothed.dryness).toBeCloseTo(1, 2)
  })

  it('passes event/discrete fields straight through', () => {
    const smoothed = deriveAppearance(make())
    const target = deriveAppearance(make())
    target.vomit = 0.7
    target.damage = 0.5
    target.dead = true
    target.collapse = 1
    smoothAppearance(smoothed, target, 1 / 60)
    expect(smoothed.vomit).toBe(0.7)
    expect(smoothed.damage).toBe(0.5)
    expect(smoothed.dead).toBe(true)
    expect(smoothed.collapse).toBe(1)
  })
})

describe('stepMotion', () => {
  it('produces finite, in-range motion for a healthy figure', () => {
    const ms = createMotionState()
    const a = deriveAppearance(make())
    const rng = () => 0.5
    let t = 0
    for (let i = 0; i < 120; i++) {
      t += 1 / 60
      const m = stepMotion(ms, a, 1 / 60, t, rng)
      expect(Number.isFinite(m.breath)).toBe(true)
      expect(m.breath).toBeGreaterThanOrEqual(-1)
      expect(m.breath).toBeLessThanOrEqual(1)
      expect(m.eyeOpen).toBeGreaterThanOrEqual(0)
      expect(m.eyeOpen).toBeLessThanOrEqual(1)
      expect(Number.isFinite(m.swayX)).toBe(true)
      expect(Number.isFinite(m.bellyWobble)).toBe(true)
    }
  })

  it('reuses the same output object each frame (no per-frame allocation)', () => {
    const ms = createMotionState()
    const a = deriveAppearance(make())
    const m1 = stepMotion(ms, a, 1 / 60, 0.1, () => 0.5)
    const m2 = stepMotion(ms, a, 1 / 60, 0.2, () => 0.5)
    expect(m1).toBe(m2)
  })

  it('springs the collapse toward 1 for a dead figure', () => {
    const ms = createMotionState()
    const a = deriveAppearance(make({ health: 1, healthcap: 1000 }))
    expect(a.collapse).toBe(1)
    let t = 0
    for (let i = 0; i < 300; i++) {
      t += 1 / 60
      stepMotion(ms, a, 1 / 60, t, () => 0.5)
    }
    expect(ms.out.collapse).toBeCloseTo(1, 1)
  })

  it('keeps the eyes heavier-lidded when exhausted than when alert', () => {
    const alert = createMotionState()
    const tired = createMotionState()
    const aAlert = deriveAppearance(make({ energy: 10000, energycap: 10000 }))
    const aTired = deriveAppearance(make({ energy: 0, energycap: 10000 }))
    const rng = () => 0.99 // never blink, isolate the lid droop
    let openAlert = 1
    let openTired = 1
    let t = 0
    for (let i = 0; i < 30; i++) {
      t += 1 / 60
      openAlert = stepMotion(alert, aAlert, 1 / 60, t, rng).eyeOpen
      openTired = stepMotion(tired, aTired, 1 / 60, t, rng).eyeOpen
    }
    expect(openTired).toBeLessThan(openAlert)
  })
})
