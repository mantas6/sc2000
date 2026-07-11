/**
 * UI glyphs — original handcrafted geometry for interface affordances.
 *
 * Lock (locked tab), Ban (unaffordable/blocked), ArrowUp / ArrowDown (effect
 * deltas) and Brain (thoughts / the human-experiment item).
 */

import { Icon, type IconProps } from './Icon'

/** Lock — a padlock with a raised shackle. */
export function Lock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10 V7 A4 4 0 0 1 16 7 V10" />
      <path d="M12 14 V17" />
    </Icon>
  )
}

/** Ban — a circle with a slash (forbidden / unaffordable). */
export function Ban(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6 L18.4 18.4" />
    </Icon>
  )
}

/** ArrowUp — an upward delta arrow. */
export function ArrowUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20 V4" />
      <path d="M6 10 L12 4 L18 10" />
    </Icon>
  )
}

/** ArrowDown — a downward delta arrow. */
export function ArrowDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4 V20" />
      <path d="M6 14 L12 20 L18 14" />
    </Icon>
  )
}

/** Brain — two lobes with a central sulcus. */
export function Brain(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5 A3.5 3.5 0 0 0 6 6 A3 3 0 0 0 4.5 11 A3 3 0 0 0 6 16 A3 3 0 0 0 10.5 18.5 A2.5 2.5 0 0 0 12 19 Z" />
      <path d="M12 5 A3.5 3.5 0 0 1 18 6 A3 3 0 0 1 19.5 11 A3 3 0 0 1 18 16 A3 3 0 0 1 13.5 18.5 A2.5 2.5 0 0 1 12 19 Z" />
      <path d="M12 5 V19" />
    </Icon>
  )
}

/** Gear — a cog with a hub, for the settings control. */
export function Gear(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5 V5 M12 19 V21.5 M4.2 4.2 L6 6 M18 18 L19.8 19.8 M2.5 12 H5 M19 12 H21.5 M4.2 19.8 L6 18 M18 6 L19.8 4.2" />
    </Icon>
  )
}
