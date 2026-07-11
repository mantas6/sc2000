import type { Tab } from '../game/types'

/**
 * Black Market Auto Injectors tab (`#black` in index.jade). Tab entry fee
 * `money="-500"` → `unlockCost: 500`. These set passive per-tick `*in` flows
 * (and often a negative `moneyincome` upkeep).
 */
export const black: Tab = {
  id: 'black',
  label: 'Black Market Auto Injectors(deadly)',
  unlockCost: 500,
  icon: 'Syringe',
  items: [
    {
      id: 'stamina-restorer-milk-auto-injector',
      label: 'Stamina Restorer Milk Auto Injector',
      title: 'Autoinjects stamina restorer milk',
      cost: -450,
      effects: {
        stomach: 10,
        stomachcap: -1,
        staminaregen: 20,
        health: -0.5,
        healthcaploss: 0.1,
        staminacap: -0.03,
      },
      icon: 'Stamina',
    },
    {
      id: 'dirty-water-auto-injector',
      label: 'Dirty Water Auto Injector',
      title: 'Inject water straight into the stomach (-5$/s)',
      cost: -500,
      effects: {
        healthcaploss: 0.1,
        stomachin: 7,
        hydrationin: 2,
        staminacapin: -0.1,
        moneyincome: -5,
      },
      icon: 'Droplet',
    },
    {
      id: 'dirty-food-auto-injector',
      label: 'Dirty Food Auto Injector',
      title: 'Inject food straight into the stomach (-10$/s)',
      cost: -500,
      effects: {
        healthcaploss: 0.1,
        stomachin: 7,
        staminacapin: -0.1,
        energyin: 2,
        moneyincome: -10,
      },
      icon: 'Energy',
    },
    {
      id: 'medium-acid-auto-injector',
      label: 'Medium Acid Auto Injector',
      title: 'Inject acid straight into the stomach (-12$/s)',
      cost: -550,
      effects: {
        healthcaploss: 0.2,
        stomachin: -10,
        stomachcapin: -0.01,
        moneyincome: -12,
        tempoffsetp: 0.01,
      },
      icon: 'Stomach',
    },
  ],
}
