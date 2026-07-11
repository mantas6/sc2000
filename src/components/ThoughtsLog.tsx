/**
 * The character's rolling thoughts log (the original read-only `#log`).
 *
 * Reads the bounded `thoughts` list from the store (already capped at
 * `THOUGHTS_LOG_MAX`) and shows newest first so the latest thought is visible
 * without scrolling.
 */

import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

export function ThoughtsLog() {
  const { state } = useGame()
  const Brain = roleIcon.brain
  const entries = [...state.thoughts].reverse()

  return (
    <section className="thoughts" aria-label="Thoughts">
      <h2 className="thoughts__title">
        <Brain size={18} /> Thoughts
      </h2>
      <ul className="thoughts__list">
        {entries.length === 0 ? (
          <li className="thoughts__empty">…</li>
        ) : (
          entries.map((t) => (
            <li key={t.id} className="thoughts__item">
              {t.text}
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
