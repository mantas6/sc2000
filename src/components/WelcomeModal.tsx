/**
 * First-run welcome overlay — a short, one-time primer for brand-new players.
 *
 * Shown only for a fresh game (no save) that hasn't dismissed it before; once
 * dismissed the flag is persisted so it never reappears. Styling reuses the
 * existing `.modal` chrome (see {@link DeathModal}) to match the dark monitor
 * theme. Local component state, so it never touches the game store.
 */

import { useState } from 'react'
import { setOnboarded, shouldShowWelcome } from '../game/onboarding'
import { statIcon } from '../ui/icons'

export function WelcomeModal() {
  const [open, setOpen] = useState(shouldShowWelcome)
  if (!open) return null

  const Heart = statIcon.health!

  const dismiss = () => {
    setOnboarded()
    setOpen(false)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={dismiss}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="welcome-title" className="modal__title">
          <Heart size={22} /> Welcome to Survival Clicker
        </h2>
        <ul className="welcome__list">
          <li>Keep your character alive by managing six vitals — health, stamina, stomach, energy, hydration and temperature.</li>
          <li>Click <strong>Basic Work</strong> in the Work tab — or press <kbd>Space</kbd> — to earn money.</li>
          <li>Spend it on food, drink and warmer clothing before a vital runs out.</li>
          <li>Watch the hints and vitals bars — amber means low, pulsing red means critical.</li>
        </ul>
        <div className="modal__actions">
          <button type="button" className="btn btn--primary" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
