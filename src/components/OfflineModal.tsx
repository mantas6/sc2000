/**
 * "Welcome back" modal — summarizes what happened while the player was away.
 *
 * Rendered only while an {@link OfflineSummary} is pending in the store (set by
 * `initStore` after the offline catch-up in `offline.ts`). Reuses the existing
 * `.modal` chrome to match the dark theme, and reports time away, money
 * gained/lost and the notable vital changes. Dismisses via `DISMISS_OFFLINE`.
 */

import { formatMoney, formatTime } from '../game/format'
import { OFFLINE_MAX_TICKS } from '../game/offline'
import type { OfflineSummary } from '../game/offline'
import { roleIcon, statIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

/** Money can be negative; `formatMoney` drops the sign, so re-apply it here. */
function signedMoney(money: number): string {
  const s = formatMoney(money)
  return money < 0 ? `-${s}` : s
}

/** The vitals whose net change is worth reporting, with their glyph + label. */
const VITALS: Array<{ key: 'health' | 'energy' | 'hydration' | 'stamina'; label: string }> = [
  { key: 'health', label: 'Health' },
  { key: 'energy', label: 'Energy' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'stamina', label: 'Stamina' },
]

/** Format a signed vital delta to a whole number, e.g. "+42" / "-13". */
function signedDelta(n: number): string {
  const rounded = Math.round(n)
  return rounded >= 0 ? `+${rounded}` : String(rounded)
}

export function OfflineModal() {
  const { state, dismissOffline } = useGame()
  const summary: OfflineSummary | null = state.offline
  if (summary === null) return null

  const Clock = roleIcon.time
  const Coins = roleIcon.money

  // Only surface vitals that moved meaningfully (avoid a wall of "+0" rows).
  const changed = VITALS.map((v) => ({
    ...v,
    delta: summary.after[v.key] - summary.before[v.key],
  })).filter((v) => Math.abs(v.delta) >= 1)

  return (
    <div className="modal-backdrop" role="presentation" onClick={dismissOffline}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="offline-title" className="modal__title">
          <Clock size={22} /> Welcome back
        </h2>
        <p className="modal__body">
          You were away for {formatTime(Math.floor(summary.elapsedMs / 1000))}. Here's what
          happened while you were gone.
          {summary.cappedByTime
            ? ` Only the first ${OFFLINE_MAX_TICKS / 3600} hours were simulated.`
            : ''}
          {summary.stoppedBeforeDeath
            ? ' Your character was on the brink — simulation stopped to keep you alive.'
            : ''}
        </p>

        <dl className="modal__summary">
          <div>
            <dt>Time simulated</dt>
            <dd>{formatTime(summary.ticks)}</dd>
          </div>
          <div>
            <dt>Money</dt>
            <dd className="offline__money" data-dir={summary.moneyDelta < 0 ? 'down' : 'up'}>
              <Coins size={14} /> {signedMoney(summary.moneyDelta)}$
            </dd>
          </div>
        </dl>

        {changed.length > 0 ? (
          <ul className="offline__vitals">
            {changed.map((v) => {
              const Glyph = statIcon[v.key]
              return (
                <li key={v.key} className="offline__vital" data-dir={v.delta < 0 ? 'down' : 'up'}>
                  <span className="offline__vital-name">
                    {Glyph ? <Glyph size={14} /> : null} {v.label}
                  </span>
                  <span className="offline__vital-delta num">{signedDelta(v.delta)}</span>
                </li>
              )
            })}
          </ul>
        ) : null}

        <div className="modal__actions">
          <button type="button" className="btn btn--primary" onClick={dismissOffline}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
