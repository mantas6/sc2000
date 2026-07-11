import type { Tab } from '../game/types'

/**
 * Training tab (`#training` in index.jade). Spends money + resources to raise
 * stamina cap / regen and digestion capacity.
 */
export const training: Tab = {
  id: 'training',
  label: 'Training',
  icon: 'Dumbbell',
  items: [
    {
      id: 'swim-in-a-pool',
      label: 'Swim in a pool',
      title: 'Improves your maximum stamina also cools you down',
      cost: -7,
      effects: {
        hydration: -1,
        energy: -10,
        stamina: -40,
        staminacap: 0.1,
        staminaregen: 0.00001,
        temp: -0.05,
      },
      icon: 'Stamina',
    },
    {
      id: 'workout-on-strength',
      label: 'Workout on strength',
      title: 'Improves your maximum stamina',
      cost: -4,
      effects: {
        hydration: -7,
        energy: -5,
        stamina: -15,
        staminacap: 0.09,
        staminaregen: 0.00001,
        temp: 0.05,
      },
      icon: 'Stamina',
    },
    {
      id: 'workout-on-breathing',
      label: 'Workout on breathing',
      title: 'Improves your stamina regeneration',
      cost: -4,
      effects: {
        hydration: -7.5,
        energy: -5,
        stamina: -15,
        staminacap: 0.0001,
        staminaregen: 0.001,
        temp: 0.04,
      },
      icon: 'Stamina',
    },
    {
      id: 'stomach-massage',
      label: 'Stomach Massage',
      title: 'Improves digestion speed and capacity',
      cost: -50,
      effects: {
        stamina: -1,
        energy: -1,
        digestionmulti: 0.001,
        stomachcapin: 0.000001,
        stomachcap: 0.001,
        temp: 0.01,
      },
      icon: 'Stomach',
    },
    {
      id: 'stomach-massage-extended',
      label: 'Stomach Massage Extended',
      title: 'Improves digestion speed and capacity',
      cost: -500,
      effects: {
        stamina: -5,
        energy: -10,
        digestionmulti: 0.002,
        stomachcapin: 0.000003,
        stomachcap: 0.01,
        temp: 0.01,
      },
      icon: 'Stomach',
    },
  ],
}
