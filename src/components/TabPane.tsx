/**
 * The content area for the selected tab.
 *
 * - Unlocked tabs render their visible items as `ItemButton`s.
 * - Locked tabs (a `unlockCost` that hasn't been paid) render a gate with the
 *   one-time fee and an "Unlock" button that dispatches `UNLOCK_TAB`; the button
 *   is disabled when the fee is unaffordable or the game is paused.
 */

import { formatMoney } from '../game/format'
import type { Tab } from '../game/types'
import { isTabUnlocked } from '../store/gameReducer'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'
import { ItemButton } from './ItemButton'

export interface TabPaneProps {
  tab: Tab
}

export function TabPane({ tab }: TabPaneProps) {
  const { state, unlockTab } = useGame()
  const g = state.game
  const unlocked = isTabUnlocked(g, tab)

  if (!unlocked) {
    const fee = tab.unlockCost ?? 0
    const affordable = g.money >= fee
    const Lock = roleIcon.lock
    return (
      <div className="tab-pane tab-pane--locked" role="tabpanel" aria-label={tab.label}>
        <div className="tab-lock">
          <Lock size={40} />
          <p className="tab-lock__title">{tab.label} is locked</p>
          <p className="tab-lock__hint">One-time entry fee to unlock this category.</p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!affordable || g.pause}
            onClick={() => unlockTab(tab)}
          >
            Unlock for {formatMoney(fee)}$
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-pane" role="tabpanel" aria-label={tab.label}>
      <div className="tab-pane__items">
        {tab.items.map((item) => (
          <ItemButton key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
