/**
 * A single actionable item button (a legacy `.consumable`).
 *
 * - Hidden entirely when `isVisible` is false (reveal/buy/unlock rules live in
 *   the engine + store, not here).
 * - Disabled when unaffordable (`canAfford`), showing a "blocked" glyph.
 * - Clicking dispatches `APPLY_ITEM` via the store.
 * - The item's `title` becomes the native tooltip.
 *
 * The cost line shows the price (negative cost) or income (positive cost) using
 * the same money formatting as the HUD; effect deltas render via `EffectChips`.
 */

import { formatMoney } from '../game/format'
import { canAfford, isVisible } from '../game/engine'
import type { Item } from '../game/types'
import { getIcon, roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'
import { EffectChips } from './EffectChips'

export interface ItemButtonProps {
  item: Item
}

export function ItemButton({ item }: ItemButtonProps) {
  const { state, applyItem } = useGame()
  const g = state.game

  if (!isVisible(g, item)) return null

  const affordable = canAfford(g, item)
  const Glyph = getIcon(item.icon)
  const Ban = roleIcon.ban

  // cost > 0 is income earned on click; cost < 0 is a price; 0 is free.
  const costText =
    item.cost > 0
      ? `+${formatMoney(item.cost)}$`
      : item.cost < 0
        ? `-${formatMoney(item.cost)}$`
        : 'Free'

  return (
    <button
      type="button"
      className="item"
      disabled={!affordable || g.pause}
      title={item.title}
      onClick={() => applyItem(item)}
    >
      <span className="item__head">
        <span className="item__icon" aria-hidden="true">
          {affordable ? Glyph ? <Glyph size={18} /> : null : <Ban size={18} />}
        </span>
        <span className="item__label">{item.label}</span>
        <span className="item__cost" data-kind={item.cost > 0 ? 'income' : 'price'}>
          {costText}
        </span>
      </span>
      <EffectChips effects={item.effects} set={item.set} />
    </button>
  )
}
