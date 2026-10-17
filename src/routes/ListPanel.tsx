import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { DebugPanel } from '../components/DebugPanel'
import { useT } from '../i18n'
import { HomeCard } from '../components/HomeCard'
import { money } from '../lib/format'
import type { SortKey } from '../lib/filters'
import { useHover } from '../state/hoverStore'
import { listMemory } from '../state/listMemory'
import { useFilters } from '../state/useFilters'
import { makePriceOf, parseAdj } from '../lib/priceIndex'
import type { ExploreContext } from './Explore'

const INTRO_KEY = 'hvf.intro'

/** A one-time, dismissible line that says what this page is for. */
function Intro() {
  const t = useT()
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(INTRO_KEY) !== 'seen'
    } catch {
      return true
    }
  })
  if (!open) return null
  const close = () => {
    setOpen(false)
    try {
      localStorage.setItem(INTRO_KEY, 'seen')
    } catch {
      /* ignore */
    }
  }
  return (
    <p className="intro">
      <span>{t('intro.text')}</span>
      <button type="button" className="intro-x" aria-label={t('intro.close')} onClick={close}>
        <span aria-hidden="true">×</span>
      </button>
    </p>
  )
}

export function ListPanel() {
  const { index, rows, listed, shown, showMore, step, loading, zoomedIn, priceOf } = useOutletContext<ExploreContext>()
  const [f, setFilters] = useFilters()
  const [params] = useSearchParams()
  const hover = useHover()
  const t = useT()
  // hovering a marker brings its card into view when it is one of the listed ones (hovering a card never scrolls)
  useEffect(() => {
    if (hover.source !== 'map' || !hover.key) return
    document.querySelector(`.card[data-key="${CSS.escape(hover.key)}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [hover.key, hover.source])

  const scroller = useRef<HTMLDivElement>(null)
  // coming back from a home: restore the scroll position and give its card focus again
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = listMemory.scrollTop
    const key = listMemory.opened
    listMemory.opened = null
    if (key) document.querySelector<HTMLElement>(`.card[data-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true })
  }, [])

  const band = index?.model.error_overall
  // today's price, shown as a second line on cards when the prices themselves are as sold
  const todayOf = useMemo(() => (parseAdj(f.adj).kind === 'none' ? makePriceOf('metro', index?.priceIndex) : undefined), [f.adj, index?.priceIndex])

  return (
    <>
      {zoomedIn && <Intro />}
      <div className="results-head">
        <div className="results-top">
          <h2 className="results-title" aria-live="polite">
            {!zoomedIn ? t('list.zoom') : loading && rows.length === 0 ? t('loading') : t(f.show === 'under' && f.dv === undefined ? 'results.under' : 'results.all', { n: rows.length.toLocaleString() })}
          </h2>
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
        <p className="results-sub">
          {t(f.show === 'under' && f.dv === undefined ? 'results.subUnder' : 'results.subAll')}{' '}
          <details className="explain">
            <summary>{t('explain.q')}</summary>
            <span>{t('explain.a')}</span>
            <span>{t('explain.b')}</span>
            <span>{t('explain.c')}</span>
          </details>
        </p>
        <label className="followbox">
          <input type="checkbox" checked={f.follow} onChange={(e) => setFilters({ follow: e.target.checked })} /> {t('list.follow')}
        </label>
      </div>
      <div ref={scroller} className="list-scroll" onScroll={(e) => { listMemory.scrollTop = e.currentTarget.scrollTop }}>
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
          <>
            <ol className="grid cards">
              {listed.map((h) => (
                <li key={h.key}>
                  <HomeCard home={h} band={band} hovered={hover.key === h.key} price={priceOf(h)} today={todayOf?.(h)} hideUnderBadge={f.show === 'under' && f.dv === undefined} />
                </li>
              ))}
            </ol>
            <div className="more-row">
              <p className="hint">{t(f.follow ? 'list.showing' : 'list.showingAll', { shown: listed.length, total: rows.length.toLocaleString() })}</p>
              {rows.length > shown && (
                <button type="button" className="secondary" onClick={showMore}>{t('list.more', { n: Math.min(step, rows.length - shown) })}</button>
              )}
            </div>
          </>
        )}
      </div>
      {params.get('debug') === '1' && <DebugPanel />}
    </>
  )
}
