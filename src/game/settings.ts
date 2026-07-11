/**
 * Player settings persisted outside the game save.
 *
 * Like the onboarding flag, these are UI preferences orthogonal to the
 * `GameState`, so they live under their own versioned localStorage key rather
 * than inside the persisted save. Currently just the offline-progression
 * toggle (on by default). All access is guarded so a disabled/full storage
 * never throws (matching `persistence.ts` / `onboarding.ts`).
 */

/** Versioned key recording that offline progression has been turned off. */
export const OFFLINE_DISABLED_KEY = 'sc2000:offline-disabled:v1'

/** Whether offline progression is enabled (default: on). */
export function isOfflineEnabled(): boolean {
  try {
    return localStorage.getItem(OFFLINE_DISABLED_KEY) !== '1'
  } catch {
    return true
  }
}

/** Persist the offline-progression preference. */
export function setOfflineEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.removeItem(OFFLINE_DISABLED_KEY)
    } else {
      localStorage.setItem(OFFLINE_DISABLED_KEY, '1')
    }
  } catch {
    /* ignore: storage may be full or unavailable */
  }
}
