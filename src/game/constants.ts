/**
 * Constants extracted verbatim from the original script.js tick loop and
 * display code. Grouped by the concern they belong to so the engine (step 3)
 * can reference named values instead of inlining magic numbers.
 *
 * Every value here is traceable to a specific line in the legacy source; none
 * are invented. Comments cite the original expression.
 */

/** Simulation tick / autosave interval — `window.setInterval(..., 1000)`. */
export const TICK_MS = 1000

/** Baseline body temperature (°C) — `game.temp: 36.6` and `temp - 36.6`. */
export const NORMAL_TEMP = 36.6

/* ------------------------------------------------------------------ *
 * Taxes
 * ------------------------------------------------------------------ */

/** Upper clamp: `if (game.taxes > 1) game.taxes = 1`. */
export const TAXES_MAX = 1
/** Decay floor: `else if (game.taxes > 0.01)`. */
export const TAXES_DECAY_FLOOR = 0.01
/** Per-tick decay factor: `game.taxes -= game.taxes * 0.00015`. */
export const TAXES_DECAY_RATE = 0.00015
/** Extra penalty while in debt: `if (game.money < 0) game.taxes -= 0.00003`. */
export const TAXES_DEBT_PENALTY = 0.00003

/* ------------------------------------------------------------------ *
 * Passive per-tick changes
 * ------------------------------------------------------------------ */

/** `game.digestionmulti -= 0.000075`. */
export const DIGESTION_MULTI_DECAY = 0.000075

/* ------------------------------------------------------------------ *
 * Temperature: deadly states (multiplicative penalties)
 * ------------------------------------------------------------------ */

/** `temp >= 42`. */
export const TEMP_LETHAL_HOT = 42
/** `temp >= 40`. */
export const TEMP_DANGER_HOT = 40
/** Cold-danger upper bound: `temp <= 34 && temp >= 32`. */
export const TEMP_DANGER_COLD = 34
/** Cold-danger lower bound / lethal-cold threshold: `temp < 32`. */
export const TEMP_LETHAL_COLD = 32

/** temp >= 42 penalties. */
export const TEMP_LETHAL_HOT_HEALTH = 0.5
export const TEMP_LETHAL_HOT_HYDRATION = 0.5
export const TEMP_LETHAL_HOT_ENERGY = 0.5

/** temp >= 40 penalties. */
export const TEMP_DANGER_HOT_HEALTH = 0.95
export const TEMP_DANGER_HOT_HYDRATION = 0.95
export const TEMP_DANGER_HOT_ENERGY = 0.99

/** 32 <= temp <= 34 penalties. */
export const TEMP_DANGER_COLD_HEALTH = 0.95
export const TEMP_DANGER_COLD_ENERGY = 0.95

/** temp < 32 penalties. */
export const TEMP_LETHAL_COLD_HEALTH = 0.5
export const TEMP_LETHAL_COLD_ENERGY = 0.5

/* ------------------------------------------------------------------ *
 * Temperature: regulation
 * ------------------------------------------------------------------ */

/**
 * Fraction of hydration/energy capacity required for regulation to act:
 * `game.hydration / game.hydrationcap > 0.01` (and energy equivalent).
 */
export const TEMP_REGULATION_RESERVE = 0.01
/** Cost multiplier applied to `gain`: `hydration -= Math.abs(gain * 100)`. */
export const TEMP_REGULATION_COST = 100

/* ------------------------------------------------------------------ *
 * Stamina
 * ------------------------------------------------------------------ */

/** Out-of-stamina drain: `game.energy -= 3`. */
export const STAMINA_EMPTY_ENERGY_COST = 3
/** Out-of-stamina drain: `game.hydration -= 5`. */
export const STAMINA_EMPTY_HYDRATION_COST = 5
/** Out-of-stamina drain: `game.health -= 0.01`. */
export const STAMINA_EMPTY_HEALTH_COST = 0.01
/** Out-of-stamina drain: `game.staminacap -= 1`. */
export const STAMINA_EMPTY_CAP_COST = 1

/** Regen requires `game.energy > 1 && game.hydration > 1`. */
export const STAMINA_REGEN_MIN_ENERGY = 1
export const STAMINA_REGEN_MIN_HYDRATION = 1
/** Regen costs: `game.energy -= 0.5`, `game.hydration -= 0.75`. */
export const STAMINA_REGEN_ENERGY_COST = 0.5
export const STAMINA_REGEN_HYDRATION_COST = 0.75

