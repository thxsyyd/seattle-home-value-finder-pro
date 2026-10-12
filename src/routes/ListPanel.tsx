import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { DebugPanel } from '../components/DebugPanel'
import { useT } from '../i18n'
import { HomeCard } from '../components/HomeCard'
import { money } from '../lib/format'
import type { SortKey } from '../lib/filters'
import { useHover } from '../state/hoverStore'
import { useFilters } from '../state/useFilters'
import type { ExploreContext } from './Explore'

const ROW = 112
const GAP = 8

export function ListPanel() {
  const { index, rows, loading, zoomedIn, priceOf } = useOutletContext<ExploreContext>()
  const [f, setFilters] = useFilters()
  const [params] = useSearchParams()
  const hover = useHover()
  const t = useT()
  const scroller = useRef<HTMLDivElement>(null)
  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => scroller.current, estimateSize: () => ROW + GAP, overscan: 6 })

  // hovering a marker scrolls its card into view (hovering a card never scrolls the list)
  useEffect(() => {
    if (hover.source !== 'map' || !hover.key) return
    const i = rows.findIndex((h) => h.key === hover.key)
    if (i >= 0) virt.scrollToIndex(i, { align: 'auto' })
  }, [hover.key, hover.source, rows, virt])

  const band = index?.model.error_overall

  return (
    <>
      <div className="result-head" aria-live="polite">
        <span>{!zoomedIn ? t('list.zoom') : loading && rows.length === 0 ? t('loading') : t(f.follow ? 'list.inView' : 'list.loaded', { n: rows.length.toLocaleString() })}</span>
        <span style={{ display: 'inline-flex', gap: 'var(--s-3)', alignItems: 'center' }}>
          <label>
            <input type="checkbox" checked={f.follow} onChange={(e) => setFilters({ follow: e.target.checked })} /> {t('list.follow')}
          </label>
          <label>
            {t('sort.label')}{' '}
            <select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as SortKey })}>
              <option value="dev">{t('sort.dev')}</option>
              <option value="price">{t('sort.price')}</option>
              <option value="ppsf">{t('sort.ppsf')}</option>
              <option value="newest">{t('sort.newest')}</option>
              <option value="sqft">{t('sort.sqft')}</option>
            </select>
          </label>
        </span>
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
        {zoomedIn && band && (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative', height: virt.getTotalSize() }}>
            {virt.getVirtualItems().map((v) => {
              const h = rows[v.index]
              return (
                <li key={h.key} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ROW, transform: `translateY(${v.start}px)` }}>
                  <HomeCard home={h} band={band} hovered={hover.key === h.key} price={priceOf(h)} style={{ height: '100%', boxSizing: 'border-box' }} />
                </li>
              )
            })}
          </ol>
        )}
      </div>
      {params.get('debug') === '1' && <DebugPanel />}
    </>
  )
}
