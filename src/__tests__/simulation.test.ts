import { describe, expect, it } from 'vitest'
import { tick } from '../game/engine'
import { createInitialState } from '../game/initialState'
import type { GameState } from '../game/types'

/**
 * Headless, simulation-style fidelity test.
 *
 * `referenceTick` below is an INDEPENDENT transcription of the original
 * `window.setInterval(..., 1000)` body from the legacy `script.js`
 * (survival-clicker, lines 363-571), translated line-for-line into a pure
 * function with the DOM / autosave / thoughts / background-flash side effects
 * stripped out. It deliberately re-implements the arithmetic from the original
 * source rather than importing any of the app's constants, so it can catch a
 * regression in `engine.ts` or `constants.ts` that silently diverges from the
 * legacy numbers.
 *
 * The test drives both the real engine and this reference from the exact
 * initial state for 100 ticks and asserts they stay bit-for-bit identical, then
 * pins a few hand-computed trajectory values so the absolute numbers are
 * anchored (not just "engine == engine's twin").
 */

/** Line-for-line port of the original tick loop (no DOM, no thoughts). */
function referenceTick(game: GameState): GameState {
  const g: GameState = {
    ...game,
    unlocked: { ...game.unlocked },
    bought: { ...game.bought },
  }

  if (g.pause) return g

  /* Taxes */
  if (g.taxes > 1) {
    g.taxes = 1
  } else if (g.taxes > 0.01) {
    g.taxes -= g.taxes * 0.00015
  }
  g.money += g.moneyincome * g.taxes

  if (g.money < 0) {
    g.taxes -= 0.00003
  }

  g.time++
  g.digestionmulti -= 0.000075
  g.stomachcap += g.stomachcapin

  /* Body temperature regulation */
  g.temp += g.tempoffset + g.tempoffsetp
  const temp = g.temp

  if (temp >= 42) {
    g.health *= 0.5
    g.hydration *= 0.5
    g.energy *= 0.5
  } else if (temp >= 40) {
    g.health *= 0.95
    g.hydration *= 0.95
    g.energy *= 0.99
  } else if (temp <= 34 && temp >= 32) {
    g.health *= 0.95
    g.energy *= 0.95
  } else if (temp < 32) {
    g.health *= 0.5
    g.energy *= 0.5
  }

  const diff = temp - 36.6
  const gain = diff * -1 * g.tempgain

  if (
    (gain < 0 && g.hydration / g.hydrationcap > 0.01) ||
    (gain > 0 && g.energy / g.energycap > 0.01)
  ) {
    g.temp += gain
  }

  if (gain < 0) {
    g.hydration -= Math.abs(gain * 100)
  } else if (gain > 0) {
    g.energy -= Math.abs(gain * 100)
  }

  /* Health cap loss */
  if (g.healthcaploss > 0) {
    g.healthcap -= g.healthcaploss
  } else {
    g.healthcaploss = 0
  }

  /* Out of stamina condition */
  if (g.stamina <= 0) {
    g.stamina = 0
    g.energy -= 3
    g.hydration -= 5
    g.health -= 0.01
    g.staminacap -= 1
  }

  /* Stamina regen */
  if (g.stamina >= g.staminacap) {
    g.stamina = g.staminacap
  } else {
    if (g.energy > 1 && g.hydration > 1 && g.stamina <= g.staminacap) {
      g.stamina += g.staminaregen
      g.energy -= 0.5
      g.hydration -= 0.75
    }
  }

  if (g.staminacap <= 0) {
    g.health *= 0.99
  }

  if (g.hydrationcap <= 0 || g.energycap <= 0) {
    g.health *= 0.9
  }

  g.energycap += g.energycapin
  g.hydrationcap += g.hydrationcapin
  g.staminacap += g.staminacapin
  g.health += g.healthin

  /* Auto-injecting of resources */
  g.energy += g.energyin
  g.hydration += g.hydrationin
  g.stomach += g.stomachin

  /* Idle resource consumption */
  if (g.energy > 0) g.energy -= 0.5
  else g.energy = 0

  if (g.hydration > 0) g.hydration -= 0.75
  else g.hydration = 0

  if (g.stomach <= 0) g.health *= 0.95
  if (g.stomachcap <= 0) g.health *= 0.95

  /* Digestion */
  if (g.stomach > 0) {
    const digest = (1 / ((g.stomach + 50) / g.stomachcap)) * g.digestionmulti
    g.stomach -= digest
    g.digested += digest
  } else {
    g.digested += Math.abs(g.stomach)
    g.stomach = 0
  }

  /* Vomit */
  if (g.stomach > g.stomachcap) {
    g.stomach *= 0.1
    g.energy *= 0.1
    g.hydration *= 0.1
    g.health *= 0.8
    g.healthcap -= 0.01
    g.stomachcap *= 0.75
  }

  if (g.hydration > g.hydrationcap) g.hydration = g.hydrationcap
  if (g.energy > g.energycap) g.energy = g.energycap
  if (g.health >= g.healthcap) g.health = g.healthcap

  if (g.energy <= 0) g.health *= 0.99
  if (g.hydration <= 0) g.health *= 0.95

  if (g.stomach / g.stomachcap > 0.5) {
    g.stomachcap += 0.1
  } else {
    g.stomachcap -= 0.2
  }

  /* Death → init() (reference mirrors engine: reset then continue). */
  let died = false
  let dead: GameState = g
  if (g.health <= 1) {
    died = true
    dead = createInitialState()
  }
  const h = died ? dead : g

  /* Healing */
  if (
    h.health < h.healthcap &&
    h.energy > 1000 &&
    h.hydration > 1500 &&
    h.temp < 37.1 &&
    h.temp > 35.9 &&
    h.stamina >= h.staminacap
  ) {
    h.health *= 1.005
    h.healthcap -= 0.001
    h.energy -= 2
    h.hydration -= 1
  }

  return h
}

