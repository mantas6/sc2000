/**
 * The category tab strip + active pane, mirroring `ul.nav.nav-tabs` and the
 * `.tab-content` in the original index.jade (13 tabs, Common → Research).
 *
 * Each nav button shows the tab's glyph + label; locked tabs additionally show
 * a padlock and their one-time entry fee. Selecting a tab shows its pane, where
 * the actual unlock action lives (see {@link TabPane}).
 */

import { useState } from 'react'
import { formatMoney } from '../game/format'
import { isTabUnlocked, isTabVisible } from '../store/gameReducer'
import { tabs } from '../data/tabs'
import { getIcon, roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'
import { TabPane } from './TabPane'

export function Tabs() {
  const { state } = useGame()
  const [selectedId, setSelectedId] = useState(tabs[0].id)
  const Lock = roleIcon.lock

  // Only tabs the player can currently reach are shown (free/unlocked always,
  // priced-but-locked only while affordable). `tabs[0]` is free, so the list
  // is never empty and always has a safe fallback.
  const visibleTabs = tabs.filter((tab) => isTabVisible(state.game, tab))

  // If the selected tab dropped out of the bar (e.g. money fell below its fee
  // before it was unlocked), fall back to the first visible tab.
  const selected =
    visibleTabs.find((t) => t.id === selectedId) ?? visibleTabs[0]

  return (
    <section className="tabs" aria-label="Actions">
      <div className="tabs__nav" role="tablist">
        {visibleTabs.map((tab) => {
          const Glyph = getIcon(tab.icon)
          const locked = !isTabUnlocked(state.game, tab)
          const active = tab.id === selected.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className="tabs__tab"
              data-active={active}
              data-locked={locked}
              onClick={() => setSelectedId(tab.id)}
            >
              {Glyph ? <Glyph size={18} /> : null}
              <span className="tabs__label">{tab.label}</span>
              {locked ? (
                <span className="tabs__fee">
                  <Lock size={12} /> {formatMoney(tab.unlockCost ?? 0)}$
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <TabPane tab={selected} />
    </section>
  )
}
