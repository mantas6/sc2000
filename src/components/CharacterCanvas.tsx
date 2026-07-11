/**
 * Live character canvas (build step 7).
 *
 * Architecture (per TODO.md "Canvas layer reads latest state via ref, animates
 * independently of tick"): the component subscribes to the store only to keep a
 * *ref* to the latest state up to date. All drawing happens inside a
 * `requestAnimationFrame` loop that reads that ref, so the figure animates
 * smoothly at display refresh rate rather than lurching once per 1s tick.
 *
 * HiDPI is handled by sizing the backing store to `devicePixelRatio` and
 * scaling the context; a `ResizeObserver` keeps that in sync with the CSS box.
 *
 * Transient visual cues (vomit, damage) are *events*, not derivable from a
 * single snapshot, so they are detected here by diffing successive ticks and
 * fed into the appearance object as decaying 0–1 values. The polished
 * damage/heal feedback is step 8; this keeps it intentionally simple.
 */

import { useEffect, useRef } from 'react'
import { deriveAppearance, drawCharacter } from '../game/render/character'
import { useGame } from '../store/GameContext'
import type { StoreState } from '../store/gameReducer'

/** Seconds over which a triggered vomit / damage / heal cue fades back to 0. */
const VOMIT_DECAY = 1.6
const DAMAGE_DECAY = 0.5
const HEAL_DECAY = 0.6

export function CharacterCanvas() {
  const { state } = useGame()

  // Latest store state for the rAF loop, without redrawing on every render.
  const stateRef = useRef<StoreState>(state)
  stateRef.current = state

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Wrapper element gets a transient `data-flash` so the CSS frame cue fires.
  const frameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let dpr = Math.max(1, window.devicePixelRatio || 1)

    const resize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      const cssW = Math.max(1, rect.width)
      const cssH = Math.max(1, rect.height)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
    }

    // Keep the backing store in sync with the CSS box. Prefer ResizeObserver;
    // fall back to window resize where it is unavailable (e.g. jsdom).
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize)
      ro.observe(canvas)
    } else {
      window.addEventListener('resize', resize)
    }
    resize()

    // Event tracking across ticks.
    let prevTime = stateRef.current.game.time
    let prevStomachRatio = ratioOf(stateRef.current.game.stomach, stateRef.current.game.stomachcap)
    let prevHealth = stateRef.current.game.health
    let prevDeath = stateRef.current.death
    let vomitCue = 0
    let damageCue = 0
    let healCue = 0
    // Last written frame-cue attribute, to avoid redundant DOM writes.
    let frameFlash = ''

    const startMs = performance.now()
    let lastMs = startMs

    const loop = (nowMs: number) => {
      const t = (nowMs - startMs) / 1000
      const dt = Math.min(0.1, (nowMs - lastMs) / 1000)
      lastMs = nowMs

      const store = stateRef.current
      const g = store.game

      // Detect per-tick events (state only changes on a tick).
      if (g.time !== prevTime) {
        const stomachRatio = ratioOf(g.stomach, g.stomachcap)
        // Vomit: stomach was near/over full and dropped sharply this tick.
        if (prevStomachRatio > 0.85 && stomachRatio < prevStomachRatio - 0.3) {
          vomitCue = 1
        }
        // Damage: a noticeable health drop between ticks.
        if (g.health < prevHealth - 0.5) {
          damageCue = 1
        }
        // Heal: a noticeable health gain between ticks (green cue).
        if (g.health > prevHealth + 0.5) {
          healCue = 1
        }
        prevStomachRatio = stomachRatio
        prevHealth = g.health
        prevTime = g.time
      }
      // A newly-surfaced death summary is a strong damage cue.
      if (store.death !== prevDeath) {
        if (store.death !== null) damageCue = 1
        prevDeath = store.death
      }

      // Decay the transient cues toward 0.
      vomitCue = Math.max(0, vomitCue - dt / VOMIT_DECAY)
      damageCue = Math.max(0, damageCue - dt / DAMAGE_DECAY)
      healCue = Math.max(0, healCue - dt / HEAL_DECAY)

      // Reflect the strongest active cue onto the wrapper frame (damage wins).
      const nextFlash = damageCue > 0.15 ? 'damage' : healCue > 0.15 ? 'heal' : ''
      if (nextFlash !== frameFlash) {
        frameFlash = nextFlash
        const frame = frameRef.current
        if (frame) {
          if (nextFlash) frame.dataset.flash = nextFlash
          else delete frame.dataset.flash
        }
      }

      const appearance = deriveAppearance(g)
      appearance.vomit = vomitCue
      appearance.damage = damageCue
      // While a death summary awaits acknowledgement, hold the collapse pose
      // (the engine has already reset `game` to a fresh, healthy state).
      if (store.death !== null) {
        appearance.dead = true
        appearance.collapse = 1
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      drawCharacter(ctx, appearance, t)

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="character" ref={frameRef} aria-hidden="true">
      <canvas ref={canvasRef} className="character__canvas" />
    </div>
  )
}

/** Safe `value / cap` in `[0, 1]` (guards a non-positive cap). */
function ratioOf(value: number, cap: number): number {
  if (cap <= 0) return 0
  const r = value / cap
  return r < 0 ? 0 : r > 1 ? 1 : r
}
