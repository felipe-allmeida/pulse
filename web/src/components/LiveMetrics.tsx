import { useEffect, useState } from 'react'

interface Metrics {
  activeConnections: number
  totalVisits: number
}

const POLL_INTERVAL_MS = 3000

const EMPTY_METRICS: Metrics = { activeConnections: 0, totalVisits: 0 }

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error(`metrics request failed: ${response.status}`)
        const data = (await response.json()) as Metrics
        if (!cancelled) {
          setMetrics(data)
          setHasError(false)
        }
      } catch (error) {
        if (!cancelled) setHasError(true)
        console.error('Failed to poll /api/metrics', error)
      }
    }

    void poll()
    const intervalId = setInterval(() => void poll(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  return (
    <section className="live-metrics" aria-label="Live metrics">
      <div className="metric">
        <span className="metric-value">{metrics.activeConnections}</span>
        <span className="metric-label">active now</span>
      </div>
      <div className="metric">
        <span className="metric-value">{metrics.totalVisits}</span>
        <span className="metric-label">total visits</span>
      </div>
      {hasError && <p className="metric-error">Metrics temporarily unavailable</p>}
    </section>
  )
}
