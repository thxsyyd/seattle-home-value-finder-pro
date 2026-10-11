import { useState } from 'react'
import type { MetricKey } from '../lib/filters'
import { legendItems, metricTitle, NO_DATA } from './colors'

export function Legend({ metric, showNoData }: { metric: MetricKey; showNoData: boolean }) {
  const items = legendItems(metric)
  // open on desktop, collapsed on phones where the map needs the room
  const [open, setOpen] = useState(() => typeof matchMedia === 'function' && matchMedia('(min-width: 768px)').matches)
  return (
    <figure aria-label={`Legend: ${metricTitle[metric]}`} className="legend">
      <figcaption>
        <button type="button" className="legend-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          {metricTitle[metric]} <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
      </figcaption>
      {open && (
        <ul>
          {items.map((it) => (
            <li key={it.label}>
              <span aria-hidden="true" className="swatch" style={{ background: it.color }} />
              {it.label}
            </li>
          ))}
          {showNoData && (
            <li style={{ color: 'var(--muted)' }}>
              <span aria-hidden="true" className="swatch" style={{ background: NO_DATA, border: '1px dashed #9aa1a9' }} />
              Too few sales
            </li>
          )}
        </ul>
      )}
    </figure>
  )
}
