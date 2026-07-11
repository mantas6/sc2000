/**
 * Renders an item's stat deltas as compact chips: an up/down arrow (coloured by
 * sign), an optional stat glyph, a short stat label and the numeric delta.
 *
 * Additive `effects` are shown as signed deltas; assignment `set` values (only
 * `tempoffset` in the data) are shown with an `=` marker since they replace
 * rather than add.
 */

import type { StatKey, StatMap } from '../game/types'
import { roleIcon, statIcon } from '../ui/icons'

/** Short human labels for the stat keys that can appear in item effects. */
const STAT_LABELS: Record<StatKey, string> = {
  stomach: 'stomach',
  stomachcap: 'stomach max',
  stomachcapin: 'stomach max/s',
  stomachin: 'stomach/s',
  energyin: 'energy/s',
  energy: 'energy',
  energycap: 'energy max',
  energycapin: 'energy max/s',
  hydration: 'hydration',
  hydrationin: 'hydration/s',
  hydrationcap: 'hydration max',
  hydrationcapin: 'hydration max/s',
  health: 'health',
  healthin: 'health/s',
  healthcap: 'health max',
  healthcaploss: 'health max loss',
  digestionmulti: 'digestion',
  stamina: 'stamina',
  staminacap: 'stamina max',
  staminaregen: 'stamina regen',
  staminacapin: 'stamina max/s',
  temp: 'temp',
  tempoffsetp: 'temp gain/s',
  tempoffset: 'clothing temp',
  tempgain: 'temp control',
  moneyincome: 'income',
  money: 'money',
  time: 'time',
  digested: 'digested',
  taxes: 'taxes',
}

/** Trim floating noise: up to 4 decimals, no trailing zeros. */
function fmt(n: number): string {
  const rounded = Math.round(n * 10000) / 10000
  return String(rounded)
}

interface Chip {
  key: string
  stat: StatKey
  value: number
  assign: boolean
}

function collect(effects: StatMap | undefined, assign: boolean, out: Chip[]): void {
  if (!effects) return
  for (const k in effects) {
    const stat = k as StatKey
    const value = effects[stat]
    if (value === undefined) continue
    out.push({ key: `${assign ? 'set' : 'eff'}:${stat}`, stat, value, assign })
  }
}

export interface EffectChipsProps {
  effects?: StatMap
  set?: StatMap
}

export function EffectChips({ effects, set }: EffectChipsProps) {
  const chips: Chip[] = []
  collect(effects, false, chips)
  collect(set, true, chips)

  if (chips.length === 0) return null

  const Up = roleIcon.up
  const Down = roleIcon.down

  return (
    <ul className="chips">
      {chips.map(({ key, stat, value, assign }) => {
        const positive = value >= 0
        const Glyph = statIcon[stat]
        const Arrow = positive ? Up : Down
        return (
          <li key={key} className="chip" data-dir={positive ? 'up' : 'down'} title={STAT_LABELS[stat]}>
            <Arrow size={12} />
            {Glyph ? <Glyph size={12} /> : null}
            {/* When a glyph identifies the stat, drop the visible label to cut
                noise but keep it for screen readers + the chip tooltip. */}
            <span className={Glyph ? 'chip__label sr-only' : 'chip__label'}>{STAT_LABELS[stat]}</span>
            <span className="chip__value">
              {assign ? '=' : positive ? '+' : ''}
              {fmt(value)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
