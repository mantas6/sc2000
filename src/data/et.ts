import type { Tab } from '../game/types'

/**
 * ET Technology tab (`#et` in index.jade). Tab entry fee `money="-75000"` →
 * `unlockCost: 75000`. Advanced stomach ops, digestion tuning and large
 * one-shot / auto-inject resource boosts.
 */
export const et: Tab = {
  id: 'et',
  label: 'ET Technology',
  unlockCost: 75000,
  icon: 'Rocket',
  items: [
    {
      id: 'stomach-content-removal-advanced',
      label: 'Stomach Content Removal',
      title: 'Removes stomach content with advanced tech',
      cost: -75000,
      effects: { health: -5, healthcap: -0.01, stomach: -750, staminacap: -0.01 },
      icon: 'Stomach',
    },
    {
      id: 'stomach-enlargement-op-advanced',
      label: 'Stomach Enlargement Op Advanced',
      title: 'Makes stomach larger',
      cost: -85000,
      effects: { healthcap: -0.2, stomachcap: 95, digestionmulti: -0.007 },
      icon: 'Stomach',
    },
    {
      id: 'muscle-upgrade',
      label: 'Muscle Upgrade',
      title: 'Improves stamina with little effort',
      cost: -90000,
      effects: {
        health: -1,
        healthcap: -0.5,
        healthcaploss: 0.0005,
        staminacap: 0.4,
        staminaregen: 0.001,
      },
      icon: 'Stamina',
    },
    {
      id: 'pro-digestion-pills',
      label: 'Pro Digestion Pills',
      title: 'Improves stomach digestion speed',
      cost: -95000,
      effects: { health: -3, healthcap: -3, digestionmulti: 0.05, stomachcapin: -0.01 },
      icon: 'Digested',
    },
    {
      id: 'pro-digestion-slow-pills',
      label: 'Pro Digestion Slow Pills',
      title: 'Decreases stomach digestion speed (only use if needed)',
      cost: -99000,
      effects: { health: -7, healthcap: -9, digestionmulti: -0.05, stomachcapin: -0.01 },
      icon: 'Digested',
    },
    {
      id: 'hydro-injection',
      label: 'Hydro-Injection',
      title: 'Injects 1500 water into the body',
      cost: -100000,
      effects: { hydration: 1500, healthcap: -0.01 },
      icon: 'Droplet',
    },
    {
      id: 'energy-injection',
      label: 'Energy-Injection',
      title: 'Injects 1000 energy into the body',
      cost: -100000,
      effects: { energy: 1000, healthcap: -0.01 },
      icon: 'Energy',
    },
    {
      id: 'hydro-injection-auto-injector',
      label: 'Hydro-Injection Auto Injector',
      title: 'Auto injects water into the body (-500$/s)',
      cost: -500000,
      effects: { hydrationin: 2, healthcap: -0.4, staminacapin: -0.02, moneyincome: -500 },
      icon: 'Droplet',
    },
    {
      id: 'energy-injection-auto-injector',
      label: 'Energy-Injection Auto Injector',
      title: 'Auto injects energy/food into the body (-500$/s)',
      cost: -500000,
      effects: { energyin: 2, healthcap: -0.4, staminacapin: -0.02, moneyincome: -500 },
      icon: 'Energy',
    },
  ],
}
