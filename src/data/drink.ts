import type { Tab } from '../game/types'

/**
 * Drink tab (`#drink` in index.jade). Adds hydration + stomach fullness;
 * pricier tiers give more hydration per gram of stomach load and less health
 * penalty.
 */
export const drink: Tab = {
  id: 'drink',
  label: 'Drink',
  icon: 'Cup',
  items: [
    {
      id: 'drain-water',
      label: 'Drain Water',
      cost: 0,
      effects: { hydration: 1, stomach: 9.5, health: -0.5 },
      icon: 'Cup',
    },
    {
      id: 'suspicious-water',
      label: 'Suspicious Water',
      cost: -1,
      effects: { hydration: 5, stomach: 4.5, health: -0.08 },
      icon: 'Cup',
    },
    {
      id: 'energy-drink',
      label: 'Energy Drink',
      cost: -1.25,
      effects: { hydration: 1.5, energy: 2, stomach: 3.5, health: -0.15 },
      icon: 'Cup',
    },
    {
      id: 'water',
      label: 'Water',
      cost: -1.5,
      effects: { hydration: 10, stomach: 3.5, health: -0.01 },
      icon: 'Cup',
    },
    {
      id: 'quality-water',
      label: 'Quality Water',
      cost: -5,
      effects: { hydration: 11, stomach: 3, health: -0.001 },
      icon: 'Cup',
    },
    {
      id: 'premium-water',
      label: 'Premium Water',
      cost: -20,
      effects: { hydration: 12, stomach: 2.5, health: -0.0001 },
      icon: 'Cup',
    },
    {
      id: 'pro-engineered-water',
      label: 'Pro Engineered Water',
      cost: -125,
      effects: { hydration: 13, stomach: 2.25, health: -0.00001 },
      icon: 'Cup',
    },
    {
      id: 'pro-engineered-water-space',
      label: 'Pro Engineered Water From Space',
      cost: -800,
      effects: { hydration: 14, stomach: 2.05, health: -0.000001 },
      icon: 'Cup',
    },
    {
      id: 'pro-engineered-water-ets',
      label: 'Pro Engineered Water From ETs',
      cost: -10000,
      effects: { hydration: 15, stomach: 2, health: -0.0000001 },
      icon: 'Cup',
    },
    {
      id: 'pro-engineered-water-ets-galaxy',
      label: 'Pro Engineered Water From ETs (Other Galaxy)',
      cost: -100000,
      effects: { hydration: 16, stomach: 1.95, health: -0.00000001 },
      icon: 'Cup',
    },
  ],
}
