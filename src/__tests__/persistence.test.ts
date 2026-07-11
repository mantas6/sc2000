import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../game/initialState'
import { SAVE_KEY, SAVE_VERSION, load, migrate, save } from '../game/persistence'
import type { GameState } from '../game/types'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('persistence — round trip', () => {
  it('saves and loads a state faithfully', () => {
    const state: GameState = {
      ...createInitialState(),
      money: 12345.67,
      time: 890,
      unlocked: { 'normal-clothes': true },
      bought: { bricks: true, 'tab:medical': true },
      pause: true,
    }
    save(state)
    const loaded = load()
    expect(loaded).not.toBeNull()
    expect(loaded!.money).toBe(12345.67)
    expect(loaded!.time).toBe(890)
    expect(loaded!.unlocked).toEqual({ 'normal-clothes': true })
    expect(loaded!.bought).toEqual({ bricks: true, 'tab:medical': true })
    expect(loaded!.pause).toBe(true)
  })

  it('writes under the versioned key wrapped in an envelope', () => {
    save(createInitialState())
    const raw = localStorage.getItem(SAVE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(SAVE_VERSION)
    expect(parsed.state.health).toBe(1000)
  })

  it('returns null when nothing is saved', () => {
    expect(load()).toBeNull()
  })
})

describe('persistence — migrate guard', () => {
  it('rejects malformed JSON', () => {
    localStorage.setItem(SAVE_KEY, '{not valid json')
    expect(load()).toBeNull()
  })

  it('rejects a mismatched version', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: SAVE_VERSION + 1, state: createInitialState() }),
    )
    expect(load()).toBeNull()
  })

  it('rejects a payload with a missing/invalid numeric field', () => {
    const bad = { ...createInitialState() } as Record<string, unknown>
    delete bad.money
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state: bad }))
    expect(load()).toBeNull()
  })

  it('rejects a payload with the wrong type for pause', () => {
    const bad = { ...createInitialState(), pause: 'yes' as unknown }
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state: bad }))
    expect(load()).toBeNull()
  })

  it('returns null for non-object payloads', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate(42)).toBeNull()
    expect(migrate('nope')).toBeNull()
  })

  it('fills missing bookkeeping onto a fresh base (defensive merge)', () => {
    // A valid state always has the maps; migrate should still produce fresh
    // copies rather than aliasing the parsed object.
    const state = createInitialState()
    const migrated = migrate({ version: SAVE_VERSION, state })
    expect(migrated).not.toBeNull()
    expect(migrated!.unlocked).not.toBe(state.unlocked)
    expect(migrated!.bought).not.toBe(state.bought)
  })
})
