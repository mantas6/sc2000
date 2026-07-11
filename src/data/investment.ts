import type { Tab } from '../game/types'

/**
 * Investment tab (`#investment` in index.jade). Tab entry fee `money="-1"` →
 * `unlockCost: 1`.
 *
 * Every button is labelled "Invest" in the original; ids are suffixed by the
 * income tier to keep them unique. Each adds a flat `moneyincome`.
 */
export const investment: Tab = {
  id: 'investment',
  label: 'Investment',
  unlockCost: 1,
  icon: 'Chart',
  items: [
    { id: 'invest-0-01', label: 'Invest', title: 'Get 0.01$ per second', cost: -1, effects: { moneyincome: 0.01 }, icon: 'Income' },
    { id: 'invest-0-1', label: 'Invest', title: 'Get 0.1$ per second', cost: -10, effects: { moneyincome: 0.1 }, icon: 'Income' },
    { id: 'invest-1', label: 'Invest', title: 'Get 1$ per second', cost: -100, effects: { moneyincome: 1 }, icon: 'Income' },
    { id: 'invest-10', label: 'Invest', title: 'Get 10$ per second', cost: -1000, effects: { moneyincome: 10 }, icon: 'Income' },
    { id: 'invest-100', label: 'Invest', title: 'Get 100$ per second', cost: -10000, effects: { moneyincome: 100 }, icon: 'Income' },
    { id: 'invest-1k', label: 'Invest', title: 'Get 1k$ per second', cost: -100000, effects: { moneyincome: 1000 }, icon: 'Income' },
    { id: 'invest-10k', label: 'Invest', title: 'Get 10k$ per second', cost: -1000000, effects: { moneyincome: 10000 }, icon: 'Income' },
    { id: 'invest-100k', label: 'Invest', title: 'Get 100k$ per second', cost: -10000000, effects: { moneyincome: 100000 }, icon: 'Income' },
    { id: 'invest-1m', label: 'Invest', title: 'Get 1M$ per second', cost: -100000000, effects: { moneyincome: 1000000 }, icon: 'Income' },
    { id: 'invest-10m', label: 'Invest', title: 'Get 10M$ per second', cost: -1000000000, effects: { moneyincome: 10000000 }, icon: 'Income' },
    { id: 'invest-100m', label: 'Invest', title: 'Get 100M$ per second', cost: -10000000000, effects: { moneyincome: 100000000 }, icon: 'Income' },
    { id: 'invest-1b', label: 'Invest', title: 'Get 1b$ per second', cost: -100000000000, effects: { moneyincome: 1000000000 }, icon: 'Income' },
    { id: 'invest-10b', label: 'Invest', title: 'Get 10b$ per second', cost: -1000000000000, effects: { moneyincome: 10000000000 }, icon: 'Income' },
    { id: 'invest-100b', label: 'Invest', title: 'Get 100b$ per second', cost: -10000000000000, effects: { moneyincome: 100000000000 }, icon: 'Income' },
  ],
}
