import { useCallback, useEffect, useRef, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { createConnection } from '../lib/connection'

// Mirrors the server-side allow-list in PresenceHub.cs. The server is the
// source of truth (it silently drops anything not in its own list); this
// copy only limits which buttons the UI offers.
const ALLOWED_EMOJI = ['👋', '❤️', '🔥', '👏', '🎉', '🚀', '😮', '💯'] as const

// Half the 30s presence TTL tracked server-side, so a heartbeat always lands
// well before the tracker would consider this connection stale.
const HEARTBEAT_INTERVAL_MS = 15000
const REACTION_LIFETIME_MS = 2500

interface ReactionReceivedPayload {
  emoji: string
  at: string
}

interface FloatingReaction {
  id: number
  emoji: string
  left: number
}

export function PresenceLayer() {
  const [count, setCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const connectionRef = useRef<HubConnection | null>(null)
  const nextReactionId = useRef(0)

  useEffect(() => {
    const connection = createConnection('')
    connectionRef.current = connection

    connection.on('PresenceUpdated', (activeCount: number) => {
      setCount(activeCount)
    })

    connection.on('ReactionReceived', (reaction: ReactionReceivedPayload) => {
      const id = ++nextReactionId.current
      // Random horizontal placement so floating reactions don't stack exactly on top of each other.
      const left = 10 + Math.random() * 80
      setReactions((prev) => [...prev, { id, emoji: reaction.emoji, left }])
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id))
      }, REACTION_LIFETIME_MS)
    })

    connection.onreconnecting(() => setConnected(false))
    connection.onreconnected(() => setConnected(true))
    connection.onclose(() => setConnected(false))

    let heartbeatId: ReturnType<typeof setInterval> | undefined

    connection
      .start()
      .then(() => {
        setConnected(true)
        heartbeatId = setInterval(() => {
          connection.invoke('Heartbeat').catch(() => {
            // Best-effort: a dropped heartbeat is recovered by automatic reconnect.
          })
        }, HEARTBEAT_INTERVAL_MS)
      })
      .catch((error: unknown) => {
        console.error('Failed to connect to presence hub', error)
      })

    return () => {
      if (heartbeatId !== undefined) clearInterval(heartbeatId)
      connection.off('PresenceUpdated')
      connection.off('ReactionReceived')
      void connection.stop()
    }
  }, [])

  const react = useCallback((emoji: string) => {
    connectionRef.current?.invoke('React', emoji).catch(() => {
      // Best-effort: dropped/rate-limited reactions just don't render for anyone.
    })
  }, [])

  return (
    <section className="presence-layer">
      <div className="presence-count">
        <span
          className={`status-dot ${connected ? 'status-dot--online' : 'status-dot--offline'}`}
          aria-hidden="true"
        />
        <strong>{count}</strong>
        <span className="presence-count__label">viewing now</span>
      </div>

      <div className="reaction-stage" aria-hidden="true">
        {reactions.map((r) => (
          <span
            key={r.id}
            className="floating-reaction"
            style={{ left: `${r.left}%` }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      <div className="reaction-bar" role="group" aria-label="Send a reaction">
        {ALLOWED_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-button"
            onClick={() => react(emoji)}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </section>
  )
}
