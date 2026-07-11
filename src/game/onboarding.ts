/**
 * First-run onboarding flag.
 *
 * The welcome overlay is meant to appear once, only for a brand-new player, and
 * never again after it is dismissed. That "seen it" bit is orthogonal to the
 * game save, so it lives under its own versioned localStorage key rather than
 * inside the persisted `GameState`. All access is guarded so a disabled/full
 * storage never throws (matching `persistence.ts`).
 */

import { load } from './persistence'

/** Versioned key recording that the welcome overlay has been dismissed. */
export const ONBOARDED_KEY = 'sc2000:onboarded:v1'

/** Whether the welcome overlay has already been dismissed. */
export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch {
    return false
  }
}

/** Record that the welcome overlay has been dismissed (persist the flag). */
export function setOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1')
  } catch {
    /* ignore: storage may be full or unavailable */
  }
}

/**
 * Whether to show the welcome overlay: only for a fresh game (no existing save)
 * that has not already dismissed it. A returning player with a save is never
 * interrupted, even if they predate this flag.
 */
export function shouldShowWelcome(): boolean {
  if (isOnboarded()) return false
  return load() === null
}
