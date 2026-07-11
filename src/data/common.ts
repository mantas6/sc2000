import type { Tab } from '../game/types'

/**
 * Common Actions tab (`#common` in index.jade).
 *
 * The original also held the `#reset` "Suicide" button here, but that is a
 * special control wired to the `RESET` action in the store — not a
 * cost/effect `.consumable` — so it is not modelled as an `Item`.
 *
 * "Participate in human experiment" carried a `.hide` class in the markup but
 * a positive `money="50"` (income). Per the locked engine `isVisible` rules
 * (step 3), income/free items are always visible; the legacy `.hide` had no
 * reveal path for positive-cost items, so it is treated as visible here.
 */
export const common: Tab = {
  id: 'common',
  label: 'Common Actions',
  icon: 'Home',
  items: [
    {
      id: 'human-experiment',
      label: 'Participate in human experiment',
      title: 'Can be dangerous',
      cost: 50,
      effects: { hydration: -50, energy: -50, stomachcap: -50, healthcap: -10 },
      icon: 'Brain',
    },
  ],
}
