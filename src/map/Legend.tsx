import { useState } from 'react'
import { useT } from '../i18n'
import type { LayerKey, MetricKey } from '../lib/filters'
import { legendItems, NO_DATA } from './colors'
import { TONE } from './homesLayer'

/** Bottom-left key. Dots are always explained; the area scale is added only while an area layer is on. */
export function Legend({ metric, layer, lo, hi }: { metric: MetricKey; layer: LayerKey; lo?: string; hi?: string }) {
  const t = useT()
  // the colour key is the only way to read the map, so it starts open; it is one wrapping row, not a panel
  const [open, setOpen] = useState(true)
  const areas = layer !== 'none'
  const title = areas ? t(`legend.${metric}`) : t('legend.dots')
  const dots: [string, string, string][] = [
    [TONE.below, '▼', t('legend.below')],
    [TONE.near, '', t('legend.near')],
    [TONE.above, '▲', t('legend.above')],
  ]
  return (
    <figure aria-label={t('legend.aria', { title })} className="legend">
      <figcaption>
        <button type="button" className="legend-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          {!open && (
            <span className="legend-dots" aria-hidden="true">
              {dots.map(([color]) => <span key={color} className="dot" style={{ background: color }} />)}
            </span>
          )}
          {t('legend.dots')} <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
      </figcaption>
      {open && (
        <>
          <ul className="legend-row">
            {dots.map(([color, mark, text]) => (
              <li key={text}>
                <span aria-hidden="true" className="dot" style={{ background: color }} />
                {mark && <span aria-hidden="true" className="mark" style={{ color }}>{mark}</span>}
                {text}
              </li>
            ))}
          </ul>
          {lo && hi && <p className="legend-sub">{t('legend.band', { lo, hi })}</p>}
          {areas && (
            <>
              <p className="legend-sub">{t(`legend.${metric}`)}</p>
              <ul>
                {legendItems(metric, t).map((it) => (
                  <li key={it.label}>
                    <span aria-hidden="true" className="swatch" style={{ background: it.color }} />
                    {it.label}
                  </li>
                ))}
                {layer === 'hex' && (
                  <li style={{ color: 'var(--ink-2)' }}>
                    <span aria-hidden="true" className="swatch" style={{ background: NO_DATA, border: '1px dashed #9aa1a9' }} />
                    {t('legend.noData')}
                  </li>
                )}
              </ul>
            </>
          )}
        </>
      )}
    </figure>
  )
}
