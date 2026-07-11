import { describe, expect, it } from 'vitest'
import { applyItem, canAfford, isVisible, tick } from '../game/engine'
import { createInitialState } from '../game/initialState'
import { think } from '../game/thoughts'
import type { GameState, Item } from '../game/types'

/** Fresh initial state with optional field overrides. */
function base(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides }
}

/** Deterministic RNG that never triggers random thoughts. */
const noRandom = () => 0
/** Run a tick with random thoughts suppressed. */
function step(state: GameState) {
  return tick(state, { randp: noRandom })
}

describe('canAfford', () => {
  it('treats positive cost as income (always affordable)', () => {
    expect(canAfford(base({ money: -1000 }), { id: 'w', label: 'Work', cost: 5 })).toBe(true)
  })

  it('requires money >= abs(cost) for priced items', () => {
    const item: Item = { id: 'p', label: 'Buy', cost: -500 }
    expect(canAfford(base({ money: 500 }), item)).toBe(true)
    expect(canAfford(base({ money: 499.99 }), item)).toBe(false)
  })

  it('makes free items unaffordable while in debt (faithful quirk)', () => {
    const free: Item = { id: 'f', label: 'Free', cost: 0 }
    expect(canAfford(base({ money: 0 }), free)).toBe(true)
    expect(canAfford(base({ money: -1 }), free)).toBe(false)
  })
})

describe('applyItem — cost gating', () => {
  it('returns the same reference (no-op) when unaffordable', () => {
    const s = base({ money: 100 })
    const item: Item = { id: 'p', label: 'Buy', cost: -500 }
    expect(applyItem(s, item)).toBe(s)
  })

  it('applies cost and does not mutate the input', () => {
    const s = base({ money: 1000 })
    const next = applyItem(s, { id: 'p', label: 'Buy', cost: -500 })
    expect(next.money).toBe(500)
    expect(s.money).toBe(1000)
  })

  it('adds positive cost as income', () => {
    const next = applyItem(base({ money: 0 }), { id: 'w', label: 'Work', cost: 5 })
    expect(next.money).toBe(5)
  })

  it('is a no-op while paused', () => {
    const s = base({ money: 1000, pause: true })
    expect(applyItem(s, { id: 'p', label: 'Buy', cost: -500 })).toBe(s)
  })
})

describe('applyItem — add (effects) vs set semantics', () => {
  it('adds effects to existing stat values', () => {
    const s = base({ money: 1000, energy: 250, hydration: 250, stomach: 100, health: 1000 })
    const food: Item = {
      id: 'food',
      label: 'Cheap Food',
      cost: -3,
      effects: { energy: 4, hydration: 0.05, stomach: 7, health: -0.01 },
    }
    const next = applyItem(s, food)
    expect(next.money).toBe(997)
    expect(next.energy).toBe(254)
    expect(next.hydration).toBeCloseTo(250.05, 5)
    expect(next.stomach).toBe(107)
    expect(next.health).toBeCloseTo(999.99, 5)
  })

  it('assigns set values (tempoffset) rather than adding', () => {
    const s = base({ money: 1000, tempoffset: 0.5 })
    const clothes: Item = {
      id: 'loose',
      label: 'Loose Clothes',
      cost: -15,
      set: { tempoffset: -0.01 },
    }
    const next = applyItem(s, clothes)
    expect(next.money).toBe(985)
    expect(next.tempoffset).toBe(-0.01)
  })
})

describe('applyItem — unlock / buy chains', () => {
  const unlockItem: Item = {
    id: 'better-job',
    label: 'Look for a better job',
    cost: -500,
    unlock: 'bricks',
  }

  it('records the bought flag and applies deltas once', () => {
    const s = base({ money: 1000 })
    const next = applyItem(s, unlockItem)
    expect(next.bought.bricks).toBe(true)
    expect(next.money).toBe(500)
    expect(s.bought.bricks).toBeUndefined()
  })

  it('is inert on a second purchase (no further cost)', () => {
    const s = base({ money: 1000 })
    const once = applyItem(s, unlockItem)
    const twice = applyItem(once, unlockItem)
    expect(twice).toBe(once)
    expect(twice.money).toBe(500)
  })

  it('applies effects alongside the unlock flag', () => {
    const s = base({ money: 10_000_000, health: 1000 })
    const chainItem: Item = {
      id: 'conduct',
      label: 'Conduct Experiments On ETs',
      cost: -5_000_000,
      effects: { health: -100, healthcaploss: 0.01 },
      buyname: 'res2',
      unlock: 'res3',
    }
    const next = applyItem(s, chainItem)
    expect(next.bought.res3).toBe(true)
    expect(next.money).toBe(5_000_000)
    expect(next.health).toBe(900)
    expect(next.healthcaploss).toBeCloseTo(0.01, 5)
  })
})

