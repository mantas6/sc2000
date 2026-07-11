/**
 * HUD glyphs — original handcrafted geometry for the header/status controls.
 *
 * Coins, Income (growth arrow), Percent, Clock, Digested (funnel), Pause, Play,
 * Skull (the "suicide"/reset control) and Reset (circular arrow).
 */

import { Icon, type IconProps } from './Icon'

/** Money — a stack of two coins drawn as ellipses. */
export function Coins(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="7" rx="7" ry="3.2" />
      <path d="M5 7 V12 C5 13.8 8.1 15.2 12 15.2 C15.9 15.2 19 13.8 19 12 V7" />
      <path d="M5 12 V17 C5 18.8 8.1 20.2 12 20.2 C15.9 20.2 19 18.8 19 17 V12" />
    </Icon>
  )
}

/** Income — an upward-trending line with an arrowhead (per-second gain). */
export function Income(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 18 L9 12 L13 15 L21 6" />
      <path d="M15 6 H21 V12" />
    </Icon>
  )
}

/** Percent — a slash flanked by two rings (tax relief). */
export function Percent(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 5 L5 19" />
      <circle cx="7.5" cy="7.5" r="2.3" />
      <circle cx="16.5" cy="16.5" r="2.3" />
    </Icon>
  )
}

/** Clock — a ring with hour/minute hands (time alive). */
export function Clock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 V12 L15.5 14" />
    </Icon>
  )
}

/** Digested — a funnel narrowing to a spout (throughput of matter). */
export function Digested(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4 H21 L14 12 V19 L10 21 V12 Z" />
    </Icon>
  )
}

/** Pause — two vertical bars. */
export function Pause(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5 V19" />
      <path d="M15 5 V19" />
    </Icon>
  )
}

/** Play — a right-pointing triangle. */
export function Play(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5 L19 12 L8 19 Z" />
    </Icon>
  )
}

/** Skull — the "Suicide"/reset control glyph. */
export function Skull(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 11 A7 7 0 0 1 19 11 C19 14 17.5 15.5 16 16.5 V19 H8 V16.5 C6.5 15.5 5 14 5 11 Z" />
      <circle cx="9" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M11 19 V16 M13 19 V16" />
    </Icon>
  )
}

/** Reset — a broken circular arrow. */
export function Reset(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12 A8 8 0 1 1 17.5 6.2" />
      <path d="M20 3 V7 H16" />
    </Icon>
  )
}
