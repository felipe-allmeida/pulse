import { useEffect, useState } from 'react'

interface GeoPoint {
  lat: number
  lon: number
  city: string
  country: string
  at: string
}

// Equirectangular canvas — 2:1 aspect ratio matches 360deg of longitude over
// 180deg of latitude, so the standard projection formula below maps evenly.
const MAP_WIDTH = 960
const MAP_HEIGHT = 480
const POLL_INTERVAL_MS = 15000

function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * MAP_WIDTH
  const y = ((90 - lat) / 180) * MAP_HEIGHT
  return { x, y }
}

// Schematic continent silhouettes — not coastline-accurate, just enough
// shape for visitor dots to read as "on a world map" without shipping a
// real geo dataset (keeps the bundle tiny and avoids any external tile
// service or API key, per the privacy constraint).
const LANDMASSES = [
  'M60,50 L180,40 L300,70 L340,110 L320,160 L260,190 L180,200 L100,180 L50,140 L30,90 Z',
  'M300,215 L340,220 L370,260 L360,320 L330,380 L300,370 L280,300 L270,250 Z',
  'M460,60 L560,55 L580,90 L550,130 L480,140 L455,100 Z',
  'M460,145 L560,140 L600,180 L590,260 L550,320 L500,300 L470,220 L450,180 Z',
  'M590,45 L750,40 L900,60 L950,110 L900,180 L800,220 L700,200 L620,150 L590,90 Z',
  'M790,275 L860,270 L885,300 L870,340 L820,350 L790,320 Z',
]

const GRATICULE_X = Array.from({ length: 11 }, (_, i) => (i + 1) * 80)
const GRATICULE_Y = Array.from({ length: 5 }, (_, i) => (i + 1) * 80)

export function WorldMap() {
  const [points, setPoints] = useState<GeoPoint[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/map')
        if (!response.ok) throw new Error(`map request failed: ${response.status}`)
        const data = (await response.json()) as GeoPoint[]
        if (!cancelled) setPoints(data)
      } catch (error) {
        // Keep the last known points on a transient failure; an empty map
        // still renders fine on first load.
        console.error('Failed to poll /api/map', error)
      }
    }

    void load()
    const intervalId = setInterval(() => void load(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  return (
    <section className="world-map" aria-label="Recent visits by location">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label="World map of recent visitor locations"
      >
        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="map-ocean" />
        <g className="map-graticule">
          {GRATICULE_X.map((x) => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={MAP_HEIGHT} />
          ))}
          {GRATICULE_Y.map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={MAP_WIDTH} y2={y} />
          ))}
        </g>
        <g className="map-landmass">
          {LANDMASSES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g className="map-points">
          {points.map((p, i) => {
            const { x, y } = project(p.lat, p.lon)
            return (
              <circle
                key={`${p.city}-${p.country}-${p.at}-${i}`}
                cx={x}
                cy={y}
                r={4}
                className="map-point"
              >
                <title>{`${p.city}, ${p.country}`}</title>
              </circle>
            )
          })}
        </g>
      </svg>
      {points.length === 0 && <p className="map-empty">No visits recorded yet</p>}
    </section>
  )
}
