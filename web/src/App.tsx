import { LiveMetrics } from './components/LiveMetrics'
import { PresenceLayer } from './components/PresenceLayer'
import { WorldMap } from './components/WorldMap'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Pulse</h1>
        <p>Live presence across the site, right now.</p>
      </header>

      <main className="app-main">
        <WorldMap />
        <LiveMetrics />
        <PresenceLayer />
      </main>
    </div>
  )
}

export default App
