/**
 * Core game types for the Survival Clicker remake.
 *
 * These mirror the legacy `game` object built in `init()` of the original
 * `script.js`. Every numeric field of that object is captured by `StatKey`;
 * the non-numeric bookkeeping fields (`unlocked`, `bought`, `pause`) are
 * modelled explicitly on `GameState`.
 */

/**
 * Numeric state keys — every numeric field of the original `game` object.
 *
 * Original source (`init()` in script.js):
 *   stomach, stomachcap, stomachcapin, stomachin,
 *   energyin, energy, energycap, energycapin,
 *   hydration, hydrationin, hydrationcap, hydrationcapin,
 *   health, healthin, healthcap, healthcaploss,
 *   digestionmulti,
 *   stamina, staminacap, staminaregen, staminacapin,
 *   temp, tempoffsetp, tempoffset, tempgain,
 *   moneyincome, money, time, digested, taxes
 *
 * The original also carried a dead `eff` object and the map fields
 * `unlocked` / `bought` / `pause`; those are intentionally excluded here
 * (see `GameState`).
 */
export type StatKey =
  | 'stomach'
  | 'stomachcap'
  | 'stomachcapin'
  | 'stomachin'
  | 'energyin'
  | 'energy'
  | 'energycap'
  | 'energycapin'
  | 'hydration'
  | 'hydrationin'
  | 'hydrationcap'
  | 'hydrationcapin'
  | 'health'
  | 'healthin'
  | 'healthcap'
  | 'healthcaploss'
  | 'digestionmulti'
  | 'stamina'
  | 'staminacap'
  | 'staminaregen'
  | 'staminacapin'
  | 'temp'
  | 'tempoffsetp'
  | 'tempoffset'
  | 'tempgain'
  | 'moneyincome'
  | 'money'
  | 'time'
  | 'digested'
  | 'taxes'

/**
 * A map of numeric stat deltas/values, compile-time checked against
 * `StatKey`. Used for both additive `effects` and assignment-based `set`.
 */
export type StatMap = Partial<Record<StatKey, number>>

/**
 * Full mutable game state: every numeric stat plus the original bookkeeping
 * maps and the pause flag.
 *
 * - `unlocked` — items revealed to the player (was `game.unlocked`, keyed by
 *   the item's display text in the original).
 * - `bought` — one-time purchases/unlock chains (was `game.bought`, keyed by
 *   the item's `buyname` / `unlock` id).
 * - `pause` — paused flag (was `game.pause`).
 */
export type GameState = { [K in StatKey]: number } & {
  unlocked: Record<string, boolean>
  bought: Record<string, boolean>
  pause: boolean
}

/**
 * A purchasable/consumable action button (a `.consumable` in the original).
 *
 * Mapping from the legacy jade attributes:
 * - `cost`     → the `money` attribute (negative = price, positive = income
 *                gained on click). Applied to `money` like any other delta.
 * - `effects`  → all additive stat attributes (`game[attr] += value`).
 * - `set`      → assignment-based stat attributes; only `tempoffset` used this
 *                in the original (`game.tempoffset = value`).
 * - `buyname`  → marks a `.buyable`; revealed once `bought[buyname]` is set.
 * - `unlock`   → buying this item sets `bought[unlock]` (unlock chain).
 */
export interface Item {
  id: string
  label: string
  title?: string
  cost: number
  effects?: StatMap
  set?: StatMap
  buyname?: string
  unlock?: string
  icon?: string
}

/**
 * A category tab grouping items. `unlockCost` models the one-time tab entry
 * fee that some tabs carried as a `money` attribute in the original nav.
 */
export interface Tab {
  id: string
  label: string
  unlockCost?: number
  icon: string
  items: Item[]
}

/**
 * Discriminated union of all state transitions handled by the reducer.
 *
 * - `TICK`         — advance one 1s simulation step.
 * - `APPLY_ITEM`   — apply an item's cost/effects/set + unlock/buy chains.
 * - `UNLOCK_TAB`   — pay a tab's one-time entry fee (`unlockCost`) and reveal it.
 * - `TOGGLE_PAUSE` — flip `pause`.
 * - `RESET`        — reset to a fresh initial state (was the "Suicide" button).
 * - `LOAD`         — replace state with a loaded/migrated save.
 * - `DISMISS_DEATH`— clear the pending death summary (closes the death modal).
 *
 * `UNLOCK_TAB` / `DISMISS_DEATH` are store-layer additions sanctioned by the
 * TODO.md cleanup section (tab entry fees → one-time unlock; `alert` → modal).
 */
export type GameAction =
  | { type: 'TICK' }
  | { type: 'APPLY_ITEM'; item: Item }
  | { type: 'UNLOCK_TAB'; tab: Tab }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESET' }
  | { type: 'LOAD'; state: GameState }
  | { type: 'DISMISS_DEATH' }
