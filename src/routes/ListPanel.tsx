import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { DebugPanel } from '../components/DebugPanel'
import { useT } from '../i18n'
import { HomeCard } from '../components/HomeCard'
import { money } from '../lib/format'
import type { SortKey } from '../lib/filters'
import { useHover } from '../state/hoverStore'
import { useFilters } from '../state/useFilters'
import type { ExploreContext } from './Explore'

const ROW = 262 // one card plus its gap
const CARD_H = 238

export function ListPanel() {
  const { index, rows, loading, zoomedIn, priceOf } = useOutletContext<ExploreContext>()
  const [f, setFilters] = useFilters()
  const [params] = useSearchParams()
  const hover = useHover()
  const t = useT()
  const scroller = useRef<HTMLDivElement>(null)
  // two columns when the list is wide enough, like a listings grid
  const [cols, setCols] = useState(1)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => setCols(el.clientWidth >= 560 ? 2 : 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const groups = Math.ceil(rows.length / cols)
  const virt = useVirtualizer({ count: groups, getScrollElement: () => scroller.current, estimateSize: () => ROW, overscan: 3 })

  // hovering a marker scrolls its card into view (hovering a card never scrolls the list)
  useEffect(() => {
    if (hover.source !== 'map' || !hover.key) return
    const i = rows.findIndex((h) => h.key === hover.key)
    if (i >= 0) virt.scrollToIndex(Math.floor(i / cols), { align: 'auto' })
  }, [hover.key, hover.source, rows, virt, cols])

  const band = index?.model.error_overall

  return (
    <>
      <div className="results-head">
        <h2 className="results-title" aria-live="polite">
          {!zoomedIn ? t('list.zoom') : loading && rows.length === 0 ? t('loading') : t(f.show === 'under' && f.dv === undefined ? 'results.under' : 'results.all', { n: rows.length.toLocaleString() })}
        </h2>
        <p className="results-sub">{t(f.show === 'under' && f.dv === undefined ? 'results.subUnder' : 'results.subAll')}</p>
        <label className="sortbox">
          {t('sort.label')}{' '}
          <select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as SortKey })}>
            <option value="dev">{t('sort.dev')}</option>
            <option value="price">{t('sort.price')}</option>
            <option value="ppsf">{t('sort.ppsf')}</option>
            <option value="newest">{t('sort.newest')}</option>
            <option value="sqft">{t('sort.sqft')}</option>
          </select>
        </label>
      </div>
      <div ref={scroller} className="list-scroll">
        {!zoomedIn && index && (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[...index.zips].sort((a, b) => a.zip.localeCompare(b.zip)).map((z) => (
              <li key={z.zip} style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setFilters({ ll: [z.centroid[1], z.centroid[0]], z: 12 }, { push: true })}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, padding: 'var(--s-2) 0', cursor: 'pointer', font: 'inherit', minHeight: 44 }}
                >
                  {t('list.zipRow', { zip: z.zip, price: money(z.medPrice), ppsf: z.medPpsf, n: z.n })}
                </button>
              </li>
            ))}
          </ol>
        )}
        {zoomedIn && !loading && rows.length === 0 && <p className="empty">{t('list.empty')}</p>}
        {zoomedIn && loading && rows.length === 0 && (
          <div className="grid" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
          </div>
        )}
        {zoomedIn && band && rows.length > 0 && (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative', height: virt.getTotalSize() }}>
            {virt.getVirtualItems().map((v) => (
              <li key={v.index} className="grid" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: CARD_H, transform: `translateY(${v.start}px)`, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {rows.slice(v.index * cols, v.index * cols + cols).map((h) => (
                  <HomeCard key={h.key} home={h} band={band} hovered={hover.key === h.key} price={priceOf(h)} hideUnderBadge={f.show === 'under' && f.dv === undefined} style={{ height: '100%', boxSizing: 'border-box' }} />
                ))}
              </li>
            ))}
          </ol>
        )}
      </div>
      {params.get('debug') === '1' && <DebugPanel />}
    </>
  )
}
