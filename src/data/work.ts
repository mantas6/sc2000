import type { Tab } from '../game/types'

/**
 * Work tab (`#work` in index.jade). Jobs earn money (positive `cost`) at the
 * expense of body resources. The lower "unlock" buttons pay a one-time fee
 * (`unlock=`) to reveal the corresponding `.buyable` job (`buyname=`).
 */
export const work: Tab = {
  id: 'work',
  label: 'Work',
  icon: 'Briefcase',
  items: [
    {
      id: 'basic-work',
      label: 'Basic Work',
      title: 'Standard Work',
      cost: 5,
      effects: { hydration: -3, energy: -2, stamina: -5, staminacap: 0.02, temp: 0.05 },
      icon: 'Coins',
    },
    {
      id: 'carry-bricks',
      label: 'Carry Bricks',
      cost: 10,
      effects: { hydration: -4, energy: -2.5, stamina: -6, staminacap: 0.021, temp: 0.06 },
      buyname: 'bricks',
      icon: 'Coins',
    },
    {
      id: 'make-concrete',
      label: 'Make Concrete',
      cost: 15,
      effects: { hydration: -5, energy: -3.5, stamina: -7, staminacap: 0.022, temp: 0.07 },
      buyname: 'equipm',
      icon: 'Coins',
    },
    {
      id: 'program-websites',
      label: 'Program Websites',
      cost: 20,
      effects: { hydration: -1, energy: -2.5, stamina: -0.2, staminacap: -0.005, temp: 0.001 },
      buyname: 'progrm',
      icon: 'Coins',
    },
    {
      id: 'spray-crops',
      label: 'Spray Crops',
      cost: 30,
      effects: {
        hydration: -5.5,
        energy: -4,
        stamina: -6,
        staminacap: -0.004,
        healthcap: -0.0001,
        temp: 0.05,
      },
      buyname: 'sprayc',
      icon: 'Coins',
    },
    {
      id: 'force-religion',
      label: 'Force Religion on People',
      cost: 40,
      effects: { hydration: -2.5, energy: -2, stamina: -3, staminacap: 0.0004, temp: 0.08 },
      buyname: 'relig',
      icon: 'Coins',
    },
    {
      id: 'research-computers',
      label: 'Research Computers',
      cost: 150,
      effects: { hydration: -1.5, energy: -2, stamina: -0.5, staminacap: -0.001, temp: -0.001 },
      buyname: 'pccomp',
      icon: 'Coins',
    },
    {
      id: 'look-for-better-job',
      label: 'Look for a better job',
      cost: -500,
      unlock: 'bricks',
      icon: 'Lock',
    },
    {
      id: 'invest-concrete-mixer',
      label: 'Invest into Concrete Mixer',
      cost: -2000,
      unlock: 'equipm',
      icon: 'Lock',
    },
    {
      id: 'learn-to-program',
      label: 'Learn to Program',
      cost: -5000,
      unlock: 'progrm',
      icon: 'Lock',
    },
    {
      id: 'invest-crop-spray',
      label: 'Invest into Crop Spray Equipment',
      cost: -10000,
      unlock: 'sprayc',
      icon: 'Lock',
    },
    {
      id: 'create-religion',
      label: 'Create a new Religion',
      cost: -2500000,
      unlock: 'relig',
      icon: 'Lock',
    },
    {
      id: 'create-computer-company',
      label: 'Create a big computer company',
      cost: -25000000,
      unlock: 'pccomp',
      icon: 'Lock',
    },
  ],
}
