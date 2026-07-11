/**
 * Pure game engine — a faithful port of the 1s tick loop and click handler in
 * the original script.js. No DOM, no React, no side effects: every exported
 * function returns a new value and never mutates its inputs.
 *
 * The tick order below mirrors the original `window.setInterval(..., 1000)`
 * body (script.js lines 355-589) exactly, per TODO.md "Engine order":
 *
 *   taxes decay → income → time++ → digestion decay → stomach-cap growth →
 *   temperature regulation (deadly states + hydration/energy cost) →
 *   healthcap loss → stamina drain/regen → cap growth → healthin → auto-inject
 *   → idle drain → empty/destroyed-stomach damage → digestion → vomit →
 *   clamp caps → starvation/dehydration → stomach-cap adjust → death check →
 *   healing → thoughts.
 *
 * Sanctioned cleanups from TODO.md are applied (dead `if (temp < 36.8) {}`
 * dropped, unused `eff` object dropped, DOM/background-flash removed, `alert`
 * replaced by a returned `DeathInfo`), while every numeric operation is kept
 * bit-for-bit faithful.
 */

import {
  CAP_DEPLETED_HEALTH,
  DEATH_HEALTH,
  DEHYDRATION_HEALTH,
  DIGESTION_MULTI_DECAY,
  DIGESTION_OFFSET,
  HEAL_ENERGY_COST,
  HEAL_HEALTH_GAIN,
  HEAL_HEALTHCAP_LOSS,
  HEAL_HYDRATION_COST,
  HEAL_MIN_ENERGY,
  HEAL_MIN_HYDRATION,
  HEAL_TEMP_MAX,
  HEAL_TEMP_MIN,
  IDLE_ENERGY_DRAIN,
  IDLE_HYDRATION_DRAIN,
  NORMAL_TEMP,
  STAMINA_EMPTY_CAP_COST,
  STAMINA_EMPTY_ENERGY_COST,
  STAMINA_EMPTY_HEALTH_COST,
  STAMINA_EMPTY_HYDRATION_COST,
  STAMINA_REGEN_MIN_ENERGY,
  STAMINA_REGEN_MIN_HYDRATION,
  STAMINA_REGEN_ENERGY_COST,
  STAMINA_REGEN_HYDRATION_COST,
  STAMINACAP_DEPLETED_HEALTH,
  STARVATION_HEALTH,
  STOMACH_EMPTY_HEALTH,
  STOMACHCAP_DESTROYED_HEALTH,
  STOMACHCAP_GROW_RATE,
  STOMACHCAP_GROW_THRESHOLD,
  STOMACHCAP_SHRINK_RATE,
  TAXES_DEBT_PENALTY,
  TAXES_DECAY_FLOOR,
  TAXES_DECAY_RATE,
  TAXES_MAX,
  TEMP_DANGER_COLD,
  TEMP_DANGER_COLD_ENERGY,
  TEMP_DANGER_COLD_HEALTH,
  TEMP_DANGER_HOT,
  TEMP_DANGER_HOT_ENERGY,
  TEMP_DANGER_HOT_HEALTH,
  TEMP_DANGER_HOT_HYDRATION,
  TEMP_LETHAL_COLD,
  TEMP_LETHAL_COLD_ENERGY,
  TEMP_LETHAL_COLD_HEALTH,
  TEMP_LETHAL_HOT,
  TEMP_LETHAL_HOT_ENERGY,
  TEMP_LETHAL_HOT_HEALTH,
  TEMP_LETHAL_HOT_HYDRATION,
  TEMP_REGULATION_COST,
  TEMP_REGULATION_RESERVE,
  VOMIT_ENERGY,
  VOMIT_HEALTH,
  VOMIT_HEALTHCAP_LOSS,
  VOMIT_HYDRATION,
  VOMIT_STOMACH,
  VOMIT_STOMACHCAP,
} from './constants'
import { createInitialState } from './initialState'
import { randp, think } from './thoughts'
import type { GameState, Item, StatMap } from './types'

