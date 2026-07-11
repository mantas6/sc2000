/**
 * Shared SVG icon primitive for the handcrafted glyph set.
 *
 * Every glyph in this folder renders its geometry inside this wrapper, so they
 * share one consistent look per TODO.md: a `0 0 24 24` viewBox, `currentColor`
 * strokes (icons inherit text colour), 2px round-joined strokes, no fill.
 *
 * Glyphs pass their paths/shapes as `children`; callers style via `className`,
 * `size`, `color`, or an accessible `title`.
 */

import type { ReactNode, SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Square edge length in px (defaults to 24). */
  size?: number | string
  /** Accessible label; when set the icon becomes `role="img"`, else hidden. */
  title?: string
}

/** A concrete glyph component (all exported glyphs share this signature). */
export type IconComponent = (props: IconProps) => ReactNode

/** Wrapper that applies the shared icon geometry/styling to its children. */
export function Icon({
  size = 24,
  title,
  children,
  ...rest
}: IconProps & { children: ReactNode }): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}
