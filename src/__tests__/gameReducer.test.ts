import { describe, expect, it } from 'vitest'
import { common } from '../data/common'
import { medical } from '../data/medical'
import { createInitialState } from '../game/initialState'
import type { GameState } from '../game/types'
import {
  THOUGHTS_LOG_MAX,
  createStoreState,
  gameReducer,
  isTabUnlocked,
  isTabVisible,
  tabUnlockKey,
} from '../store/gameReducer'

/** Fresh store whose game state carries optional overrides. */
function store(overrides: Partial<GameState> = {}) {
  return createStoreState({ ...createInitialState(), ...overrides })
}

describe('gameReducer — TICK', () => {
  it('advances time and increments the tick counter', () => {
    const next = gameReducer(store(), { type: 'TICK' })
    expect(next.game.time).toBe(1)
    expect(next.tickCount).toBe(1)
  })

  it('is a no-op on the game state while paused (engine returns same ref)', () => {
    const s = store({ pause: true })
    const next = gameReducer(s, { type: 'TICK' })
    expect(next.game).toBe(s.game)
    expect(next.game.time).toBe(0)
    // The store still counts the tick (drives autosave cadence).
    expect(next.tickCount).toBe(1)
  })

  it('appends emitted thoughts to a bounded log with stable ids', () => {
    // A near-full stomach + otherwise healthy stats force the deterministic,
    // rng-independent "vomiting" thought every tick.
    const s = store({
      stomach: 500,
      stomachcap: 500,
      energy: 5000,
      hydration: 2000,
      stamina: 200,
      staminacap: 200,
      temp: 36.6,
    })
    const next = gameReducer(s, { type: 'TICK' })
    expect(next.thoughts).toHaveLength(1)
    expect(next.thoughts[0]).toMatchObject({ id: 0, text: "Shit, I'm vomiting!" })
    expect(next.nextThoughtId).toBe(1)
  })

  it('caps the thoughts log at THOUGHTS_LOG_MAX entries', () => {
    // Huge, equal stomach/cap keep the ratio pinned ~1.0 across many ticks so
    // the deterministic vomit thought fires every tick; healthy caps suppress
    // all rng-gated thoughts.
    let s = store({
      stomach: 1_000_000_000,
      stomachcap: 1_000_000_000,
      energy: 5_000_000,
      energycap: 5_000_000,
      hydration: 2_000_000,
      hydrationcap: 2_000_000,
      stamina: 200,
      staminacap: 200,
      temp: 36.6,
      health: 1000,
      healthcap: 1000,
    })
    for (let i = 0; i < THOUGHTS_LOG_MAX + 10; i++) {
      s = gameReducer(s, { type: 'TICK' })
    }
    expect(s.thoughts.length).toBeLessThanOrEqual(THOUGHTS_LOG_MAX)
    expect(s.thoughts).toHaveLength(THOUGHTS_LOG_MAX)
  })

  it('persists reveal-when-first-affordable into game.unlocked', () => {
    const s = store({ money: 100 })
    expect(s.game.unlocked['normal-clothes']).toBeUndefined()
    const next = gameReducer(s, { type: 'TICK' })
    // normal-clothes costs 5 → now affordable → flagged unlocked persistently.
    expect(next.game.unlocked['normal-clothes']).toBe(true)
  })

  it('captures the death summary and resets the game on death', () => {
    const next = gameReducer(store({ health: 1, energy: 0, hydration: 0 }), { type: 'TICK' })
    expect(next.death).not.toBeNull()
    expect(next.death!.time).toBe(1)
    // Dehydration out-damages starvation, so it owns the summary.
    expect(next.death!.cause).toBe('dehydration')
    expect(next.game.health).toBe(1000)
    expect(next.game.time).toBe(0)
  })
})

describe('gameReducer — APPLY_ITEM', () => {
  it('applies an affordable item through the engine', () => {
    const next = gameReducer(store({ money: 0 }), {
      type: 'APPLY_ITEM',
      item: { id: 'w', label: 'Work', cost: 5 },
    })
    expect(next.game.money).toBe(5)
  })

  it('returns the same store reference when the item is unaffordable', () => {
    const s = store({ money: 10 })
    const next = gameReducer(s, {
      type: 'APPLY_ITEM',
      item: { id: 'p', label: 'Buy', cost: -500 },
    })
    expect(next).toBe(s)
  })

  it('reveals newly-affordable items after purchase changes money', () => {
    // Earn income up past the 5$ threshold in one click.
    const next = gameReducer(store({ money: 0 }), {
      type: 'APPLY_ITEM',
      item: { id: 'big', label: 'Big Job', cost: 100 },
    })
    expect(next.game.unlocked['normal-clothes']).toBe(true)
  })
})

