import type { Tab } from '../game/types'

/**
 * Bribe Gov tab (`#bribe` in index.jade). Tab entry fee `money="-60000"` →
 * `unlockCost: 60000`.
 *
 * Each button *adds* to `taxes` (the income multiplier); despite the "less
 * taxes" labels, the original attribute is a positive additive delta, kept
 * verbatim here.
 */
export const bribe: Tab = {
  id: 'bribe',
  label: 'Bribe Gov',
  unlockCost: 60000,
  icon: 'Landmark',
  items: [
    {
      id: 'bribe-0-01-percent',
      label: 'Bribe for 0.01% less taxes',
      cost: -70000,
      effects: { taxes: 0.0001 },
      icon: 'Percent',
    },
    {
      id: 'bribe-0-1-percent',
      label: 'Bribe for 0.1% less taxes',
      cost: -700000,
      effects: { taxes: 0.001 },
      icon: 'Percent',
    },
    {
      id: 'bribe-1-percent',
      label: 'Bribe for 1% less taxes',
      cost: -7000000,
      effects: { taxes: 0.01 },
      icon: 'Percent',
    },
    {
      id: 'bribe-10-percent',
      label: 'Bribe for 10% less taxes',
      cost: -70000000,
      effects: { taxes: 0.1 },
      icon: 'Percent',
    },
  ],
}
