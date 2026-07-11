import type { Tab } from '../game/types'

/**
 * Research tab (`#research` in index.jade). Tab entry fee `money="-1000000"` →
 * `unlockCost: 1000000`.
 *
 * This tab is the original's one genuine progression chain, mixing `.buyable`
 * repeatable actions (revealed by `bought[buyname]`) with `unlock` purchases
 * that advance the chain. Note several buttons carry *both* `buyname` and
 * `unlock`: they are only visible once their `buyname` is bought, and buying
 * them fires the one-time `unlock` step (per the engine's `applyItem`, the
 * `unlock` branch wins and applies cost + effects once). Faithful to the jade
 * ordering.
 */
export const research: Tab = {
  id: 'research',
  label: 'Research',
  unlockCost: 1000000,
  icon: 'Microscope',
  items: [
    {
      id: 'lie-on-experiment-table',
      label: 'Lie on the ET experiment table',
      cost: 500,
      effects: { temp: -0.01, healthcaploss: 0.0001, stamina: -1, staminacap: -0.1 },
      buyname: 'res2',
      icon: 'Microscope',
    },
    {
      id: 'eat-ets-head',
      label: 'Eat ETs head',
      cost: -500000,
      effects: {
        temp: -3,
        stamina: -1,
        healthcap: -0.001,
        staminacap: -0.1,
        energycap: 1,
        hydrationcap: 1,
      },
      buyname: 'res3',
      icon: 'Microscope',
    },
    {
      id: 'kidnap-humans',
      label: 'Kidnap Humans and Conduct Experiments',
      cost: -1000000,
      unlock: 'res1',
      icon: 'Lock',
    },
    {
      id: 'ask-ets-about-results',
      label: 'Ask ETs about Experiment Results',
      cost: -1500000,
      buyname: 'res1',
      unlock: 'res2',
      icon: 'Lock',
    },
    {
      id: 'conduct-experiments-on-ets',
      label: 'Conduct Experiments On ETs',
      title: 'You will loose 100 hp!',
      cost: -5000000,
      effects: { health: -100, healthcaploss: 0.01 },
      buyname: 'res2',
      unlock: 'res3',
      icon: 'Microscope',
    },
    {
      id: 'enslave-one-et-race',
      label: 'Enslave One ET race',
      title: 'You will loose 250 hp!',
      cost: -50000000,
      effects: { health: -250, healthcaploss: 0.01 },
      buyname: 'res3',
      unlock: 'res4',
      icon: 'Microscope',
    },
    {
      id: 'take-over-some-et-tech',
      label: 'Take Over Some ET Tech',
      title: 'You will loose 280 hp!',
      cost: -500000000,
      effects: { health: -280, healthcaploss: 0.01 },
      buyname: 'res4',
      unlock: 'res5',
      icon: 'Rocket',
    },
    {
      id: 'enslave-ets-in-the-galaxy',
      label: 'Enslave ETs in the Galaxy',
      title: 'You will loose 300 hp!',
      cost: -5000000000,
      effects: { health: -300, healthcaploss: 0.01 },
      buyname: 'res5',
      unlock: 'res6',
      icon: 'Rocket',
    },
  ],
}