describe('gameReducer — UNLOCK_TAB (one-time fee)', () => {
  it('charges the fee once and records the bought flag', () => {
    const s = store({ money: 5000 })
    expect(isTabUnlocked(s.game, medical)).toBe(false)
    const next = gameReducer(s, { type: 'UNLOCK_TAB', tab: medical })
    expect(next.game.money).toBe(5000 - medical.unlockCost!)
    expect(next.game.bought[tabUnlockKey(medical.id)]).toBe(true)
    expect(isTabUnlocked(next.game, medical)).toBe(true)
  })

  it('does not charge again once unlocked', () => {
    const once = gameReducer(store({ money: 5000 }), { type: 'UNLOCK_TAB', tab: medical })
    const twice = gameReducer(once, { type: 'UNLOCK_TAB', tab: medical })
    expect(twice).toBe(once)
    expect(twice.game.money).toBe(5000 - medical.unlockCost!)
  })

  it('is a no-op when the fee is unaffordable', () => {
    const s = store({ money: 100 })
    const next = gameReducer(s, { type: 'UNLOCK_TAB', tab: medical })
    expect(next).toBe(s)
  })

  it('is a no-op while paused', () => {
    const s = store({ money: 5000, pause: true })
    const next = gameReducer(s, { type: 'UNLOCK_TAB', tab: medical })
    expect(next).toBe(s)
  })
})

describe('isTabVisible (visibility tracks current money)', () => {
  const fee = medical.unlockCost! // 2000

  it('always shows free/no-cost tabs', () => {
    const s = store({ money: 0 })
    expect(isTabVisible(s.game, common)).toBe(true)
  })

  it('hides a priced tab while its fee is unaffordable', () => {
    const s = store({ money: fee - 1 })
    expect(isTabVisible(s.game, medical)).toBe(false)
  })

  it('shows a priced tab the moment the fee becomes affordable', () => {
    const s = store({ money: fee })
    expect(isTabVisible(s.game, medical)).toBe(true)
    // Still not actually unlocked — only visible.
    expect(isTabUnlocked(s.game, medical)).toBe(false)
  })

  it('keeps an unlocked tab visible even after money drops below the fee', () => {
    const unlocked = gameReducer(store({ money: fee }), {
      type: 'UNLOCK_TAB',
      tab: medical,
    })
    // Fee was paid, money is now well below the original cost.
    expect(unlocked.game.money).toBe(0)
    expect(isTabUnlocked(unlocked.game, medical)).toBe(true)
    expect(isTabVisible(unlocked.game, medical)).toBe(true)
  })

  it('hides a still-locked tab again once money drops below the fee', () => {
    // Afforded (visible) then spent down without ever unlocking.
    const rich = store({ money: fee })
    expect(isTabVisible(rich.game, medical)).toBe(true)
    const poor = store({ money: fee - 1 })
    expect(isTabUnlocked(poor.game, medical)).toBe(false)
    expect(isTabVisible(poor.game, medical)).toBe(false)
  })

  it('selected-tab fallback: the first visible tab is always the free tab', () => {
    // Emulates the component fallback: filter to visible tabs, pick the first.
    const s = store({ money: 0 })
    const visible = [common, medical].filter((t) => isTabVisible(s.game, t))
    expect(visible).toContain(common)
    expect(visible).not.toContain(medical)
    expect(visible[0]).toBe(common)
  })
})

describe('gameReducer — TOGGLE_PAUSE', () => {
  it('flips the paused flag', () => {
    const paused = gameReducer(store(), { type: 'TOGGLE_PAUSE' })
    expect(paused.game.pause).toBe(true)
    const resumed = gameReducer(paused, { type: 'TOGGLE_PAUSE' })
    expect(resumed.game.pause).toBe(false)
  })
})

describe('gameReducer — RESET', () => {
  it('returns a fresh store', () => {
    const dirty = createStoreState({ ...createInitialState(), money: 999, time: 500 })
    const next = gameReducer({ ...dirty, thoughts: [{ id: 1, text: 'x', time: 1 }] }, {
      type: 'RESET',
    })
    expect(next.game.money).toBe(0)
    expect(next.game.time).toBe(0)
    expect(next.thoughts).toHaveLength(0)
    expect(next.death).toBeNull()
  })
})

describe('gameReducer — LOAD', () => {
  it('hydrates the store from a provided game state', () => {
    const loaded: GameState = { ...createInitialState(), money: 42, time: 123 }
    const next = gameReducer(store(), { type: 'LOAD', state: loaded })
    expect(next.game.money).toBe(42)
    expect(next.game.time).toBe(123)
    expect(next.tickCount).toBe(0)
    expect(next.thoughts).toHaveLength(0)
  })
})

describe('gameReducer — DISMISS_DEATH', () => {
  it('clears a pending death summary', () => {
    const died = gameReducer(store({ health: 1, energy: 0, hydration: 0 }), { type: 'TICK' })
    expect(died.death).not.toBeNull()
    const next = gameReducer(died, { type: 'DISMISS_DEATH' })
    expect(next.death).toBeNull()
  })

  it('is a no-op when there is no death to dismiss', () => {
    const s = store()
    expect(gameReducer(s, { type: 'DISMISS_DEATH' })).toBe(s)
  })
})
