/**
 * A single labelled status row: glyph + name + a proportional fill bar (for
 * capped stats) or a plain value chip (for uncapped readouts like temperature).
 *
 * Faithful to the original `updateText()`, which set each bar's width to
 * `value / cap * 100%` and its text to `round(value) / round(cap)`.
 */

import type { DangerLevel } from '../game/guidance'
import type { IconComponent } from './icons'

export interface StatBarProps {
  /** Glyph shown at the start of the row. */
  icon: IconComponent
  /** Human-readable stat name. */
  label: string
  /** Current value (used for the default `value / cap` text). */
  value: number
  /**
   * Capacity. When provided the row renders a fill bar at `value / cap`;
   * when omitted it renders a value chip (no bar), e.g. temperature.
   */
  cap?: number
  /** Overrides the default readout text. */
  text?: string
  /** Visual tone (drives the bar/label colour via CSS). */
  tone?: 'health' | 'stamina' | 'stomach' | 'energy' | 'hydration' | 'temp'
  /** Transient feedback cue (drives the red/green track pulse via CSS). */
  flash?: 'damage' | 'heal' | null
  /**
   * Danger level for the vital: `'warn'` tints the bar amber, `'critical'`
   * turns it red and pulses so danger reads at a glance. Computed by the caller
   * (see `guidance.statDanger`) so per-vital semantics stay out of this
   * presentational component.
   */
  danger?: DangerLevel
}

/** Clamp a ratio into the `[0, 1]` display range. */
function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  if (x < 0) return 0
  if (x > 1) return 1
  return x
}

export function StatBar({ icon: Glyph, label, value, cap, text, tone, flash, danger }: StatBarProps) {
  const readout =
    text ?? (cap !== undefined ? `${Math.round(value)} / ${Math.round(cap)}` : String(Math.round(value)))
  const pct = cap !== undefined ? clamp01(value / cap) * 100 : null

  return (
    <div
      className="stat-bar"
      data-tone={tone}
      data-flash={flash ?? undefined}
      data-danger={danger ?? undefined}
      title={label}
    >
      <span className="stat-bar__icon" aria-hidden="true">
        <Glyph size={18} />
      </span>
      <span className="stat-bar__label sr-only">{label}</span>
      {pct !== null ? (
        <span
          className="stat-bar__track"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <span className="stat-bar__fill" style={{ width: `${pct}%` }} />
          <span className="stat-bar__value">{readout}</span>
        </span>
      ) : (
        <span className="stat-bar__chip">{readout}</span>
      )}
    </div>
  )
}
