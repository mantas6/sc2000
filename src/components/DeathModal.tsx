/**
 * Death summary modal — replaces the legacy `alert('You have survived ...')`.
 *
 * Rendered only while a `DeathInfo` is pending in the store; shows how long the
 * character survived and how much was digested (using the same formatting as
 * the HUD), and dismisses via `DISMISS_DEATH`.
 */

import type { DeathCause } from '../game/engine'
import { formatDigested, formatTime } from '../game/format'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

/**
 * Human-readable cause copy: the phrase completing "You died of …" plus a
 * one-line tip on avoiding it next time.
 */
const CAUSE_COPY: Record<DeathCause, { label: string; tip: string }> = {
  dehydration: {
    label: 'dehydration',
    tip: 'Keep hydration up — buy drinks from the Drink tab before it runs dry.',
  },
  starvation: {
    label: 'starvation',
    tip: 'Keep energy up — eat regularly from the Food tab.',
  },
  hypothermia: {
    label: 'hypothermia',
    tip: 'Stay warm — buy warmer clothing from the Clothing tab.',
  },
  hyperthermia: {
    label: 'hyperthermia',
    tip: 'Cool down — wear looser clothing from the Clothing tab.',
  },
  exhaustion: {
    label: 'exhaustion',
    tip: "Don't overwork — let stamina recover between jobs.",
  },
  injuries: {
    label: 'your injuries',
    tip: 'Keep your vitals balanced so your body has a chance to heal.',
  },
}

export function DeathModal() {
  const { state, dismissDeath } = useGame()
  const death = state.death
  if (death === null) return null

  const Skull = roleIcon.reset
  const cause = CAUSE_COPY[death.cause]

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
          <Skull size={22} /> You died of {cause.label}
        </h2>
        <p className="modal__body">{cause.tip}</p>
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
