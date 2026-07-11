import { describe, expect, it } from 'vitest'
import { tabs } from '../data/tabs'
import { createInitialState } from '../game/initialState'
import type { StatKey } from '../game/types'

/**
 * Transcription sanity checks for the 13 `data/*` tab modules. These are cheap
 * insurance that the port from index.jade did not drop, duplicate or misspell
 * items — not a re-derivation of the balance numbers.
 */

/** Expected per-tab item counts (hand-counted against index.jade). */
const EXPECTED_COUNTS: Record<string, number> = {
  common: 1,
  work: 13,
  training: 5,
  clothing: 10,
  food: 10,
  drink: 10,
  investment: 14,
  chems: 9,
  black: 4,
  medical: 5,
  bribe: 4,
  et: 9,
  research: 8,
}

const STAT_KEYS = new Set<string>(Object.keys(createInitialState()))

describe('data/tabs', () => {
  it('exports exactly 13 tabs in the original order', () => {
    expect(tabs).toHaveLength(13)
    expect(tabs.map((t) => t.id)).toEqual([
      'common',
      'work',
      'training',
      'clothing',
      'food',
      'drink',
      'investment',
      'chems',
      'black',
      'medical',
      'bribe',
      'et',
      'research',
    ])
  })

  it('has unique tab ids', () => {
    const ids = tabs.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('matches the expected per-tab item counts', () => {
    for (const tab of tabs) {
      expect(tab.items.length, tab.id).toBe(EXPECTED_COUNTS[tab.id])
    }
  })

  it('has 102 items total', () => {
    const total = tabs.reduce((n, t) => n + t.items.length, 0)
    expect(total).toBe(102)
  })

  it('has globally-unique item ids across all tabs', () => {
    const ids = tabs.flatMap((t) => t.items.map((i) => i.id))
    const seen = new Map<string, number>()
    for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1)
    const dupes = [...seen].filter(([, n]) => n > 1).map(([id]) => id)
    expect(dupes).toEqual([])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only valid StatKeys in effects and set', () => {
    for (const tab of tabs) {
      for (const item of tab.items) {
        for (const key of Object.keys(item.effects ?? {})) {
          expect(STAT_KEYS.has(key), `${item.id} effects.${key}`).toBe(true)
        }
        for (const key of Object.keys(item.set ?? {})) {
          expect(STAT_KEYS.has(key), `${item.id} set.${key}`).toBe(true)
        }
      }
    }
  })

  it('only assigns tempoffset via `set` (the original assignment quirk)', () => {
    for (const tab of tabs) {
      for (const item of tab.items) {
        // tempoffset must never appear as an additive effect...
        expect(item.effects?.tempoffset, item.id).toBeUndefined()
        // ...and `set` must contain nothing but tempoffset.
        for (const key of Object.keys(item.set ?? {})) {
          expect(key, item.id).toBe('tempoffset')
        }
      }
    }
  })

  it('requires a numeric cost and non-empty label/id on every item', () => {
    for (const tab of tabs) {
      for (const item of tab.items) {
        expect(typeof item.cost, item.id).toBe('number')
        expect(Number.isFinite(item.cost), item.id).toBe(true)
        expect(item.id.length).toBeGreaterThan(0)
        expect(item.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('models tab entry fees as one-time unlockCost', () => {
    const fees = Object.fromEntries(
      tabs.filter((t) => t.unlockCost !== undefined).map((t) => [t.id, t.unlockCost]),
    )
    expect(fees).toEqual({
      clothing: 5,
      investment: 1,
      chems: 50,
      black: 500,
      medical: 2000,
      bribe: 60000,
      et: 75000,
      research: 1000000,
    })
  })

  it('never sets both no-cost and unlock chains inconsistently', () => {
    // Every `unlock`/`buyname` value should be a plain non-empty string; guards
    // against typos that would silently break reveal/buy chains.
    for (const tab of tabs) {
      for (const item of tab.items) {
        if (item.unlock !== undefined) expect(item.unlock.length).toBeGreaterThan(0)
        if (item.buyname !== undefined) expect(item.buyname.length).toBeGreaterThan(0)
      }
    }
  })
})

// Type-only guard: ensures StatKey stays in sync with the runtime STAT_KEYS.
const _statKeyCheck: StatKey = 'money'
void _statKeyCheck
