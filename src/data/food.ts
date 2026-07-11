import type { Tab } from '../game/types'

/**
 * Food tab (`#food` in index.jade). Adds energy + stomach fullness; pricier
 * tiers give more energy per gram of stomach load and less health penalty.
 */
export const food: Tab = {
  id: 'food',
  label: 'Food',
  icon: 'Utensils',
  items: [
    {
      id: 'discarded-food',
      label: 'Discarded Food',
      cost: 0,
      effects: { energy: 1, hydration: -0.1, stomach: 11, health: -0.7 },
      icon: 'Utensils',
    },
    {
      id: 'cheap-food',
      label: 'Cheap Food',
      cost: -3,
      effects: { energy: 4, hydration: 0.05, stomach: 7, health: -0.01 },
      icon: 'Utensils',
    },
    {
      id: 'decent-food',
      label: 'Decent Food',
      cost: -6,
      effects: { energy: 5, hydration: 0.06, stomach: 5, health: -0.005 },
      icon: 'Utensils',
    },
    {
      id: 'food',
      label: 'Food',
      cost: -10,
      effects: { energy: 7, hydration: 0.08, stomach: 5, health: -0.002 },
      icon: 'Utensils',
    },
    {
      id: 'quality-food',
      label: 'Quality Food',
      cost: -20,
      effects: { energy: 8.5, hydration: 0.09, stomach: 4.8, health: -0.001 },
      icon: 'Utensils',
    },
    {
      id: 'home-food',
      label: 'Home Food',
      cost: -50,
      effects: { energy: 9.5, hydration: 0.15, stomach: 4.5, health: -0.0001 },
      icon: 'Utensils',
    },
    {
      id: 'pro-engineered-food',
      label: 'Pro Engineered Food',
      cost: -150,
      effects: { energy: 10.5, hydration: 0.25, stomach: 3.5, health: -0.00001 },
      icon: 'Utensils',
    },
    {
      id: 'pro-engineered-food-space',
      label: 'Pro Engineered Food From Space',
      cost: -1000,
      effects: { energy: 11.5, hydration: 0.35, stomach: 3.25, health: -0.000001 },
      icon: 'Utensils',
    },
    {
      id: 'pro-engineered-food-ets',
      label: 'Pro Engineered Food From ETs',
      cost: -10000,
      effects: { energy: 12.5, hydration: 0.45, stomach: 3, health: -0.0000001 },
      icon: 'Utensils',
    },
    {
      id: 'pro-engineered-food-ets-galaxy',
      label: 'Pro Engineered Food From ETs (Other Galaxy)',
      cost: -100000,
      effects: { energy: 13.5, hydration: 0.48, stomach: 2.9, health: -0.00000001 },
      icon: 'Utensils',
    },
  ],
}