/** No max stamina left: `if (game.staminacap <= 0) game.health *= 0.99`. */
export const STAMINACAP_DEPLETED_HEALTH = 0.99

/**
 * No max hydration or energy left:
 * `if (game.hydrationcap <= 0 || game.energycap <= 0) game.health *= 0.90`.
 */
export const CAP_DEPLETED_HEALTH = 0.9

/* ------------------------------------------------------------------ *
 * Idle drain
 * ------------------------------------------------------------------ */

/** `if (game.energy > 0) game.energy -= 0.5`. */
export const IDLE_ENERGY_DRAIN = 0.5
/** `if (game.hydration > 0) game.hydration -= 0.75`. */
export const IDLE_HYDRATION_DRAIN = 0.75

/* ------------------------------------------------------------------ *
 * Stomach / digestion
 * ------------------------------------------------------------------ */

/** Empty stomach: `if (game.stomach <= 0) game.health *= 0.95`. */
export const STOMACH_EMPTY_HEALTH = 0.95
/** Destroyed stomach: `if (game.stomachcap <= 0) game.health *= 0.95`. */
export const STOMACHCAP_DESTROYED_HEALTH = 0.95

/** Digestion formula offset: `1 / ((game.stomach + 50) / game.stomachcap)`. */
export const DIGESTION_OFFSET = 50

/** Vomit trigger: `game.stomach > game.stomachcap`. */
export const VOMIT_STOMACH = 0.1
export const VOMIT_ENERGY = 0.1
export const VOMIT_HYDRATION = 0.1
export const VOMIT_HEALTH = 0.8
export const VOMIT_HEALTHCAP_LOSS = 0.01
export const VOMIT_STOMACHCAP = 0.75

/** Stomach capacity self-adjust: threshold `game.stomach / game.stomachcap > 0.5`. */
export const STOMACHCAP_GROW_THRESHOLD = 0.5
/** Grows by 0.1 above the threshold, shrinks by 0.2 below. */
export const STOMACHCAP_GROW_RATE = 0.1
export const STOMACHCAP_SHRINK_RATE = 0.2

/* ------------------------------------------------------------------ *
 * Starvation / dehydration
 * ------------------------------------------------------------------ */

/** `if (game.energy <= 0) game.health *= 0.99`. */
export const STARVATION_HEALTH = 0.99
/** `if (game.hydration <= 0) game.health *= 0.95`. */
export const DEHYDRATION_HEALTH = 0.95

/* ------------------------------------------------------------------ *
 * Death
 * ------------------------------------------------------------------ */

/** Death check: `if (game.health <= 1)`. */
export const DEATH_HEALTH = 1

/* ------------------------------------------------------------------ *
 * Healing (all conditions must hold)
 * ------------------------------------------------------------------ */

/** `game.energy > 1000`. */
export const HEAL_MIN_ENERGY = 1000
/** `game.hydration > 1500`. */
export const HEAL_MIN_HYDRATION = 1500
/** `game.temp < 37.1`. */
export const HEAL_TEMP_MAX = 37.1
/** `game.temp > 35.9`. */
export const HEAL_TEMP_MIN = 35.9
/** `game.health *= 1.005`. */
export const HEAL_HEALTH_GAIN = 1.005
/** `game.healthcap -= 0.001`. */
export const HEAL_HEALTHCAP_LOSS = 0.001
/** `game.energy -= 2`. */
export const HEAL_ENERGY_COST = 2
/** `game.hydration -= 1`. */
export const HEAL_HYDRATION_COST = 1

/* ------------------------------------------------------------------ *
 * Display formatting thresholds (see format.ts)
 * ------------------------------------------------------------------ */

/** Time: seconds below 120, minutes below 7200, else hours. */
export const TIME_SECONDS_MAX = 120
export const TIME_MINUTES_MAX = 7200

/** Digested: raw below 1000, "k" below 7200, else "M". */
export const DIGESTED_RAW_MAX = 1000
export const DIGESTED_K_MAX = 7200

/** Money: raw below 10000, then k / M / b / t / Q by powers of ten. */
export const MONEY_RAW_MAX = 10000
