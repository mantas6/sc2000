/**
 * Versioned localStorage persistence for the game state.
 *
 * The original autosaved the whole `game` object under a plain key on every
 * tick (`localStorage.setItem(savegamename, JSON.stringify(game))`) and blindly
 * merged whatever it read back. Per the TODO.md cleanup we wrap the payload in
 * a `{ version, savedAt, state }` envelope and guard reads through `migrate()`,
 * which validates the shape and fills any missing fields from a fresh initial
 * state.
 *
 * The `savedAt` epoch-millis timestamp (added in v2) is what powers offline
 * progression: on load we diff it against the wall clock to catch the character
 * up (see `offline.ts`). v1 saves predate the timestamp; they migrate forward
 * with `savedAt` defaulted to "now", so a legacy save simply grants no offline
 * time rather than being discarded.
 */

import { createInitialState } from './initialState'
import type { GameState } from './types'

/** Current save schema version. Bump when the persisted shape changes. */
export const SAVE_VERSION = 2

/** Versioned localStorage key (changing the version rotates the slot). */
export const SAVE_KEY = `sc2000:save:v${SAVE_VERSION}`

/**
 * Older version keys, newest-first, read as a fallback when the current slot is
 * empty so a version bump migrates old data forward instead of discarding it.
 */
const LEGACY_SAVE_KEYS: readonly string[] = ['sc2000:save:v1']

/** On-disk envelope wrapping the raw game state with a schema version. */
interface SavePayload {
  version: number
  /** Epoch millis when the save was written (added in v2; absent in v1). */
  savedAt?: number
  state: GameState
}

/** A validated save: the game state plus the wall-clock time it was written. */
export interface LoadedSave {
  /** The migrated, validated game state. */
  state: GameState
  /** Epoch millis the save was written (used for offline catch-up). */
  savedAt: number
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

/** Layer a validated state onto a fresh base with fresh bookkeeping maps. */
function normalize(state: GameState): GameState {
  return {
    ...createInitialState(),
    ...state,
    unlocked: { ...state.unlocked },
    bought: { ...state.bought },
  }
}

/**
 * Validate + migrate a parsed payload into a {@link LoadedSave}, or `null` if
 * it is unusable. Only known versions (v1, v2) are accepted (a clean slate is
 * safer than a silently corrupt merge); the validated state is layered onto a
 * fresh initial state so any future-added fields get sane defaults.
 *
 * v1 → v2 migration: v1 envelopes have no `savedAt`, so it is defaulted to the
 * current time — a legacy save resumes exactly where it left off, granting no
 * offline progression rather than being thrown away.
 */
export function migrate(parsed: unknown): LoadedSave | null {
  if (typeof parsed !== 'object' || parsed === null) return null
  const payload = parsed as Partial<SavePayload>
  if (payload.version !== 1 && payload.version !== SAVE_VERSION) return null
  if (!isValidState(payload.state)) return null
  const savedAt =
    typeof payload.savedAt === 'number' && Number.isFinite(payload.savedAt)
      ? payload.savedAt
      : Date.now()
  return { state: normalize(payload.state), savedAt }
}

/** Persist the game state, stamping it with the current wall-clock time. */
export function save(state: GameState): void {
  try {
    const payload: SavePayload = { version: SAVE_VERSION, savedAt: Date.now(), state }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore: storage may be full or unavailable */
  }
}

/** Load + validate the saved state (current slot, then legacy), or `null`. */
export function load(): LoadedSave | null {
  try {
    let raw = localStorage.getItem(SAVE_KEY)
    if (raw === null) {
      for (const key of LEGACY_SAVE_KEYS) {
        raw = localStorage.getItem(key)
        if (raw !== null) break
      }
    }
    if (raw === null) return null
    return migrate(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Remove every saved game slot (current + legacy) — used by hard reset. */
export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
    for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key)
  } catch {
    /* ignore: storage may be unavailable */
  }
}

/* ------------------------------------------------------------------ *
 * Portable export / import (Settings → backup & transfer)
 * ------------------------------------------------------------------ */

/** UTF-8-safe base64 encode (handles any code points JSON might contain). */
function encodeBase64(text: string): string {
  return btoa(
    encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  )
}

/** Inverse of {@link encodeBase64}. */
function decodeBase64(b64: string): string {
  return decodeURIComponent(
    Array.from(atob(b64), (ch) => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
  )
}

/**
 * Serialize the current state to an opaque, copy-pasteable string (base64 of
 * the JSON envelope) for manual backup or transfer between browsers.
 */
export function exportSave(state: GameState): string {
  const payload: SavePayload = { version: SAVE_VERSION, savedAt: Date.now(), state }
  return encodeBase64(JSON.stringify(payload))
}

/**
 * Parse + validate an exported blob back into a `GameState`, or `null` if the
 * text is malformed or fails validation. Never throws — the UI surfaces the
 * `null` as an error message.
 */
export function importSave(text: string): GameState | null {
  try {
    const json = decodeBase64(text.trim())
    const loaded = migrate(JSON.parse(json))
    return loaded ? loaded.state : null
  } catch {
    return null
  }
}
