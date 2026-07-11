/**
 * Versioned localStorage persistence for the game state.
 *
 * The original autosaved the whole `game` object under a plain key on every
 * tick (`localStorage.setItem(savegamename, JSON.stringify(game))`) and blindly
 * merged whatever it read back. Per the TODO.md cleanup we wrap the payload in
 * a `{ version, state }` envelope and guard reads through `migrate()`, which
 * validates the shape and fills any missing fields from a fresh initial state.
 */

import { createInitialState } from './initialState'
import type { GameState } from './types'

/** Current save schema version. Bump when the persisted shape changes. */
export const SAVE_VERSION = 1

/** Versioned localStorage key (changing the version rotates the slot). */
export const SAVE_KEY = `sc2000:save:v${SAVE_VERSION}`

/** On-disk envelope wrapping the raw game state with a schema version. */
interface SavePayload {
  version: number
  state: GameState
}

/** Whether a value looks like a valid `GameState` (all fields present + typed). */
function isValidState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  for (const key of Object.keys(createInitialState())) {
    if (key === 'unlocked' || key === 'bought') {
      const map = s[key]
      if (typeof map !== 'object' || map === null) return false
    } else if (key === 'pause') {
      if (typeof s[key] !== 'boolean') return false
    } else if (typeof s[key] !== 'number' || !Number.isFinite(s[key])) {
      return false
    }
  }
  return true
}

/**
 * Validate + migrate a parsed payload into a usable `GameState`, or `null` if
 * it is unusable. Unknown/older versions are rejected (a clean slate is safer
 * than a silently corrupt merge); the validated state is layered onto a fresh
 * initial state so any future-added fields get sane defaults.
 */
export function migrate(parsed: unknown): GameState | null {
  if (typeof parsed !== 'object' || parsed === null) return null
  const payload = parsed as Partial<SavePayload>
  if (payload.version !== SAVE_VERSION) return null
  if (!isValidState(payload.state)) return null
  return {
    ...createInitialState(),
    ...payload.state,
    unlocked: { ...payload.state.unlocked },
    bought: { ...payload.state.bought },
  }
}

/** Persist the game state. Swallows storage errors (quota / unavailable). */
export function save(state: GameState): void {
  try {
    const payload: SavePayload = { version: SAVE_VERSION, state }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore: storage may be full or unavailable */
  }
}

/** Load + validate the saved state, or `null` if absent/invalid. */
export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw === null) return null
    return migrate(JSON.parse(raw))
  } catch {
    return null
  }
}