/**
 * Survival summary produced when the character dies. Replaces the original
 * `alert('You have survived for ...')`; the store surfaces it via a modal.
 */
export interface DeathInfo {
  /** `game.time` at the moment of death (seconds). */
  time: number
  /** `game.digested` at the moment of death (litres, unscaled). */
  digested: number
}

/** Options for {@link tick}; lets callers/tests inject the RNG. */
export interface TickOptions {
  /** Random provider mirroring the original `randp()` (integer 0..99). */
  randp?: () => number
}

/** Result of a single {@link tick}. */
export interface TickResult {
  /** The next game state. On death this is a fresh initial state (faithful to
   *  the original calling `init()` mid-tick). */
  state: GameState
  /** The character's thought this tick (`''` clears, `null` = unchanged). */
  thought: string | null
  /** Populated iff the character died this tick, else `null`. */
  death: DeathInfo | null
}

/** Shallow-clone state with fresh `unlocked` / `bought` maps (no mutation). */
function clone(state: GameState): GameState {
  return {
    ...state,
    unlocked: { ...state.unlocked },
    bought: { ...state.bought },
  }
}

/** Apply additive `effects` (`game[key] += value`). */
function applyEffects(state: GameState, effects: StatMap | undefined): void {
  if (!effects) return
  for (const key in effects) {
    const k = key as keyof StatMap
    state[k] += effects[k] as number
  }
}

/** Apply assignment `set` (`game[key] = value`; the `tempoffset` quirk). */
function applySets(state: GameState, set: StatMap | undefined): void {
  if (!set) return
  for (const key in set) {
    const k = key as keyof StatMap
    state[k] = set[k] as number
  }
}

/**
 * Whether the player can afford an item — port of the click-handler gate
 * `$(this).attr('money') > 0 || game.money >= Math.abs($(this).attr('money'))`.
 *
 * A positive `cost` is income (always affordable); a non-positive `cost`
 * requires enough money to cover its absolute value. Note that free items
 * (`cost === 0`) are unaffordable while in debt, exactly as in the original.
 */
export function canAfford(state: GameState, item: Item): boolean {
  return item.cost > 0 || state.money >= Math.abs(item.cost)
}

/**
 * Whether an item should be visible to the player — a pure predicate distilled
 * from the original `init()` hide rules and `updateStatus()` reveal loops.
 *
 * Rules (mirroring the final class state after all three jQuery loops):
 *  - Buyables (`buyname`): visible iff their buy-chain flag `bought[buyname]`
 *    is set (the `.buyable` loop runs last and wins).
 *  - Unlock-purchase buttons (`unlock`, no `buyname`): hidden once used
 *    (`bought[unlock]` set).
 *  - Plain consumables: income/free items (`cost >= 0`) are always visible;
 *    priced items reveal when first affordable and then stay revealed via the
 *    persistent `unlocked[id]` flag (the store records this on reveal).
 */
export function isVisible(state: GameState, item: Item): boolean {
  if (item.buyname !== undefined) {
    return state.bought[item.buyname] === true
  }
  if (item.unlock !== undefined && state.bought[item.unlock] === true) {
    return false
  }
  if (item.cost >= 0) {
    return true
  }
  return state.money >= Math.abs(item.cost) || state.unlocked[item.id] === true
}

/**
 * Apply an item's cost / effects / set plus unlock-chain bookkeeping — port of
 * the `button.consumable.click` handler (script.js lines 321-353).
 *
 * - Gated by pause and affordability (returns the input unchanged if blocked).
 * - Unlock items apply once: they set `bought[unlock]` and apply their deltas
 *   only if that flag was not already set (a repeated click is inert).
 * - Consumables apply `cost` + additive `effects` every time, with `set`
 *   values assigned (models the original `tempoffset =` assignment).
 */
