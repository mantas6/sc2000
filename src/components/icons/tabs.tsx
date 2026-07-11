/**
 * Tab glyphs — original handcrafted geometry, one per category tab.
 *
 * Home, Briefcase, Dumbbell, Shirt, Utensils, Cup, Chart, Flask, Syringe,
 * Cross, Landmark, Rocket, Microscope.
 */

import { Icon, type IconProps } from './Icon'

/** Common Actions — a house. */
export function Home(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11 L12 3 L21 11" />
      <path d="M5 9 V20 H19 V9" />
      <path d="M10 20 V13 H14 V20" />
    </Icon>
  )
}

/** Work — a briefcase. */
export function Briefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8 V6 A2 2 0 0 1 10 4 H14 A2 2 0 0 1 16 6 V8" />
      <path d="M3 13 H21" />
    </Icon>
  )
}

/** Training — a dumbbell. */
export function Dumbbell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8 V16" />
      <path d="M7 5 V19" />
      <path d="M7 12 H17" />
      <path d="M17 5 V19" />
      <path d="M20 8 V16" />
    </Icon>
  )
}

/** Clothing — a t-shirt. */
export function Shirt(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3 L4 6 L6 10 L8 9 V20 H16 V9 L18 10 L20 6 L15 3 A3 3 0 0 1 9 3 Z" />
    </Icon>
  )
}

/** Food — a fork and knife. */
export function Utensils(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3 V8 A2 2 0 0 0 10 8 V3" />
      <path d="M8 8 V21" />
      <path d="M16 3 C14 5 14 9 16 11 V21" />
    </Icon>
  )
}

/** Drink — a cup with a handle. */
export function Cup(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7 H17 L16 19 A2 2 0 0 1 14 21 H8 A2 2 0 0 1 6 19 Z" />
      <path d="M17 9 H19 A2 2 0 0 1 21 11 V12 A2 2 0 0 1 19 14 H16.5" />
    </Icon>
  )
}

/** Investment — a bar chart. */
export function Chart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 3 V20 H21" />
      <path d="M8 20 V13" />
      <path d="M13 20 V8" />
      <path d="M18 20 V11" />
    </Icon>
  )
}

/** Chems — an Erlenmeyer flask. */
export function Flask(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3 H15" />
      <path d="M10 3 V9 L5 18 A1.5 1.5 0 0 0 6.4 20.2 H17.6 A1.5 1.5 0 0 0 19 18 L14 9 V3" />
      <path d="M7.5 14 H16.5" />
    </Icon>
  )
}

/** Black Market — a syringe. */
export function Syringe(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 3 L21 10" />
      <path d="M17.5 6.5 L9 15 L5 19 L4 20 L5 19 Z" />
      <path d="M11 12 L14 15" />
      <path d="M4 20 L2 22" />
    </Icon>
  )
}

/** Medical — a medical cross. */
export function Cross(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z" />
    </Icon>
  )
}

/** Bribe Gov — a classical government building. */
export function Landmark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9 L12 3 L20 9 Z" />
      <path d="M6 9 V18 M10 9 V18 M14 9 V18 M18 9 V18" />
      <path d="M3 21 H21" />
      <path d="M4 18 H20" />
    </Icon>
  )
}

/** ET Technology — a rocket. */
export function Rocket(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 C15 5 16.5 9 16.5 13 L12 16 L7.5 13 C7.5 9 9 5 12 2 Z" />
      <path d="M7.5 13 L4 16 V20 L8 18" />
      <path d="M16.5 13 L20 16 V20 L16 18" />
      <circle cx="12" cy="10" r="1.6" />
    </Icon>
  )
}

/** Research — a microscope. */
export function Microscope(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 21 H19" />
      <path d="M9 21 A6 6 0 0 0 17 12" />
      <path d="M9 4 L12 3 L14 7 L11 8 Z" />
      <path d="M11 8 L14 13" />
      <path d="M8 8 H12" />
    </Icon>
  )
}
