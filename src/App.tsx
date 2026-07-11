/**
 * App root: wires the store provider, the 1s game loop and the first-pass
 * layout (header · character slot · stats · thoughts · tabs · death modal).
 *
 * `useGameLoop` must run inside `GameProvider`, so the running game lives in an
 * inner `Game` component. The `CharacterCanvas` slot is a placeholder until
 * step 7 fills it in.
 */

import './styles/index.css'
import { Gallery } from './components/icons/Gallery'
import { DeathModal } from './components/DeathModal'
import { Header } from './components/Header'
import { StatsPanel } from './components/StatsPanel'
import { Tabs } from './components/Tabs'
import { ThoughtsLog } from './components/ThoughtsLog'
import { useGameLoop } from './hooks/useGameLoop'
import { GameProvider } from './store/GameContext'

/** The running game — must be a child of `GameProvider` (uses the store). */
function Game() {
  useGameLoop()

  return (
    <div className="app">
      <Header />
      <div className="app__body">
        <aside className="app__side">
          {/* CharacterCanvas slot (step 7). */}
          <div className="character-slot" aria-hidden="true">
            <span className="character-slot__label">Character</span>
          </div>
          <StatsPanel />
          <ThoughtsLog />
        </aside>
        <main className="app__main">
          <Tabs />
        </main>
      </div>
      <DeathModal />
    </div>
  )
}

export default function App() {
  // Dev-only icon gallery: `?gallery` under Vite dev.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('gallery')) {
    return <Gallery />
  }

  return (
    <GameProvider>
      <Game />
    </GameProvider>
  )
}
