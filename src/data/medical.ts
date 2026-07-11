import type { Tab } from '../game/types'

/**
 * Medical Services tab (`#medical` in index.jade). Tab entry fee
 * `money="-2000"` → `unlockCost: 2000`. Safer, expensive fixes: health
 * restore, stomach clearing/enlarging, slower health-cap loss.
 */
export const medical: Tab = {
  id: 'medical',
  label: 'Medical Services(safe)',
  unlockCost: 2000,
  icon: 'Cross',
  items: [
    {
      id: 'fresh-bloodbag',
      label: 'Fresh Bloodbag',
      title: 'Restores health',
      cost: -2000,
      effects: { health: 440 },
      icon: 'Heart',
    },
    {
      id: 'stomach-content-removal',
      label: 'Stomach Content Removal',
      title: 'Removes stomach content',
      cost: -5000,
      effects: { health: -5, healthcap: -0.1, stomach: -500 },
      icon: 'Stomach',
    },
    {
      id: 'food-water-auto-injector',
      label: 'Food/Water Auto Injector',
      title: 'Inject needed stuff straight into the blood (-20$/s)',
      cost: -10000,
      effects: {
        healthcap: -0.5,
        hydrationin: 1,
        energyin: 1,
        staminacapin: -0.05,
        moneyincome: -20,
      },
      icon: 'Syringe',
    },
    {
      id: 'organ-transplant',
      label: 'Organ Transplant',
      title: 'Reduces maximum health decrease over time',
      cost: -50000,
      effects: { healthcaploss: -1 },
      icon: 'Cross',
    },
    {
      id: 'stomach-enlargement-op',
      label: 'Stomach Enlargement Op',
      title: 'Makes stomach larger',
      cost: -70000,
      effects: { healthcap: -5, stomachcap: 50, digestionmulti: -0.01 },
      icon: 'Stomach',
    },
  ],
}
