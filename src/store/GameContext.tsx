/**
 * React context + provider wiring the store reducer into the component tree.
 *
 * Exposes the full `StoreState` plus the raw `dispatch`, and a few convenience
 * callbacks for the common actions so components don't hand-build action
 * objects. Persisted state (if any) is loaded once at mount to seed the store.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { computeOffline } from '../game/offline'
import { load } from '../game/persistence'
import { isOfflineEnabled } from '../game/settings'
import type { GameAction, Item, Tab } from '../game/types'
import { createStoreState, gameReducer, type StoreState } from './gameReducer'

/** Value provided by {@link GameContext}. */
export interface GameContextValue {
  /** Current store state. */
  state: StoreState
  /** Raw reducer dispatch. */
  dispatch: Dispatch<GameAction>
  /** Apply an item (cost / effects / unlock chains). */
  applyItem: (item: Item) => void
  /** Pay a tab's one-time entry fee. */
  unlockTab: (tab: Tab) => void
  /** Toggle the paused flag. */
  togglePause: () => void
  /** Reset to a fresh game (the original "Suicide"). */
  reset: () => void
  /** Dismiss the pending death summary (close the modal). */
  dismissDeath: () => void
  /** Dismiss the offline catch-up summary (close the "Welcome back" modal). */
  dismissOffline: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

/**
 * Seed the store from a persisted save, falling back to a fresh game. When a
 * save exists and offline progression is enabled, the missed time is simulated
 * up-front (capped, never-die) and its summary is stashed for the "Welcome
 * back" modal.
 */
function initStore(): StoreState {
  const saved = load()
  if (!saved) return createStoreState()
  if (!isOfflineEnabled()) return createStoreState(saved.state)
  const { state, summary } = computeOffline(saved.state, saved.savedAt, Date.now())
  return createStoreState(state, summary.ticks > 0 ? summary : null)
}

/** Provider that owns the reducer and exposes it via context. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initStore)

  const applyItem = useCallback((item: Item) => dispatch({ type: 'APPLY_ITEM', item }), [])
  const unlockTab = useCallback((tab: Tab) => dispatch({ type: 'UNLOCK_TAB', tab }), [])
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const dismissDeath = useCallback(() => dispatch({ type: 'DISMISS_DEATH' }), [])
  const dismissOffline = useCallback(() => dispatch({ type: 'DISMISS_OFFLINE' }), [])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      applyItem,
      unlockTab,
      togglePause,
      reset,
      dismissDeath,
      dismissOffline,
    }),
    [state, applyItem, unlockTab, togglePause, reset, dismissDeath, dismissOffline],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

/** Access the game store; throws if used outside a {@link GameProvider}. */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (ctx === null) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return ctx
}
