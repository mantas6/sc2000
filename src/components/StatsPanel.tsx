/**
 * The body-status panel: the five capped bars (health, stamina, stomach,
 * energy, hydration) plus the uncapped temperature readout, mirroring the
 * `.progress` rows and `#temp` label in the original index.jade.
 */

import { useEffect, useRef, useState } from 'react'
import { formatTemp } from '../game/format'
import { statIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'
import { StatBar } from './StatBar'

/** Temperature tone, ported from the `#temp` colour rules in `updateText()`. */
function tempTone(temp: number): 'hot' | 'warm' | 'ok' | 'cold' {
  if (temp > 38) return 'hot'
  if (temp > 37) return 'warm'
  if (temp > 36) return 'ok'
  return 'cold'
}

export function StatsPanel() {
  const { state } = useGame()
  const g = state.game

  // Damage / heal cue on the health bar: watch health between ticks and pulse
  // the track red on a drop, green on a gain. Cleared after the animation.
  const prevHealth = useRef(g.health)
  const [healthFlash, setHealthFlash] = useState<'damage' | 'heal' | null>(null)
  useEffect(() => {
    const delta = g.health - prevHealth.current
    prevHealth.current = g.health
    if (Math.abs(delta) < 0.5) return
    setHealthFlash(delta < 0 ? 'damage' : 'heal')
    const id = window.setTimeout(() => setHealthFlash(null), 620)
    return () => window.clearTimeout(id)
  }, [g.health])

  return (
    <section className="stats-panel" aria-label="Body status">
      <div className="stats-panel__heading">
        <h2 className="stats-panel__title">Vitals</h2>
        <span className="stats-panel__pulse" aria-hidden="true" />
      </div>
      <StatBar
        icon={statIcon.health!}
        label="Health"
        tone="health"
        value={g.health}
        cap={g.healthcap}
        flash={healthFlash}
      />
      <StatBar icon={statIcon.stamina!} label="Stamina" tone="stamina" value={g.stamina} cap={g.staminacap} />
      <StatBar icon={statIcon.stomach!} label="Stomach" tone="stomach" value={g.stomach} cap={g.stomachcap} />
      <StatBar icon={statIcon.energy!} label="Energy" tone="energy" value={g.energy} cap={g.energycap} />
      <StatBar
        icon={statIcon.hydration!}
        label="Hydration"
        tone="hydration"
        value={g.hydration}
        cap={g.hydrationcap}
      />
      <div className="stats-panel__temp" data-temp={tempTone(g.temp)}>
        <StatBar icon={statIcon.temp!} label="Temperature" tone="temp" value={g.temp} text={formatTemp(g.temp)} />
      </div>
    </section>
  )
}
