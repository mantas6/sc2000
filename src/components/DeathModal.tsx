/**
 * Death summary modal — replaces the legacy `alert('You have survived ...')`.
 *
 * Rendered only while a `DeathInfo` is pending in the store; shows how long the
 * character survived and how much was digested (using the same formatting as
 * the HUD), and dismisses via `DISMISS_DEATH`.
 */

import { formatDigested, formatTime } from '../game/format'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

export function DeathModal() {
  const { state, dismissDeath } = useGame()
  const death = state.death
  if (death === null) return null

  const Skull = roleIcon.reset

  return (
    <div className="modal-backdrop" role="presentation" onClick={dismissDeath}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="death-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="death-title" className="modal__title">
          <Skull size={22} /> You died
        </h2>
        <dl className="modal__summary">
          <div>
            <dt>Survived for</dt>
            <dd>{formatTime(death.time)}</dd>
          </div>
          <div>
            <dt>Digested</dt>
            <dd>{formatDigested(death.digested)}</dd>
          </div>
        </dl>
        <div className="modal__actions">
          <button type="button" className="btn btn--primary" onClick={dismissDeath}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
