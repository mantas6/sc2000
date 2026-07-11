/**
 * Display formatting helpers, ported faithfully from the original script.js.
 *
 * The odd rounding/scaling (e.g. digested dividing by 60) is preserved exactly
 * as it appeared in the legacy code — fidelity is a hard requirement.
 */

import {
  DIGESTED_K_MAX,
  DIGESTED_RAW_MAX,
  MONEY_RAW_MAX,
  TIME_MINUTES_MAX,
  TIME_SECONDS_MAX,
} from './constants'

/** Round to 2 decimal places — `Math.round(x * 100) / 100`. */
function round2(x: number): number {
  return Math.round(x * 100) / 100
}

/**
 * Money formatting — port of `moneyWrite(money)`.
 *
 * Takes the absolute value, then scales into k / M / b / t / Q buckets by
 * powers of ten (10^3, 10^6, 10^9, 10^12, 10^15), each rounded to 2 decimals.
 */
export function formatMoney(money: number): string {
  const value = Math.abs(money)

  if (value < MONEY_RAW_MAX) {
    return String(round2(value))
  } else if (value < Math.pow(10, 6)) {
    return round2(value / Math.pow(10, 3)) + 'k'
  } else if (value < Math.pow(10, 9)) {
    return round2(value / Math.pow(10, 6)) + 'M'
  } else if (value < Math.pow(10, 12)) {
    return round2(value / Math.pow(10, 9)) + 'b'
  } else if (value < Math.pow(10, 15)) {
    return round2(value / Math.pow(10, 12)) + 't'
  } else {
    return round2(value / Math.pow(10, 15)) + 'Q'
  }
}

/**
 * Elapsed-time formatting — port of the `timestr` block in `updateText()`.
 *
 * < 120  → whole seconds ("s")
 * < 7200 → whole minutes ("m")
 * else   → whole hours ("h")
 */
export function formatTime(time: number): string {
  if (time < TIME_SECONDS_MAX) {
    return Math.round(time) + 's'
  } else if (time < TIME_MINUTES_MAX) {
    return Math.round(time / 60) + 'm'
  } else {
    return Math.round(time / 60 / 60) + 'h'
  }
}

/**
 * Digested-volume formatting — port of the `digstr` block in `updateText()`,
 * including the trailing "l" suffix added at both display sites.
 *
 * Note: the original divides by 60 (and 60*60) rather than by 1000; this quirk
 * is preserved intentionally.
 *
 * < 1000 → rounded raw
 * < 7200 → value/60 to 2 dp ("k")
 * else   → value/3600 to 3 dp ("M")
 */
export function formatDigested(digested: number): string {
  let digstr: string

  if (digested < DIGESTED_RAW_MAX) {
    digstr = String(Math.round(digested))
  } else if (digested < DIGESTED_K_MAX) {
    digstr = Math.round((digested / 60) * 100) / 100 + 'k'
  } else {
    digstr = Math.round((digested / 60 / 60) * 1000) / 1000 + 'M'
  }

  return digstr + 'l'
}

/**
 * Body-temperature formatting — port of the `#temp` line in `updateText()`.
 * Shows °C to 1 dp and °F (converted) to 1 dp, e.g. "36.6C (97.9F)".
 */
export function formatTemp(temp: number): string {
  const celsius = Math.round(temp * 10) / 10
  const fahrenheit = Math.round(((temp * 9) / 5 + 32) * 10) / 10
  return celsius + 'C (' + fahrenheit + 'F)'
}

/**
 * Tax-relief percentage — port of the `#taxes` line in `updateText()`:
 * `Math.round((1 - game.taxes) * 100 * 1000) / 1000`.
 */
export function formatTaxes(taxes: number): string {
  return String(Math.round((1 - taxes) * 100 * 1000) / 1000)
}
