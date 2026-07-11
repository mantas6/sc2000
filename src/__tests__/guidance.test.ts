import { describe, expect, it } from 'vitest'
import { deriveHint, statDanger } from '../game/guidance'
import { createInitialState } from '../game/initialState'
import type { GameState } from '../game/types'

/** Fresh initial state with optional field overrides. */
function base(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides }
}

describe('statDanger', () => {
  it('flags nothing on a fresh game (large-cap vitals are not false alarms)', () => {
    const g = createInitialState()
    for (const kind of ['health', 'stamina', 'stomach', 'energy', 'hydration', 'temp'] as const) {
      expect(statDanger(kind, g)).toBeNull()
    }
  })

  it('grades bounded vitals by fill fraction (warn 35%, critical 15%)', () => {
    expect(statDanger('health', base({ health: 300, healthcap: 1000 }))).toBe('warn')
    expect(statDanger('health', base({ health: 100, healthcap: 1000 }))).toBe('critical')
    expect(statDanger('stamina', base({ stamina: 60, staminacap: 200 }))).toBe('warn')
    expect(statDanger('stamina', base({ stamina: 20, staminacap: 200 }))).toBe('critical')
  })

  it('grades large-cap vitals by absolute distance to the zero-floor', () => {
    expect(statDanger('energy', base({ energy: 100 }))).toBe('warn')
    expect(statDanger('energy', base({ energy: 20 }))).toBe('critical')
    expect(statDanger('hydration', base({ hydration: 100 }))).toBe('warn')
    expect(statDanger('hydration', base({ hydration: 20 }))).toBe('critical')
  })

  it('grades temperature by proximity to the lethal bands', () => {
    expect(statDanger('temp', base({ temp: 39 }))).toBe('warn')
    expect(statDanger('temp', base({ temp: 41 }))).toBe('critical')
    expect(statDanger('temp', base({ temp: 35 }))).toBe('warn')
    expect(statDanger('temp', base({ temp: 33 }))).toBe('critical')
  })
})

describe('deriveHint', () => {
  it('returns null when everything is comfortable', () => {
    expect(deriveHint(createInitialState())).toBeNull()
  })

  it('points a thirsty player at the Drink tab', () => {
    const hint = deriveHint(base({ hydration: 40 }))
    expect(hint).toMatchObject({ id: 'hydration' })
    expect(hint!.text).toMatch(/Drink tab/)
  })

  it('points a starving player at the Food tab', () => {
    const hint = deriveHint(base({ energy: 40 }))
    expect(hint).toMatchObject({ id: 'energy' })
    expect(hint!.text).toMatch(/Food tab/)
  })

  it('warns about a dropping body temperature', () => {
    const hint = deriveHint(base({ temp: 34 }))
    expect(hint).toMatchObject({ id: 'temp-cold' })
    expect(hint!.text).toMatch(/Clothing tab/)
  })

  it('warns about overheating', () => {
    const hint = deriveHint(base({ temp: 40 }))
    expect(hint).toMatchObject({ id: 'temp-hot' })
  })

  it('prioritises the most lethal vital (health over hydration)', () => {
    const hint = deriveHint(base({ health: 50, healthcap: 1000, hydration: 0 }))
    expect(hint).toMatchObject({ id: 'health' })
  })

  it('is deterministic: same state → same hint', () => {
    const g = base({ stamina: 10, staminacap: 200 })
    expect(deriveHint(g)).toEqual(deriveHint(g))
    expect(deriveHint(g)).toMatchObject({ id: 'stamina' })
  })
})
