/**
 * Contextual hint strip: a single, deterministic one-liner shown under the
 * header when a vital is running low, pointing the player at the tab that fixes
 * it. Subtle and non-intrusive — it renders nothing while all vitals are
 * comfortable, and complements (does not replace) the random `ThoughtsLog`.
 *
 * All logic lives in the pure `deriveHint`; this component only presents it.
 */

import { deriveHint } from '../game/guidance'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

export function HintBar() {
  const { state } = useGame()
  const hint = deriveHint(state.game)
  if (hint === null) return null

  const Warn = roleIcon.ban

  return (
    <div className="hint-bar" role="status" aria-live="polite" data-hint={hint.id}>
      <span className="hint-bar__icon" aria-hidden="true">
        <Warn size={15} />
      </span>
      <span className="hint-bar__text">{hint.text}</span>
    </div>
  )
}
