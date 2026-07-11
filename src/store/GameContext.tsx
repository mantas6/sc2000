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
import { load } from '../game/persistence'
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
}

const GameContext = createContext<GameContextValue | null>(null)

/** Seed the store from a persisted save, falling back to a fresh game. */
function initStore(): StoreState {
  const saved = load()
  return saved ? createStoreState(saved) : createStoreState()
}

/** Provider that owns the reducer and exposes it via context. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initStore)

  const applyItem = useCallback((item: Item) => dispatch({ type: 'APPLY_ITEM', item }), [])
  const unlockTab = useCallback((tab: Tab) => dispatch({ type: 'UNLOCK_TAB', tab }), [])
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const dismissDeath = useCallback(() => dispatch({ type: 'DISMISS_DEATH' }), [])

  const value = useMemo<GameContextValue>(
    () => ({ state, dispatch, applyItem, unlockTab, togglePause, reset, dismissDeath }),
    [state, applyItem, unlockTab, togglePause, reset, dismissDeath],
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
