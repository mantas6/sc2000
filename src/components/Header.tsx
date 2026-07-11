/**
 * Top HUD bar: money, per-second income, tax relief, time survived and digested
 * volume, plus the pause/resume toggle and the "Suicide" (reset) control.
 *
 * Values are formatted exactly as the original `updateText()`; the reset uses a
 * modal confirmation instead of the legacy `window.confirm` (per TODO cleanup).
 */

import { useState } from 'react'
import { formatDigested, formatMoney, formatTaxes, formatTime } from '../game/format'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

/** Money can be negative; `formatMoney` drops the sign, so re-apply it here. */
function signedMoney(money: number): string {
  const s = formatMoney(money)
  return money < 0 ? `-${s}` : s
}

export function Header() {
  const { state, togglePause, reset } = useGame()
  const g = state.game
  const [confirming, setConfirming] = useState(false)

  const Pause = roleIcon.pause
  const Play = roleIcon.play
  const Coins = roleIcon.money
  const Income = roleIcon.income
  const Percent = roleIcon.taxes
  const Clock = roleIcon.time
  const Digested = roleIcon.digested
  const Skull = roleIcon.reset

  const income = g.moneyincome * g.taxes

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__title">Survival Clicker</span>
        <span className="header__version">2000</span>
      </div>

      <dl className="header__stats">
        <div className="header__stat" title="Money">
          <Coins size={18} />
          <dt>Money</dt>
          <dd>{signedMoney(g.money)}$</dd>
        </div>
        <div className="header__stat" title="Income per second">
          <Income size={18} />
          <dt>Income</dt>
          <dd>{formatMoney(income)}$/s</dd>
        </div>
        <div className="header__stat" title="Tax relief">
          <Percent size={18} />
          <dt>Taxes</dt>
          <dd>{formatTaxes(g.taxes)}%</dd>
        </div>
        <div className="header__stat" title="Time survived">
          <Clock size={18} />
          <dt>Alive</dt>
          <dd>{formatTime(g.time)}</dd>
        </div>
        <div className="header__stat" title="Digested volume">
          <Digested size={18} />
          <dt>Digested</dt>
          <dd>{formatDigested(g.digested)}</dd>
        </div>
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
          <span>Suicide</span>
        </button>
      </div>

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
              <Skull size={22} /> End it all?
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
                Suicide
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
