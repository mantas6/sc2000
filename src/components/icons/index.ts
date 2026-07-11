/**
 * Barrel for the handcrafted icon set: the shared `<Icon>` primitive plus every
 * glyph, grouped by role (stats / HUD / tabs / UI). Consumers import glyphs by
 * name from here; `src/ui/icons.ts` maps stat keys / roles / data icon strings
 * to these components.
 */

export { Icon } from './Icon'
export type { IconComponent, IconProps } from './Icon'

// Stats
export { Heart, Stamina, Stomach, Energy, Droplet, Thermometer } from './stats'

// HUD
export { Coins, Income, Percent, Clock, Digested, Pause, Play, Skull, Reset } from './hud'

// Tabs
export {
  Home,
  Briefcase,
  Dumbbell,
  Shirt,
  Utensils,
  Cup,
  Chart,
  Flask,
  Syringe,
  Cross,
  Landmark,
  Rocket,
  Microscope,
} from './tabs'

// UI
export { Lock, Ban, ArrowUp, ArrowDown, Brain } from './ui'
