import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../game/initialState'
import {
  SAVE_KEY,
  SAVE_VERSION,
  clearSave,
  exportSave,
  importSave,
  load,
  migrate,
  save,
} from '../game/persistence'
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
    expect(loaded!.state.money).toBe(12345.67)
    expect(loaded!.state.time).toBe(890)
    expect(loaded!.state.unlocked).toEqual({ 'normal-clothes': true })
    expect(loaded!.state.bought).toEqual({ bricks: true, 'tab:medical': true })
    expect(loaded!.state.pause).toBe(true)
  })

  it('writes under the versioned key wrapped in a timestamped envelope', () => {
    const before = Date.now()
    save(createInitialState())
    const raw = localStorage.getItem(SAVE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(SAVE_VERSION)
    expect(parsed.state.health).toBe(1000)
    // The envelope now stamps the wall-clock time (drives offline catch-up).
    expect(typeof parsed.savedAt).toBe('number')
    expect(parsed.savedAt).toBeGreaterThanOrEqual(before)
  })

  it('round-trips savedAt so offline catch-up can measure elapsed time', () => {
    const state = createInitialState()
    const migrated = migrate({ version: SAVE_VERSION, savedAt: 1_000_000, state })
    expect(migrated).not.toBeNull()
    expect(migrated!.savedAt).toBe(1_000_000)
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

  it('rejects an unknown (future) version', () => {
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
    expect(migrated!.state.unlocked).not.toBe(state.unlocked)
    expect(migrated!.state.bought).not.toBe(state.bought)
  })
})

describe('persistence — v1 → v2 migration', () => {
  it('accepts a v1 envelope and defaults savedAt to now (no offline grant)', () => {
    const before = Date.now()
    // v1 had no savedAt field.
    const migrated = migrate({ version: 1, state: { ...createInitialState(), money: 42 } })
    expect(migrated).not.toBeNull()
    expect(migrated!.state.money).toBe(42)
    expect(migrated!.savedAt).toBeGreaterThanOrEqual(before)
  })

  it('reads a legacy v1 save from the old key when the current slot is empty', () => {
    localStorage.setItem(
      'sc2000:save:v1',
      JSON.stringify({ version: 1, state: { ...createInitialState(), time: 500 } }),
    )
    const loaded = load()
    expect(loaded).not.toBeNull()
    expect(loaded!.state.time).toBe(500)
  })
})

describe('persistence — export / import round trip', () => {
  it('exports to base64 and imports back to an identical state', () => {
    const state: GameState = {
      ...createInitialState(),
      money: 9876.54,
      time: 4242,
      unlocked: { 'warm-coat': true },
      bought: { progrm: true },
      pause: true,
    }
    const blob = exportSave(state)
    expect(typeof blob).toBe('string')
    expect(blob.length).toBeGreaterThan(0)

    const imported = importSave(blob)
    expect(imported).not.toBeNull()
    expect(imported!.money).toBe(9876.54)
    expect(imported!.time).toBe(4242)
    expect(imported!.unlocked).toEqual({ 'warm-coat': true })
    expect(imported!.bought).toEqual({ progrm: true })
    expect(imported!.pause).toBe(true)
  })

  it('tolerates surrounding whitespace on import', () => {
    const blob = exportSave(createInitialState())
    expect(importSave(`\n  ${blob}\t `)).not.toBeNull()
  })

  it('returns null for garbage / non-base64 input', () => {
    expect(importSave('not a real save code')).toBeNull()
    expect(importSave('')).toBeNull()
  })

  it('returns null for base64 that is not a valid save envelope', () => {
    const bogus = btoa(JSON.stringify({ hello: 'world' }))
    expect(importSave(bogus)).toBeNull()
  })
})

describe('persistence — clearSave', () => {
  it('removes both the current and legacy save slots', () => {
    save(createInitialState())
    localStorage.setItem('sc2000:save:v1', JSON.stringify({ version: 1, state: createInitialState() }))
    clearSave()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(localStorage.getItem('sc2000:save:v1')).toBeNull()
    expect(load()).toBeNull()
  })
})
