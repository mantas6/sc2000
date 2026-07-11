/**
 * Drives the 1s simulation tick and autosave, mirroring the original
 * `window.setInterval(..., 1000)` loop.
 *
 * - Ticks once per second, skipping while paused (`respect pause`).
 * - Autosaves every {@link AUTOSAVE_EVERY_TICKS} ticks and on page unload, so a
 *   refresh/close doesn't lose more than a few seconds of progress.
 */

import { useEffect, useRef } from 'react'
import { save } from '../game/persistence'
import { useGame } from '../store/GameContext'

/** Tick cadence in milliseconds (the original's 1000ms loop). */
export const TICK_MS = 1000

/** Autosave once every N ticks. */
export const AUTOSAVE_EVERY_TICKS = 10

/** Mount this once (near the app root) to run the game. */
export function useGameLoop(): void {
  const { state, dispatch } = useGame()

  // Latest state for interval / unload handlers without resubscribing.
  const stateRef = useRef(state)
  stateRef.current = state

  // 1s tick, respecting pause.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (stateRef.current.game.pause) return
      dispatch({ type: 'TICK' })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [dispatch])

  // Periodic autosave, keyed off the tick counter.
  useEffect(() => {
    if (state.tickCount > 0 && state.tickCount % AUTOSAVE_EVERY_TICKS === 0) {
      save(state.game)
    }
  }, [state.tickCount, state.game])

  // Save on page unload.
  useEffect(() => {
    const handler = () => save(stateRef.current.game)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])
}
