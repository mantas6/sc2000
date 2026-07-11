/**
 * Icon registry: maps the string keys used throughout the app to concrete
 * glyph components from `components/icons`.
 *
 * Three lookups are exposed:
 *  - {@link iconByName} — the raw data `icon` strings (as authored in the tab
 *    modules and used for both tab and item glyphs).
 *  - {@link statIcon} — the six body-status {@link StatKey}s shown as bars.
 *  - {@link roleIcon} — semantic HUD/UI roles (money, income, pause, …).
 *
 * Keeping the mapping here means the data modules and components refer to icons
 * by stable string keys and never import glyph components directly.
 */

import {
  ArrowDown,
  ArrowUp,
  Ban,
  Brain,
  Briefcase,
  Chart,
  Clock,
  Coins,
  Cross,
  Cup,
  Digested,
  Droplet,
  Dumbbell,
  Energy,
  Flask,
  Heart,
  Home,
  Income,
  Landmark,
  Lock,
  Microscope,
  Pause,
  Percent,
  Play,
  Reset,
  Rocket,
  Shirt,
  Skull,
  Stamina,
  Stomach,
  Syringe,
  Thermometer,
  Utensils,
  type IconComponent,
} from '../components/icons'
import type { StatKey } from '../game/types'

/**
 * All glyphs keyed by their component name — this is exactly the set of strings
 * used by the `icon` field in the data modules, so item/tab icons resolve
 * directly through this map.
 */
export const iconByName: Record<string, IconComponent> = {
  // Stats
  Heart,
  Stamina,
  Stomach,
  Energy,
  Droplet,
  Thermometer,
  // HUD
  Coins,
  Income,
  Percent,
  Clock,
  Digested,
  Pause,
  Play,
  Skull,
  Reset,
  // Tabs
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
  // UI
  Lock,
  Ban,
  ArrowUp,
  ArrowDown,
  Brain,
}

/** Resolve a data `icon` string to a glyph, or `undefined` if unknown. */
export function getIcon(name: string | undefined): IconComponent | undefined {
  return name ? iconByName[name] : undefined
}

/** The six body-status stats rendered as bars, each with its glyph. */
export const statIcon: Partial<Record<StatKey, IconComponent>> = {
  health: Heart,
  stamina: Stamina,
  stomach: Stomach,
  energy: Energy,
  hydration: Droplet,
  temp: Thermometer,
}

/** Semantic HUD / UI roles → glyph. */
export const roleIcon = {
  money: Coins,
  income: Income,
  taxes: Percent,
  time: Clock,
  digested: Digested,
  pause: Pause,
  play: Play,
  reset: Skull,
  lock: Lock,
  ban: Ban,
  up: ArrowUp,
  down: ArrowDown,
  brain: Brain,
} satisfies Record<string, IconComponent>
