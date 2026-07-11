/**
 * Dev-only icon gallery for checking visual cohesion of the handcrafted set.
 *
 * Not part of the game UI: `App` renders it only when running under Vite dev
 * (`import.meta.env.DEV`) with `?gallery` in the URL. It renders every glyph at
 * a few sizes against the shared `<Icon>` styling.
 */

import { iconByName } from '../../ui/icons'

export function Gallery() {
  const names = Object.keys(iconByName)
  return (
    <div className="gallery">
      <h1 className="gallery__title">Icon gallery ({names.length})</h1>
      <div className="gallery__grid">
        {names.map((name) => {
          const Glyph = iconByName[name]
          return (
            <figure key={name} className="gallery__cell">
              <div className="gallery__sizes">
                <Glyph size={16} />
                <Glyph size={24} />
                <Glyph size={40} />
              </div>
              <figcaption>{name}</figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
