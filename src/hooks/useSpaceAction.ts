/**
 * Space-bar shortcut for the most relevant basic action.
 *
 * Pressing Space triggers "Basic Work" (the Work tab's entry job) when it is
 * affordable — a one-key way to grind the core money loop, matching the
 * expectation set by most idle games. Kept deliberately unobtrusive:
 *
 *  - Ignored while any modal is open (a `.modal-backdrop` is present) so Space
 *    never fires behind a dialog.
 *  - Ignored while focus is in a text field / textarea / editable element, so
 *    typing a save code (Settings → Import) is unaffected.
 *  - Ignored while paused, or when the job is unaffordable (the engine's
 *    `canAfford` gate), so it never does anything the button wouldn't.
 *
 * The affordability/pause checks are re-read live via a ref, so the single
 * listener never needs re-subscribing.
 */

import { useEffect, useRef } from 'react'
import { work } from '../data/work'
import { canAfford } from '../game/engine'
import type { Item } from '../game/types'
import { useGame } from '../store/GameContext'

/** The Work tab's basic job — the action Space maps to. */
export const BASIC_WORK_ITEM: Item | undefined = work.items.find((i) => i.id === 'basic-work')

/** Whether the current focus is somewhere Space should be left alone. */
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/** Mount once (near the app root) to enable the Space shortcut. */
export function useSpaceAction(): void {
  const { state, applyItem } = useGame()

  const gameRef = useRef(state.game)
  gameRef.current = state.game

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      if (e.repeat) return
      if (BASIC_WORK_ITEM === undefined) return
      // Don't hijack Space while typing or when a dialog is up.
      if (isEditableTarget(e.target)) return
      if (document.querySelector('.modal-backdrop') !== null) return

      const g = gameRef.current
      if (g.pause) return
      if (!canAfford(g, BASIC_WORK_ITEM)) return

      e.preventDefault()
      applyItem(BASIC_WORK_ITEM)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [applyItem])
}
