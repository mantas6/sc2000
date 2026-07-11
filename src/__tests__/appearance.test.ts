import { describe, expect, it } from 'vitest'
import { deriveAppearance } from '../game/render/character'
import { createInitialState } from '../game/initialState'
import type { GameState } from '../game/types'

/**
 * Build a game state whose derived ratios are all at a "healthy baseline"
 * (every stat at its cap, normal temperature), then apply overrides. This lets
 * each test isolate a single mapping without the quirky initial-state ratios
 * (the real `createInitialState` starts with low energy/hydration relative to
 * their large caps).
 */
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

describe('deriveAppearance — healthy baseline', () => {
  const a = deriveAppearance(make())

  it('is fully vital with no pallor', () => {
    expect(a.vitality).toBe(1)
    expect(a.pallor).toBe(0)
  })

  it('has neutral temperature (no cold, no hot)', () => {
    expect(a.cold).toBe(0)
    expect(a.hot).toBe(0)
  })

  it('is hydrated and energetic (no dryness, no droop)', () => {
    expect(a.dryness).toBe(0)
    expect(a.energy).toBe(1)
    expect(a.droop).toBe(0)
  })

  it('breathes calmly and slowly at full stamina', () => {
    expect(a.breathRate).toBeCloseTo(0.2, 5)
    expect(a.breathDepth).toBeCloseTo(0.35, 5)
  })

  it('is upright and alive', () => {
    expect(a.dead).toBe(false)
    expect(a.collapse).toBe(0)
  })

  it('all normalized params stay within [0, 1]', () => {
    for (const key of ['vitality', 'pallor', 'cold', 'hot', 'dryness', 'energy', 'droop', 'breathDepth', 'belly', 'collapse'] as const) {
      expect(a[key]).toBeGreaterThanOrEqual(0)
      expect(a[key]).toBeLessThanOrEqual(1)
    }
  })
})

describe('deriveAppearance — low health', () => {
  it('raises pallor as vitality falls', () => {
    const a = deriveAppearance(make({ health: 100, healthcap: 1000 }))
    expect(a.vitality).toBeCloseTo(0.1, 5)
    expect(a.pallor).toBeCloseTo(0.9, 5)
  })
})

describe('deriveAppearance — temperature', () => {
  it('flags cold below normal (no heat)', () => {
    const a = deriveAppearance(make({ temp: 34 }))
    expect(a.cold).toBeGreaterThan(0)
    expect(a.hot).toBe(0)
    // 36.6 -> 32 spans the cold ramp; 34 is roughly the midpoint.
    expect(a.cold).toBeCloseTo((36.6 - 34) / (36.6 - 32), 5)
  })

  it('reaches full cold at the lethal-cold bound', () => {
    expect(deriveAppearance(make({ temp: 32 })).cold).toBe(1)
    expect(deriveAppearance(make({ temp: 20 })).cold).toBe(1)
  })

  it('flags hot above normal (no cold)', () => {
    const a = deriveAppearance(make({ temp: 41 }))
    expect(a.hot).toBeGreaterThan(0)
    expect(a.cold).toBe(0)
    expect(a.hot).toBeCloseTo((41 - 36.6) / (42 - 36.6), 5)
  })

  it('reaches full heat at the lethal-hot bound', () => {
    expect(deriveAppearance(make({ temp: 42 })).hot).toBe(1)
    expect(deriveAppearance(make({ temp: 50 })).hot).toBe(1)
  })
})

describe('deriveAppearance — dehydration', () => {
  it('maxes dryness at zero hydration', () => {
    const a = deriveAppearance(make({ hydration: 0, hydrationcap: 2500 }))
    expect(a.dryness).toBe(1)
  })

  it('scales dryness with the hydration deficit', () => {
    const a = deriveAppearance(make({ hydration: 500, hydrationcap: 2500 }))
    expect(a.dryness).toBeCloseTo(0.8, 5)
  })
})

describe('deriveAppearance — exhaustion', () => {
  it('droops with low energy', () => {
    const a = deriveAppearance(make({ energy: 0, energycap: 10000 }))
    expect(a.energy).toBe(0)
    expect(a.droop).toBe(1)
  })

  it('breathes fast and deep when stamina is spent', () => {
    const a = deriveAppearance(make({ stamina: 0, staminacap: 200 }))
    expect(a.breathRate).toBeCloseTo(0.9, 5)
    expect(a.breathDepth).toBeCloseTo(1, 5)
  })
})

describe('deriveAppearance — full stomach', () => {
  it('distends the belly to 1 at capacity', () => {
    const a = deriveAppearance(make({ stomach: 500, stomachcap: 500 }))
    expect(a.belly).toBe(1)
  })

  it('reports an empty belly at zero stomach', () => {
    const a = deriveAppearance(make({ stomach: 0, stomachcap: 500 }))
    expect(a.belly).toBe(0)
  })
})

describe('deriveAppearance — death', () => {
  it('collapses at the death-health threshold', () => {
    const a = deriveAppearance(make({ health: 1, healthcap: 1000 }))
    expect(a.dead).toBe(true)
    expect(a.collapse).toBe(1)
  })

  it('treats a zero health cap as dead rather than dividing by zero', () => {
    const a = deriveAppearance(make({ health: 0, healthcap: 0 }))
    expect(Number.isFinite(a.vitality)).toBe(true)
    expect(a.vitality).toBe(0)
    expect(a.dead).toBe(true)
    expect(a.collapse).toBe(1)
  })
})