describe('isVisible', () => {
  it('always shows income/free consumables', () => {
    expect(isVisible(base({ money: -100 }), { id: 'f', label: 'Free', cost: 0 })).toBe(true)
    expect(isVisible(base({ money: 0 }), { id: 'w', label: 'Work', cost: 5 })).toBe(true)
  })

  it('reveals priced consumables when first affordable, else via unlocked flag', () => {
    const item: Item = { id: 'p', label: 'Buy', cost: -500 }
    expect(isVisible(base({ money: 100 }), item)).toBe(false)
    expect(isVisible(base({ money: 500 }), item)).toBe(true)
    expect(isVisible(base({ money: 0, unlocked: { p: true } }), item)).toBe(true)
  })

  it('hides unlock-purchase buttons once used', () => {
    const item: Item = { id: 'u', label: 'Unlock', cost: -500, unlock: 'bricks' }
    expect(isVisible(base({ money: 1000 }), item)).toBe(true)
    expect(isVisible(base({ money: 1000, bought: { bricks: true } }), item)).toBe(false)
  })

  it('shows buyables only once their buy-chain flag is set', () => {
    const item: Item = { id: 'b', label: 'Carry Bricks', cost: 10, buyname: 'bricks' }
    expect(isVisible(base(), item)).toBe(false)
    expect(isVisible(base({ bought: { bricks: true } }), item)).toBe(true)
  })
})

describe('tick — basic passive step from the initial state', () => {
  const { state, thought, death } = step(createInitialState())

  it('advances time and decays taxes / digestion multiplier', () => {
    expect(state.time).toBe(1)
    expect(state.taxes).toBeCloseTo(0.39994, 6)
    expect(state.digestionmulti).toBeCloseTo(0.999925, 8)
  })

  it('applies idle energy/hydration drain', () => {
    expect(state.energy).toBeCloseTo(249.5, 6)
    expect(state.hydration).toBeCloseTo(249.25, 6)
  })

  it('digests from the stomach into the digested total', () => {
    // digest = 1 / ((100 + 50) / 500) * 0.999925 = 3.3330833...
    expect(state.digested).toBeCloseTo(3.3330833, 6)
    expect(state.stomach).toBeCloseTo(96.6669166, 6)
  })

  it('shrinks stomach capacity below the 50% threshold', () => {
    expect(state.stomachcap).toBeCloseTo(499.8, 6)
  })

  it('clamps health at the cap and emits no thought/death', () => {
    expect(state.health).toBe(1000)
    expect(thought).toBeNull()
    expect(death).toBeNull()
  })

  it('does not mutate the input state', () => {
    const input = createInitialState()
    step(input)
    expect(input.time).toBe(0)
    expect(input.stomach).toBe(100)
  })
})

describe('tick — pause', () => {
  it('is a no-op and returns the same reference', () => {
    const s = base({ pause: true })
    const result = tick(s)
    expect(result.state).toBe(s)
    expect(result.thought).toBeNull()
    expect(result.death).toBeNull()
  })
})

describe('tick — temperature deadly state (heat)', () => {
  const { state } = step(base({ temp: 42 }))

  it('halves health, hydration and energy at >= 42C', () => {
    // health 1000*0.5 = 500 (then idle/others don't touch health)
    expect(state.health).toBe(500)
    // hydration 250*0.5 = 125, minus regulation cost 5.4, minus idle 0.75
    expect(state.hydration).toBeCloseTo(118.85, 6)
    // energy 250*0.5 = 125, minus idle 0.5
    expect(state.energy).toBeCloseTo(124.5, 6)
  })

  it('regulates temperature back toward normal', () => {
    // 42 + (-(42-36.6)*0.01) = 42 - 0.054
    expect(state.temp).toBeCloseTo(41.946, 6)
  })
})

