/**
 * Stat glyphs — original handcrafted geometry for the six body-status stats.
 *
 * Health → Heart, Stamina → pulse trace, Stomach → organ pouch,
 * Energy → bolt, Hydration → Droplet, Temperature → Thermometer.
 */

import { Icon, type IconProps } from './Icon'

/** Health — a rounded heart built from two arcs meeting at a point. */
export function Heart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20 C12 20 4 14 4 8.5 A4 4 0 0 1 12 6 A4 4 0 0 1 20 8.5 C20 14 12 20 12 20 Z" />
    </Icon>
  )
}

/** Stamina — an endurance pulse / heartbeat trace across the frame. */
export function Stamina(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 12 H6 L8.5 5 L12 19 L15 9 L17 13 H22" />
    </Icon>
  )
}

/** Stomach — a lopsided digestive pouch with a short inlet at the top. */
export function Stomach(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 3 V6" />
      <path d="M11 6 C7 6 5 9 6 12.5 C6.6 15 6 17 8 18.5 C11 21 17 19.5 17 14.5 C17 12.5 19 12.5 18.5 9.5 C18 6.5 14 5.5 12 7" />
    </Icon>
  )
}

/** Energy — a lightning bolt (dietary energy / calories). */
export function Energy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 2 L5 13 H10 L9 22 L19 10 H13 Z" />
    </Icon>
  )
}

/** Hydration — a teardrop of water. */
export function Droplet(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 C12 3 5 11 5 15 A7 7 0 0 0 19 15 C19 11 12 3 12 3 Z" />
    </Icon>
  )
}

/** Temperature — a bulb thermometer with a filled reservoir. */
export function Thermometer(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 A2.5 2.5 0 0 1 14.5 5.5 V13.2 A4 4 0 1 1 9.5 13.2 V5.5 A2.5 2.5 0 0 1 12 3 Z" />
      <circle cx="12" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 8 V15" />
    </Icon>
  )
}
