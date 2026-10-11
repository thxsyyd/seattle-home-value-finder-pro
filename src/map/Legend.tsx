import type { MetricKey } from '../lib/filters'
import { legendItems, metricTitle, NO_DATA } from './colors'

export function Legend({ metric, showNoData }: { metric: MetricKey; showNoData: boolean }) {
  const items = legendItems(metric)
  return (
    <figure
      aria-label={`Legend: ${metricTitle[metric]}`}
      style={{ margin: 0, padding: 'var(--s-3)', background: 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: '0 1px 4px #0003', fontSize: 'var(--fs-small)' }}
    >
      <figcaption style={{ fontWeight: 600, marginBottom: 'var(--s-2)' }}>{metricTitle[metric]}</figcaption>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
        {items.map((it) => (
          <li key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
            <span aria-hidden="true" style={{ width: 18, height: 12, background: it.color, border: '1px solid #0002', borderRadius: 2 }} />
            {it.label}
          </li>
        ))}
        {showNoData && (
          <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', color: 'var(--muted)' }}>
            <span aria-hidden="true" style={{ width: 18, height: 12, background: NO_DATA, border: '1px dashed #9aa1a9', borderRadius: 2 }} />
            Too few sales
          </li>
        )}
      </ul>
    </figure>
  )
}