export function applyItem(state: GameState, item: Item): GameState {
  if (state.pause) return state
  if (!canAfford(state, item)) return state

  if (item.unlock !== undefined) {
    // Unlock/buy chain: only fires the first time.
    if (state.bought[item.unlock] === true) return state
    const next = clone(state)
    next.bought[item.unlock] = true
    next.money += item.cost
    applyEffects(next, item.effects)
    applySets(next, item.set)
    return next
  }

  const next = clone(state)
  next.money += item.cost
  applyEffects(next, item.effects)
  applySets(next, item.set)
  return next
}

/**
 * Advance the simulation by one second. Pure: clones the input, mutates the
 * clone through the faithful ordered sequence, and returns it alongside the
 * emitted thought and (if any) death summary.
 */
export function tick(state: GameState, options: TickOptions = {}): TickResult {
  // Paused ticks are a no-op (original: `if (game.pause) return;`).
  if (state.pause) {
    return { state, thought: null, death: null }
  }

  const rp = options.randp ?? randp
  let g = clone(state)
  let death: DeathInfo | null = null

  /* Taxes */
  if (g.taxes > TAXES_MAX) {
    g.taxes = TAXES_MAX
  } else if (g.taxes > TAXES_DECAY_FLOOR) {
    g.taxes -= g.taxes * TAXES_DECAY_RATE
  }
  /* Income (uses the just-updated taxes) */
  g.money += g.moneyincome * g.taxes

  /* Debt penalty */
  if (g.money < 0) {
    g.taxes -= TAXES_DEBT_PENALTY
  }

  g.time++
  g.digestionmulti -= DIGESTION_MULTI_DECAY
  g.stomachcap += g.stomachcapin

  /* Body temperature regulation */
  g.temp += g.tempoffset + g.tempoffsetp
  const temp = g.temp

  /* Deadly states */
  if (temp >= TEMP_LETHAL_HOT) {
    g.health *= TEMP_LETHAL_HOT_HEALTH
    g.hydration *= TEMP_LETHAL_HOT_HYDRATION
    g.energy *= TEMP_LETHAL_HOT_ENERGY
  } else if (temp >= TEMP_DANGER_HOT) {
    g.health *= TEMP_DANGER_HOT_HEALTH
    g.hydration *= TEMP_DANGER_HOT_HYDRATION
    g.energy *= TEMP_DANGER_HOT_ENERGY
  } else if (temp <= TEMP_DANGER_COLD && temp >= TEMP_LETHAL_COLD) {
    g.health *= TEMP_DANGER_COLD_HEALTH
    g.energy *= TEMP_DANGER_COLD_ENERGY
  } else if (temp < TEMP_LETHAL_COLD) {
    g.health *= TEMP_LETHAL_COLD_HEALTH
    g.energy *= TEMP_LETHAL_COLD_ENERGY
  }

  /* Regulation toward normal temperature */
  const diff = temp - NORMAL_TEMP
  const gain = diff * -1 * g.tempgain

  if (
    (gain < 0 && g.hydration / g.hydrationcap > TEMP_REGULATION_RESERVE) ||
    (gain > 0 && g.energy / g.energycap > TEMP_REGULATION_RESERVE)
  ) {
    g.temp += gain
  }

  if (gain < 0) {
    g.hydration -= Math.abs(gain * TEMP_REGULATION_COST)
  } else if (gain > 0) {
    g.energy -= Math.abs(gain * TEMP_REGULATION_COST)
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
    g.energy -= STAMINA_EMPTY_ENERGY_COST
    g.hydration -= STAMINA_EMPTY_HYDRATION_COST
    g.health -= STAMINA_EMPTY_HEALTH_COST
    g.staminacap -= STAMINA_EMPTY_CAP_COST
  }

  /* Stamina regen */
  if (g.stamina >= g.staminacap) {
    g.stamina = g.staminacap
  } else {
    if (
      g.energy > STAMINA_REGEN_MIN_ENERGY &&
      g.hydration > STAMINA_REGEN_MIN_HYDRATION &&
      g.stamina <= g.staminacap
    ) {
      g.stamina += g.staminaregen
      g.energy -= STAMINA_REGEN_ENERGY_COST
      g.hydration -= STAMINA_REGEN_HYDRATION_COST
    }
  }

  /* If no max stamina left */
  if (g.staminacap <= 0) {
    g.health *= STAMINACAP_DEPLETED_HEALTH
  }

  /* No max hydration or energy left */
  if (g.hydrationcap <= 0 || g.energycap <= 0) {
    g.health *= CAP_DEPLETED_HEALTH
  }

  /* Hydration and Energy cap increase */
  g.energycap += g.energycapin
  g.hydrationcap += g.hydrationcapin

  /* Stamina cap decay/increase */
  g.staminacap += g.staminacapin

  /* Health loss/increase */
  g.health += g.healthin

  /* Auto-injecting of resources */
  g.energy += g.energyin
  g.hydration += g.hydrationin
  g.stomach += g.stomachin

  /* Idle resource consumption */
  if (g.energy > 0) {
    g.energy -= IDLE_ENERGY_DRAIN
  } else {
    g.energy = 0
  }

  if (g.hydration > 0) {
    g.hydration -= IDLE_HYDRATION_DRAIN
    // original had a dead `if (game.temp < 36.8) {}` here — dropped (cleanup)
  } else {
    g.hydration = 0
  }

  /* Empty stomach effect */
  if (g.stomach <= 0) {
    g.health *= STOMACH_EMPTY_HEALTH
  }

  /* Stomach destroyed */
  if (g.stomachcap <= 0) {
    g.health *= STOMACHCAP_DESTROYED_HEALTH
  }

  /* Digestion */
  if (g.stomach > 0) {
    const digest =
      (1 / ((g.stomach + DIGESTION_OFFSET) / g.stomachcap)) * g.digestionmulti
    g.stomach -= digest
    g.digested += digest
  } else {
    g.digested += Math.abs(g.stomach)
    g.stomach = 0
  }

  /* Vomit */
  if (g.stomach > g.stomachcap) {
    g.stomach *= VOMIT_STOMACH
    g.energy *= VOMIT_ENERGY
    g.hydration *= VOMIT_HYDRATION
    g.health *= VOMIT_HEALTH
    g.healthcap -= VOMIT_HEALTHCAP_LOSS
    g.stomachcap *= VOMIT_STOMACHCAP
  }

  /* Clamp caps */
  if (g.hydration > g.hydrationcap) {
    g.hydration = g.hydrationcap
  }
  if (g.energy > g.energycap) {
    g.energy = g.energycap
  }
  if (g.health >= g.healthcap) {
    g.health = g.healthcap
  }

  /* Starvation and dehydration */
  if (g.energy <= 0) {
    g.health *= STARVATION_HEALTH
  }
  if (g.hydration <= 0) {
    g.health *= DEHYDRATION_HEALTH
  }

  /* Stomach capacity self-adjust */
  if (g.stomach / g.stomachcap > STOMACHCAP_GROW_THRESHOLD) {
    g.stomachcap += STOMACHCAP_GROW_RATE
  } else {
    g.stomachcap -= STOMACHCAP_SHRINK_RATE
  }

  /* Death — capture the survival summary, then reset (original called init()
     and continued executing the remainder of the tick on the fresh state). */
  if (g.health <= DEATH_HEALTH) {
    death = { time: g.time, digested: g.digested }
    g = createInitialState()
  }

  /* Healing (all conditions must hold) */
  if (
    g.health < g.healthcap &&
    g.energy > HEAL_MIN_ENERGY &&
    g.hydration > HEAL_MIN_HYDRATION &&
    g.temp < HEAL_TEMP_MAX &&
    g.temp > HEAL_TEMP_MIN &&
    g.stamina >= g.staminacap
  ) {
    g.health *= HEAL_HEALTH_GAIN
    g.healthcap -= HEAL_HEALTHCAP_LOSS
    g.energy -= HEAL_ENERGY_COST
    g.hydration -= HEAL_HYDRATION_COST
  }

  /* Character's thoughts */
  const thought = think(g, rp)

  return { state: g, thought, death }
}
