import { useEffect, useState } from 'react'
import { metrics } from '../data/metrics'

/** Visible with ?debug=1: live request counters, for measuring the data layer. */
export function DebugPanel() {
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 500)
    return () => clearInterval(t)
  }, [])
  return (
    <pre
      aria-label="Request counters"
      style={{ position: 'fixed', right: 8, bottom: 8, margin: 0, padding: 8, background: '#000c', color: '#fff', fontSize: 12, borderRadius: 6, zIndex: 50 }}
    >
      {JSON.stringify(metrics, null, 1)}
    </pre>
  )
}