describe('tick — starvation and dehydration stack', () => {
  it('applies *0.99 then *0.95 to health when both empty', () => {
    const { state } = step(base({ energy: 0, hydration: 0 }))
    // 1000 * 0.99 * 0.95 = 940.5
    expect(state.health).toBeCloseTo(940.5, 6)
  })
})

describe('tick — out-of-stamina drain and regen', () => {
  const { state } = step(base({ stamina: 0, staminacap: 200 }))

  it('drains resources and shrinks stamina cap when empty', () => {
    // energy: 250 -3 (empty) -0.5 (regen) -0.5 (idle) = 246
    expect(state.energy).toBeCloseTo(246, 6)
    // hydration: 250 -5 (empty) -0.75 (regen) -0.75 (idle) = 243.5
    expect(state.hydration).toBeCloseTo(243.5, 6)
    // health: 1000 - 0.01 (empty stamina) = 999.99
    expect(state.health).toBeCloseTo(999.99, 6)
    // staminacap: 200 - 1 = 199
    expect(state.staminacap).toBeCloseTo(199, 6)
  })

  it('regenerates stamina by staminaregen (2)', () => {
    expect(state.stamina).toBeCloseTo(2, 6)
  })
})

describe('tick — vomit', () => {
  const { state } = step(base({ stomach: 600, stomachcap: 500 }))

  it('triggers when stomach exceeds capacity after digestion', () => {
    // health 1000 * 0.8 = 800
    expect(state.health).toBe(800)
    // stomachcap 500 * 0.75 = 375, then -0.2 self-adjust = 374.8
    expect(state.stomachcap).toBeCloseTo(374.8, 6)
    // healthcap 1000 - 0.01
    expect(state.healthcap).toBeCloseTo(999.99, 6)
    // energy (249.5) * 0.1 = 24.95 ; hydration (249.25) * 0.1 = 24.925
    expect(state.energy).toBeCloseTo(24.95, 6)
    expect(state.hydration).toBeCloseTo(24.925, 6)
  })
})

describe('tick — healing', () => {
  const { state } = step(
    base({
      health: 500,
      healthcap: 1000,
      energy: 5000,
      hydration: 2000,
      temp: 36.6,
      stamina: 200,
      staminacap: 200,
    }),
  )

  it('heals when all conditions hold', () => {
    // health 500 * 1.005 = 502.5
    expect(state.health).toBeCloseTo(502.5, 6)
    // healthcap 1000 - 0.001
    expect(state.healthcap).toBeCloseTo(999.999, 6)
    // energy 5000 -0.5 idle -2 heal = 4997.5
    expect(state.energy).toBeCloseTo(4997.5, 6)
    // hydration 2000 -0.75 idle -1 heal = 1998.25
    expect(state.hydration).toBeCloseTo(1998.25, 6)
  })
})

describe('tick — death and reset', () => {
  const result = step(base({ health: 1, energy: 0, hydration: 0 }))

  it('captures survival stats before resetting', () => {
    expect(result.death).not.toBeNull()
    expect(result.death!.time).toBe(1)
    expect(result.death!.digested).toBeCloseTo(3.3330833, 6)
  })

  it('resets to a fresh initial state', () => {
    expect(result.state.health).toBe(1000)
    expect(result.state.time).toBe(0)
    expect(result.state.money).toBe(0)
  })
})

describe('think — thoughts', () => {
  it('returns null when nothing logs (low random rolls)', () => {
    expect(think(createInitialState(), () => 0)).toBeNull()
  })

  it('always reports vomiting when the stomach is essentially full', () => {
    const s = base({ stomach: 500, stomachcap: 500 })
    expect(think(s, () => 0)).toBe("Shit, I'm vomiting!")
  })

  it('emits the snack thought when mildly hungry on a high roll', () => {
    // stomach 75/500 = 0.15 → below the 0.2 "snack" threshold
    const s = base({ stomach: 75, stomachcap: 500 })
    expect(think(s, () => 99)).toBe('I feel like having a snack')
  })
})
