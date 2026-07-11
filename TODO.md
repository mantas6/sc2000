# Survival Clicker Remake — Plan

A modern remake of the legacy [survival-clicker](https://github.com/mantas6/survival-clicker)
(jQuery + Bootstrap + Pug) as a React + TypeScript + Vite app.

## Decisions

- **Stack**: Vite `react-ts`, React 18, TypeScript (`strict: true`), Vitest
- **Fidelity**: faithful mechanics + targeted cleanup
- **UI**: modern clean redesign (no Bootstrap, no jQuery)
- **Content**: typed TS config modules
- **Canvas**: live character status, simple vector figure, `requestAnimationFrame`-animated
- **Icons**: handcrafted original SVG components (no icon library)
- **Tab fees**: one-time unlock per tab

## Architecture

- Pure engine (`tick`, `applyItem`, `canAfford`, `isVisible`) — no DOM/React, faithful to original loop order.
- Typed content data (`Item`, `Tab`) with compile-time effect-key checking.
- `useReducer` + Context store; discriminated `GameAction` union.
- 1s `setInterval` tick + autosave hook.
- Canvas layer reads latest state via ref, animates independently of tick.

## Structure

```
index.html · package.json · vite.config.ts · tsconfig.json · vitest.config.ts
src/
  main.tsx  App.tsx
  game/
    types.ts initialState.ts constants.ts format.ts
    engine.ts thoughts.ts persistence.ts
    render/character.ts        # deriveAppearance(), drawCharacter()
  data/  tabs.ts + 13 category modules
  store/ gameReducer.ts GameContext.tsx
  hooks/ useGameLoop.ts
  ui/    icons.ts               # stat/role → icon map
  components/
    Header.tsx StatsPanel.tsx StatBar.tsx Tabs.tsx TabPane.tsx
    ItemButton.tsx EffectChips.tsx ThoughtsLog.tsx DeathModal.tsx
    CharacterCanvas.tsx
    icons/  Icon.tsx + glyphs + index.ts + Gallery.tsx (dev-only)
  styles/ *.css
  __tests__/ engine.test.ts appearance.test.ts format.test.ts
```

## Core types

- `GameState` — all original fields + `unlocked` / `bought` / `pause`
- `StatKey` — numeric keys only
- `Item { id, label, title?, cost, effects?, set?, buyname?, unlock?, icon? }`
- `Tab { id, label, unlockCost?, icon, items }`
- `GameAction` — discriminated union: `TICK | APPLY_ITEM | TOGGLE_PAUSE | RESET | LOAD`

## Engine order (faithful)

taxes decay → income → time++ → digestion decay → stomach-cap growth → temperature
regulation (deadly states + hydration/energy cost) → healthcap loss → stamina drain/regen
→ cap growth → healthin → auto-inject → idle drain → empty/destroyed-stomach damage →
digestion → vomit → clamp caps → starvation/dehydration → stomach-cap adjust → death check
→ healing → thoughts.

`applyItem` gates affordability, handles unlock/buy chains, ADD `effects` / SET `set`.

## Cleanup (faithful in feel)

- `tempoffset` modeled via `set` vs `effects` (no string name-check)
- Reveal-when-first-affordable + persistent `unlocked` handled in store, not DOM classes
- Tab entry fees → one-time unlock
- Drop dead code (empty temp `if`, unused `eff` object)
- jQuery background-flash hack → canvas damage cue
- `alert` / `confirm` → modal components
- Versioned `localStorage` key + `migrate()` guard

## Canvas character (simple vector figure)

`deriveAppearance(state)` → normalized 0–1 params; `drawCharacter(ctx, appearance, t)`.

- health → pallor / damage tint
- temp → cold: blue tint + shiver + breath puffs; hot: red tint + sweat drops
- hydration → skin dryness
- energy → posture / eyelids
- stamina → breathing rate/amplitude
- stomach fullness → belly size + vomit animation on vomit event
- death → collapse

HiDPI (`devicePixelRatio`) + `ResizeObserver`.

## Handcrafted icons

Shared `<Icon>` primitive: `0 0 24 24` viewBox, `currentColor`, 2px round strokes.
Original glyphs (no copying existing sets):

- Stats: Heart, Stamina, Stomach, Energy, Droplet, Thermometer
- HUD: Coins, Income, Percent, Clock, Digested, Pause, Play, Skull, Reset
- Tabs (13): Home, Briefcase, Dumbbell, Shirt, Utensils, Cup, Chart, Flask, Syringe,
  Cross, Landmark, Rocket, Microscope
- UI: Lock, Ban, ArrowUp, ArrowDown, Brain

`ui/icons.ts` maps stat keys / roles → components. `EffectChips.tsx` shows item deltas with
arrows + color. Dev-only `Gallery.tsx` for cohesion.

## Testing (Vitest)

- `engine.test.ts` — tick sequences (digestion, temp costs, vomit, starvation, death,
  healing), `applyItem` (cost gating, unlock/buy chains, set vs add)
- `appearance.test.ts` — `deriveAppearance` threshold outputs
- `format.test.ts` — money / time / digested formatting

## Build order

1. Scaffold `react-ts` project + configs + Vitest
2. `types.ts`, `initialState.ts`, `constants.ts`, `format.ts` (+ format tests)
3. `engine.ts` + `thoughts.ts` (+ engine tests) — lock balance
4. Author all 13 `data/*.ts` modules from `index.jade`
5. Store (reducer + context) + `useGameLoop` + persistence
6. Components + reveal/unlock/buy wiring + first-pass icons
7. `CharacterCanvas` + `render/character.ts` (+ appearance tests)
8. Styling pass + damage/heal feedback + icon refinement (gallery)
9. Verify feel vs original; README
