/**
 * App root: wires the store provider, the 1s game loop and the first-pass
 * layout (header · character slot · stats · thoughts · tabs · death modal).
 *
 * `useGameLoop` must run inside `GameProvider`, so the running game lives in an
 * inner `Game` component.
 */

import './styles/index.css'
import { Gallery } from './components/icons/Gallery'
import { CharacterCanvas } from './components/CharacterCanvas'
import { DeathModal } from './components/DeathModal'
import { Header } from './components/Header'
import { HintBar } from './components/HintBar'
import { OfflineModal } from './components/OfflineModal'
import { StatsPanel } from './components/StatsPanel'
import { Tabs } from './components/Tabs'
import { ThoughtsLog } from './components/ThoughtsLog'
import { WelcomeModal } from './components/WelcomeModal'
import { useGameLoop } from './hooks/useGameLoop'
import { useSpaceAction } from './hooks/useSpaceAction'
import { GameProvider } from './store/GameContext'

/** The running game — must be a child of `GameProvider` (uses the store). */
function Game() {
  useGameLoop()
  useSpaceAction()

  return (
    <div className="app">
      <Header />
      <HintBar />
      <div className="app__body">
        <aside className="app__side">
          <CharacterCanvas />
          <StatsPanel />
          <ThoughtsLog />
        </aside>
        <main className="app__main">
          <Tabs />
        </main>
      </div>
      <DeathModal />
      <WelcomeModal />
      <OfflineModal />
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
