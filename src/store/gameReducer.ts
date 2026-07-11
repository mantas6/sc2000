/**
 * React-free store reducer over the `GameAction` union.
 *
 * The reducer keeps the engine pure: it delegates all simulation to
 * `engine.tick` / `engine.applyItem` and layers on the bookkeeping that the
 * original `updateStatus()` / DOM handled — a bounded thoughts log, the pending
 * death summary (for the modal), reveal-when-first-affordable persistence into
 * `game.unlocked`, and one-time tab entry fees.
 *
 * Everything here is a pure function of `(state, action)` so it can be unit
 * tested without a DOM or React.
 */

import { tabs } from '../data/tabs'
import type { DeathInfo } from '../game/engine'
import { applyItem as engineApplyItem, tick as engineTick } from '../game/engine'
import { createInitialState } from '../game/initialState'
import type { OfflineSummary } from '../game/offline'
import type { GameAction, GameState, Item, Tab } from '../game/types'

/** Max entries retained in the rolling thoughts log. */
export const THOUGHTS_LOG_MAX = 50

/** A single line in the thoughts log. */
export interface ThoughtEntry {
  /** Monotonic id (stable React key). */
  id: number
  /** The thought text. */
  text: string
  /** `game.time` when it was emitted. */
  time: number
}

/**
 * Full store shape. `game` is the pure engine state; the rest is UI-facing
 * bookkeeping derived by the reducer.
 */
export interface StoreState {
  /** Pure engine state. */
  game: GameState
  /** Rolling, bounded log of the character's thoughts (oldest → newest). */
  thoughts: ThoughtEntry[]
  /** Populated while a death summary awaits acknowledgement (modal), else null. */
  death: DeathInfo | null
  /** Populated while an offline catch-up summary awaits the "Welcome back" modal. */
  offline: OfflineSummary | null
  /** Number of ticks processed (drives autosave cadence). */
  tickCount: number
  /** Next thought id — kept in state so the reducer stays pure/deterministic. */
  nextThoughtId: number
}

/** Build a fresh store around a given (or fresh) game state. */
export function createStoreState(
  game: GameState = createInitialState(),
  offline: OfflineSummary | null = null,
): StoreState {
  return {
    game,
    thoughts: [],
    death: null,
    offline,
    tickCount: 0,
    nextThoughtId: 0,
  }
}

/** Flattened list of every item across all tabs (pure data, computed once). */
const ALL_ITEMS: Item[] = tabs.flatMap((tab) => tab.items)

/** The `bought` map key used to record a tab's one-time entry-fee purchase. */
export function tabUnlockKey(tabId: string): string {
  return `tab:${tabId}`
}

/**
 * Whether a tab has been entered. Free tabs (no `unlockCost`) are always
 * considered unlocked; priced tabs require their fee to have been paid.
 */
export function isTabUnlocked(game: GameState, tab: Tab): boolean {
  if (tab.unlockCost === undefined) return true
  return game.bought[tabUnlockKey(tab.id)] === true
}

/**
 * Whether a tab should appear in the tab bar *right now*.
 *
 * - Free tabs (no `unlockCost`, or `0`) are always visible.
 * - Already-unlocked (fee paid) tabs are always visible, even if money later
 *   drops below the original fee.
 * - Priced-but-locked tabs are visible only while the player can currently
 *   afford the fee (`money >= unlockCost`) — so they appear the second the
 *   money is there and vanish again if it drops before the fee is paid.
 */
export function isTabVisible(game: GameState, tab: Tab): boolean {
  if (isTabUnlocked(game, tab)) return true
  return game.money >= (tab.unlockCost ?? 0)
}

/**
 * Persist reveal-when-first-affordable: any priced consumable (no `buyname`,
 * no `unlock`) that is now affordable is flagged in `game.unlocked` so it stays
 * visible even after money drops. Mirrors the original `updateStatus()` reveal
 * loop, but as pure state instead of DOM classes.
 *
 * Returns the same reference when nothing changes (no needless re-renders).
 */
function revealAffordable(game: GameState): GameState {
  let unlocked: Record<string, boolean> | null = null
  for (const item of ALL_ITEMS) {
    if (item.buyname !== undefined) continue
    if (item.unlock !== undefined) continue
    if (item.cost >= 0) continue
    if (game.unlocked[item.id]) continue
    if (game.money >= Math.abs(item.cost)) {
      if (!unlocked) unlocked = { ...game.unlocked }
      unlocked[item.id] = true
    }
  }
  return unlocked ? { ...game, unlocked } : game
}

/**
 * Append a thought to the bounded log. `''` clears the log (mirrors the
 * original `log('')`); `null` leaves it unchanged.
 */
function pushThought(
  state: StoreState,
  thought: string | null,
  time: number,
): Pick<StoreState, 'thoughts' | 'nextThoughtId'> {
  if (thought === null) {
    return { thoughts: state.thoughts, nextThoughtId: state.nextThoughtId }
  }
  if (thought === '') {
    return { thoughts: [], nextThoughtId: state.nextThoughtId }
  }
  const entry: ThoughtEntry = { id: state.nextThoughtId, text: thought, time }
  const thoughts = [...state.thoughts, entry].slice(-THOUGHTS_LOG_MAX)
  return { thoughts, nextThoughtId: state.nextThoughtId + 1 }
}

/** Pure store reducer. */
export function gameReducer(state: StoreState, action: GameAction): StoreState {
  switch (action.type) {
    case 'TICK': {
      const result = engineTick(state.game)
      // Paused ticks return the same game reference and no thought/death.
      const { thoughts, nextThoughtId } = pushThought(
        state,
        result.thought,
        result.state.time,
      )
      return {
        game: revealAffordable(result.state),
        thoughts,
        death: result.death ?? state.death,
        offline: state.offline,
        tickCount: state.tickCount + 1,
        nextThoughtId,
      }
    }

    case 'APPLY_ITEM': {
      const game = engineApplyItem(state.game, action.item)
      if (game === state.game) return state
      return { ...state, game: revealAffordable(game) }
    }

    case 'UNLOCK_TAB': {
      const { tab } = action
      if (tab.unlockCost === undefined) return state
      if (isTabUnlocked(state.game, tab)) return state
      if (state.game.pause) return state
      if (state.game.money < tab.unlockCost) return state
      const game: GameState = {
        ...state.game,
        money: state.game.money - tab.unlockCost,
        bought: { ...state.game.bought, [tabUnlockKey(tab.id)]: true },
      }
      return { ...state, game: revealAffordable(game) }
    }

    case 'TOGGLE_PAUSE':
      return { ...state, game: { ...state.game, pause: !state.game.pause } }

    case 'RESET':
      return createStoreState()

    case 'LOAD':
      return createStoreState(action.state)

    case 'DISMISS_DEATH':
      if (state.death === null) return state
      return { ...state, death: null }

    case 'DISMISS_OFFLINE':
      if (state.offline === null) return state
      return { ...state, offline: null }
  }
}
