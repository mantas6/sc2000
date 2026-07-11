/**
 * Top HUD bar: money, per-second income, tax relief, time survived and digested
 * volume, plus the pause/resume toggle and the "Restart" (reset) control.
 *
 * Values are formatted exactly as the original `updateText()`; the reset uses a
 * modal confirmation instead of the legacy `window.confirm` (per TODO cleanup).
 */

import { useEffect, useRef, useState } from 'react'
import { formatDigested, formatMoney, formatTaxes, formatTime } from '../game/format'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'
import { SettingsModal } from './SettingsModal'

/** Money can be negative; `formatMoney` drops the sign, so re-apply it here. */
function signedMoney(money: number): string {
  const s = formatMoney(money)
  return money < 0 ? `-${s}` : s
}

export function Header() {
  const { state, togglePause, reset } = useGame()
  const g = state.game
  const [confirming, setConfirming] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Money change-flash: bump a keyed nonce whenever money moves so the value
  // span re-mounts and replays its up/down animation (respecting reduced motion
  // via CSS). Direction drives the colour cue.
  const prevMoney = useRef(g.money)
  const [flash, setFlash] = useState<{ dir: 'up' | 'down'; n: number } | null>(null)
  useEffect(() => {
    const delta = g.money - prevMoney.current
    prevMoney.current = g.money
    if (delta === 0) return
    setFlash((f) => ({ dir: delta > 0 ? 'up' : 'down', n: (f?.n ?? 0) + 1 }))
  }, [g.money])

  const Pause = roleIcon.pause
  const Play = roleIcon.play
  const Coins = roleIcon.money
  const Income = roleIcon.income
  const Percent = roleIcon.taxes
  const Clock = roleIcon.time
  const Digested = roleIcon.digested
  const Skull = roleIcon.reset
  const Gear = roleIcon.settings

  const income = g.moneyincome * g.taxes
  // Hide irrelevant HUD entries to cut noise: full taxation → no relief to show;
  // nothing digested yet → no volume readout.
  const showTaxes = g.taxes < 1
  const showDigested = g.digested > 0

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__title">Survival Clicker</span>
        <span className="header__version num">2000</span>
      </div>

      <div className="hud__money" title="Money">
        <Coins size={26} />
        <div className="hud__money-main">
          <span key={flash?.n} data-flash={flash?.dir} className="hud__money-value num">
            {signedMoney(g.money)}$
          </span>
          <div className="hud__money-sub">
            <span className="hud__sub num" title="Income per second">
              <Income size={13} /> {formatMoney(income)}$/s
            </span>
            {showTaxes ? (
              <span className="hud__sub num" title="Tax relief">
                <Percent size={13} /> {formatTaxes(g.taxes)}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <dl className="hud__meta">
        <div className="hud__chip" title="Time survived">
          <Clock size={16} />
          <dt className="sr-only">Time survived</dt>
          <dd className="num">{formatTime(g.time)}</dd>
        </div>
        {showDigested ? (
          <div className="hud__chip" title="Digested volume">
            <Digested size={16} />
            <dt className="sr-only">Digested</dt>
            <dd className="num">{formatDigested(g.digested)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="header__controls">
        <button
          type="button"
          className="btn"
          onClick={togglePause}
          aria-pressed={g.pause}
        >
          {g.pause ? <Play size={18} /> : <Pause size={18} />}
          <span>{g.pause ? 'Resume' : 'Pause'}</span>
        </button>
        <button type="button" className="btn btn--danger" onClick={() => setConfirming(true)}>
          <Skull size={18} />
          <span>Restart</span>
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          title="Settings"
        >
          <Gear size={18} />
        </button>
      </div>

      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}

      {confirming ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirming(false)}>
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-title" className="modal__title">
              <Skull size={22} /> Start over?
            </h2>
            <p className="modal__body">
              This resets your progress and starts a fresh life. There is no undo.
            </p>
            <div className="modal__actions">
              <button type="button" className="btn" onClick={() => setConfirming(false)}>
                Keep living
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  reset()
                  setConfirming(false)
                }}
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
