# sc2000

A modern React + TypeScript remake of the legacy
[survival-clicker](https://github.com/mantas6/survival-clicker) — a browser
incremental game where you keep a character alive by balancing hunger, thirst,
energy, stamina, body temperature and money against constant decay.

**Play:** https://mantas6.github.io/sc2000/

The original was a single-file jQuery + Bootstrap + Pug prototype. This project
reimplements it with a pure, testable game engine and a clean component UI while
keeping the simulation mechanics faithful to the original numbers.

## Tech stack

- React 18
- TypeScript (`strict`)
- Vite 6
- Vitest 3

## Architecture

The code separates the simulation from the UI so the game logic can be unit
tested with no DOM.

- **Pure engine** (`src/game/engine.ts`) — a side-effect-free port of the
  original 1-second tick loop and click handler. `tick`, `applyItem`,
  `canAfford` and `isVisible` take state and return new state; they never mutate
  their inputs or touch the DOM. Every constant lives in
  `src/game/constants.ts`, traceable to a line in the original `script.js`.
- **Typed content data** (`src/data/`) — the 13 category tabs (work, food,
  drink, chems, research, …) authored as typed `Tab` / `Item` modules from the
  original `index.jade` markup. Effect keys are compile-time checked against
  `StatKey`.
- **Reducer store** (`src/store/`) — a `useReducer` + Context store over a
  discriminated `GameAction` union. It delegates all simulation to the engine
  and layers on the bookkeeping the original did in the DOM: the thoughts log,
  reveal-when-first-affordable persistence, one-time tab unlocks and the death
  summary.
- **Canvas character** (`src/game/render/character.ts`,
  `src/components/CharacterCanvas.tsx`) — `deriveAppearance(state)` maps the
  numeric state to normalized visual parameters, and `drawCharacter` renders an
  animated vector figure (pallor, shivering, sweat, posture, belly, collapse on
  death) via `requestAnimationFrame`, independent of the 1s tick.
- **Handcrafted icons** (`src/components/icons/`) — original SVG glyphs on a
  shared `<Icon>` primitive; no icon library.
- **Persistence** (`src/game/persistence.ts`) — versioned `localStorage` slot
  with a `migrate()` guard.

## Faithful mechanics

The engine reproduces the original tick order and arithmetic exactly:

taxes decay → income → time → digestion decay → stomach-cap growth →
temperature regulation (deadly states + hydration/energy cost) → health-cap
loss → stamina drain/regen → cap growth → auto-inject → idle drain →
empty/destroyed-stomach damage → digestion → vomit → clamp → starvation /
dehydration → stomach-cap adjust → death → healing → thoughts.

`src/__tests__/simulation.test.ts` pins this down by running the engine against
an independent line-for-line transcription of the original `script.js` loop for
100 ticks and asserting the two stay bit-for-bit identical. Known original
quirks (e.g. unreachable `else if` thought branches, `tempoffset` being assigned
rather than added, free items being unaffordable while in debt, the `digested`
display dividing by 60) are preserved intentionally.

## Sanctioned cleanups

Behavior-neutral modernizations, kept faithful in feel:

- `tempoffset` modeled as an assignment (`set`) vs additive (`effects`) instead
  of the original attribute-name string check.
- Reveal/unlock/buy state handled as pure store data rather than DOM `.hide`
  classes.
- Tab entry fees → one-time unlocks.
- Dead code dropped (empty `if (temp < 36.8) {}`, unused `eff` object).
- jQuery background-flash damage cue → canvas feedback.
- `alert` / `confirm` → modal components.
- Versioned `localStorage` key guarded by `migrate()`.

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run the Vitest suite once
npm run build    # type-check + production build to dist/
```

## Deployment

Pushes to `main` trigger the GitHub Actions workflow
(`.github/workflows/deploy.yml`), which runs the tests, builds, and publishes
`dist/` to GitHub Pages. Vite is configured with `base: '/sc2000/'` to match the
Pages path.
