/**
 * Character "thoughts" — a faithful port of the original `thoughts()` function
 * in script.js (lines 201-276).
 *
 * The original wrote status messages to `#log` via a `log()` helper that simply
 * overwrote the element's text; the *last* `log()` call in a given tick won.
 * This module models that as a pure function that returns the final message:
 *
 *   - a non-empty string  → a new thought to display
 *   - an empty string `''` → clear the log (the original's `log('')`)
 *   - `null`              → no change this tick (nothing was logged)
 *
 * Randomness is injected via the `rp` argument (the original `randp()`), so the
 * engine and tests can drive it deterministically. `randp()` reproduces the
 * legacy `rand(0, 100)` → `Math.floor(Math.random() * 100)` (range 0..99).
 *
 * NOTE ON FIDELITY: several of the original `else if` chains test *subset*
 * conditions (e.g. `energy < 100` then `else if energy < 20`), so the later
 * branches can never fire. That behaviour is preserved verbatim rather than
 * "fixed", because balance fidelity is the priority.
 */

import type { GameState } from './types'

/** Port of `randp()` → `rand(0, 100)` → integer in [0, 99]. */
export function randp(): number {
  return Math.floor(Math.random() * 100)
}

/**
 * Compute the character's thought for the current state.
 *
 * @param state game state (read-only; never mutated)
 * @param rp    random provider returning an integer like the original `randp()`
 * @returns the final logged message, `''` to clear, or `null` for no change
 */
export function think(state: GameState, rp: () => number = randp): string | null {
  let msg: string | null = null
  const log = (m: string) => {
    msg = m
  }

  if (rp() > 90) {
    log('')
  }

  /* Stomach — fullness */
  const stomachRatio = state.stomach / state.stomachcap
  if (stomachRatio > 0.99) {
    log("Shit, I'm vomiting!")
  } else if (stomachRatio > 0.9 && rp() > 70) {
    log('I going to freaking vomit!')
  } else if (stomachRatio > 0.8 && rp() > 80) {
    log('I feel really full')
  }

  /* Stomach — hunger (separate chain; can override the fullness message) */
  if (stomachRatio < 0.02) {
    if (rp() > 70) {
      log('My stomach hurts!')
    }
  } else if (stomachRatio < 0.1) {
    if (rp() > 85) {
      log("I'm feeling very hungry")
    }
  } else if (stomachRatio < 0.2) {
    if (rp() > 85) {
      log('I feel like having a snack')
    }
  }

  /* Low energy (later branches unreachable — preserved from original) */
  if (state.energy < 100 && rp() > 95) {
    log("I'm feeling weak. I probably need to eat something")
  } else if (state.energy < 20 && rp() > 90) {
    log("I'm feeling really weak. I should eat something!")
  } else if (state.energy < 5 && rp() > 85) {
    log('I\'m have no energy left. I need food!')
  }

  /* Low hydration (later branches unreachable — preserved from original) */
  if (state.hydration < 100 && rp() > 95) {
    log('I feel like I need a drink')
  } else if (state.hydration < 20 && rp() > 90) {
    log('I really badly need a drink!')
  } else if (state.hydration < 5 && rp() > 80) {
    log('I really really badly need a drink!')
  }

  /* Low stamina (second branch unreachable — preserved from original) */
  const staminaRatio = state.stamina / state.staminacap
  if (staminaRatio < 0.1) {
    if (rp() > 90) {
      log("I 'm running out of breath!")
    }
  } else if (staminaRatio < 0.01) {
    if (rp() > 90) {
      log('My muscles hurt so badly!')
    }
  }

  /* Temperature */
  if (state.temp > 40 && rp() > 95) {
    log('I feel like burning in hell')
  } else if (state.temp > 37.5 && rp() > 99) {
    log('I feel hot')
  } else if (state.temp < 35.5 && rp() > 99) {
    log('I feel cold')
  } else if (state.temp < 34.0 && rp() > 95) {
    log("I'm freezing to death")
  }

  /* Low HP (later branches unreachable — preserved from original) */
  const healthRatio = state.health / state.healthcap
  if (healthRatio < 0.1 && rp() > 95) {
    log('I can imagine myself dying')
  } else if (healthRatio < 0.05 && rp() > 95) {
    log('I feel my body shutting down...')
  } else if (healthRatio < 0.01 && rp() > 90) {
    log("I'm dying!")
  }

  return msg
}
