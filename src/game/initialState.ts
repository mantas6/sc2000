import type { GameState } from './types'

/**
 * Faithful initial game state, mirroring `init()` in the original script.js.
 *
 * Returned from a factory so each `RESET`/mount gets fresh `unlocked` /
 * `bought` objects rather than sharing a single mutable reference.
 */
export function createInitialState(): GameState {
  return {
    stomach: 100,
    stomachcap: 500,
    stomachcapin: 0,
    stomachin: 0,

    energyin: 0,
    energy: 250,
    energycap: 10000,
    energycapin: 0,

    hydration: 250,
    hydrationin: 0,
    hydrationcap: 2500,
    hydrationcapin: 0,

    health: 1000,
    healthin: 0,
    healthcap: 1000,
    healthcaploss: 0,

    digestionmulti: 1,

    stamina: 200,
    staminacap: 200,
    staminaregen: 2,
    staminacapin: 0,

    temp: 36.6,
    tempoffsetp: 0,
    tempoffset: 0,
    tempgain: 0.01,

    moneyincome: 0,
    money: 0,
    time: 0,
    digested: 0,
    taxes: 0.4,

    unlocked: {},
    bought: {},
    pause: false,
  }
}