/** Fields to compare between engine and reference (all numeric stats). */
const NUMERIC_KEYS = Object.keys(createInitialState()).filter(
  (k) => k !== 'unlocked' && k !== 'bought' && k !== 'pause',
) as (keyof GameState)[]

describe('simulation — engine vs independent reference (100 ticks)', () => {
  it('stays bit-for-bit identical to a straight port of script.js', () => {
    let engine = createInitialState()
    let reference = createInitialState()

    for (let i = 0; i < 100; i++) {
      // Suppress the RNG-driven thoughts so the tick is deterministic.
      engine = tick(engine, { randp: () => 0 }).state
      reference = referenceTick(reference)

      for (const key of NUMERIC_KEYS) {
        expect(engine[key], `${String(key)} @tick ${i + 1}`).toBe(reference[key])
      }
    }
  })
})

describe('simulation — hand-computed trajectory anchors', () => {
  const ticks = 100
  let s = createInitialState()
  for (let i = 0; i < ticks; i++) s = tick(s, { randp: () => 0 }).state

  it('advances time to exactly the tick count', () => {
    expect(s.time).toBe(100)
  })

  it('drains idle energy by 0.5/tick (no regen at full stamina)', () => {
    // stamina starts == staminacap, so no regen cost; only idle -0.5/tick.
    expect(s.energy).toBeCloseTo(250 - 0.5 * 100, 6)
  })

  it('drains idle hydration by 0.75/tick', () => {
    expect(s.hydration).toBeCloseTo(250 - 0.75 * 100, 6)
  })

  it('keeps money at zero with no income sources', () => {
    expect(s.money).toBe(0)
  })

  it('decays taxes multiplicatively from 0.4', () => {
    // taxes_n = 0.4 * (1 - 0.00015)^100
    expect(s.taxes).toBeCloseTo(0.4 * Math.pow(1 - 0.00015, 100), 10)
  })

  it('holds temperature at the 36.6C baseline (no offset)', () => {
    expect(s.temp).toBe(36.6)
  })

  it('empties the stomach and decays health via the empty-stomach penalty', () => {
    // With no food purchased the stomach digests to empty (~tick 20); from then
    // on `if (stomach <= 0) health *= 0.95` fires every tick, so health decays
    // even though energy/hydration are still positive. This is the faithful
    // "you must keep eating" pressure of the original.
    expect(s.stomach).toBe(0)
    expect(s.health).toBeLessThan(1000)
    expect(s.energy).toBeGreaterThan(0)
    expect(s.hydration).toBeGreaterThan(0)
    // Exact value is locked bit-for-bit against the reference above; pin it here
    // so an accidental balance change is caught loudly.
    expect(s.health).toBeCloseTo(17.384604615803756, 9)
  })
})
