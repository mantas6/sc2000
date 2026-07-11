import type { Tab } from '../game/types'

/**
 * Clothing tab (`#clothing` in index.jade). Tab entry fee `money="-5"` →
 * `unlockCost: 5`.
 *
 * Every button uses the `tempoffset` attribute, which the original click
 * handler *assigns* rather than adds (`game.tempoffset = value`). It is
 * therefore modelled with `set` (not `effects`), matching the engine.
 */
export const clothing: Tab = {
  id: 'clothing',
  label: 'Clothing',
  unlockCost: 5,
  icon: 'Shirt',
  items: [
    { id: 'normal-clothes', label: 'Normal Clothes', cost: -5, set: { tempoffset: 0 }, icon: 'Shirt' },
    { id: 'loose-clothes', label: 'Loose Clothes', cost: -15, set: { tempoffset: -0.01 }, icon: 'Shirt' },
    { id: 'warm-clothes', label: 'Warm Clothes', cost: -10, set: { tempoffset: 0.01 }, icon: 'Shirt' },
    {
      id: 'quality-warm-clothes',
      label: 'Quality Warm Clothes',
      cost: -50,
      set: { tempoffset: 0.02 },
      icon: 'Shirt',
    },
    {
      id: 'quality-loose-clothes',
      label: 'Quality Loose Clothes',
      cost: -75,
      set: { tempoffset: -0.02 },
      icon: 'Shirt',
    },
    {
      id: 'premium-warm-clothes',
      label: 'Premium Warm Clothes',
      cost: -150,
      set: { tempoffset: 0.03 },
      icon: 'Shirt',
    },
    {
      id: 'premium-loose-clothes',
      label: 'Premium Loose Clothes',
      cost: -150,
      set: { tempoffset: -0.03 },
      icon: 'Shirt',
    },
    { id: 'gillie-suit', label: 'Gillie Suit', cost: -1000, set: { tempoffset: 0.1 }, icon: 'Shirt' },
    { id: 'space-suit', label: 'Space Suit', cost: -1000000, set: { tempoffset: 0.2 }, icon: 'Shirt' },
    {
      id: 'silicone-seal',
      label: 'Silicone Seal',
      cost: -10000000,
      set: { tempoffset: 1 },
      icon: 'Shirt',
    },
  ],
}
