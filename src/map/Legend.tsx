import { useState } from 'react'
import { useT } from '../i18n'
import type { MetricKey } from '../lib/filters'
import { legendItems, NO_DATA } from './colors'

export function Legend({ metric, showNoData }: { metric: MetricKey; showNoData: boolean }) {
  const t = useT()
  const items = legendItems(metric, t)
  const title = t(`legend.${metric}`)
  // open on desktop, collapsed on phones where the map needs the room
  const [open, setOpen] = useState(() => typeof matchMedia === 'function' && matchMedia('(min-width: 768px)').matches)
  return (
    <figure aria-label={t('legend.aria', { title })} className="legend">
      <figcaption>
        <button type="button" className="legend-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          {title} <span aria-hidden="true">{open ? '▾' : '▸'}</span>
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
              {t('legend.noData')}
            </li>
          )}
        </ul>
      )}
    </figure>
  )
}
