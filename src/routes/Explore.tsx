import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { FilterChips } from '../layout/FilterChips'
import { useT } from '../i18n'
import type { Home, IndexData } from '../data/types'
import { useHome, useSimilar } from '../data/useHome'
import { useIndex } from '../data/useIndex'
import { useViewportHomes } from '../data/useViewportHomes'
import { homeLabel } from '../lib/backTarget'
import { viewBbox } from '../lib/geo'
import { DEFAULT_PANEL, pageSizeFor, stepFor } from '../lib/split'
import { useColumns } from '../lib/useColumns'
import { makePriceOf } from '../lib/priceIndex'
import { filterHomes, inBbox, sortHomes, type PriceOf } from '../lib/query'
import { Splitter } from '../components/Splitter'
import { LayersButton } from '../map/LayersButton'
import type { ViewState } from '../map/MapView'
import { DEFAULT_VIEW } from '../map/view'
import { listMemory } from '../state/listMemory'
import { useFilters } from '../state/useFilters'

const NO_HOMES: Home[] = []
const MapView = lazy(() => import('../map/MapView'))

/** Below this zoom a viewport spans too many ZIPs to list individual sales. */
export const MIN_LIST_ZOOM = 10.5

const PANEL_KEY = 'hvf.panelw'

function readPanelWidth(): number | null {
  try {
    const v = Number(localStorage.getItem(PANEL_KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

export interface ExploreContext {
  index: IndexData | undefined
  view: ViewState | null
  /** sales that pass the filters, for the ZIPs near the viewport */
  filtered: Home[]
  /** filtered sales in the viewport (or all loaded ones when "follow map" is off), sorted */
  rows: Home[]
  /** the best matches that are currently shown as cards (and prioritised on the map) */
  listed: Home[]
  shown: number
  showMore: () => void
  /** how many more cards "Show more" adds (whole rows) */
  step: number
  loading: boolean
  zoomedIn: boolean
  /** price used for display, filtering and sorting (as sold, or restated to today's dollars) */
  priceOf: PriceOf
}

// Layout route: the map lives here so it stays mounted while the side panel changes.
export function Explore() {
  const [filters, setFilters] = useFilters()
  const index = useIndex()
  const navigate = useNavigate()
  const t = useT()
  const { pathname, search } = useLocation()
  const [view, setView] = useState<ViewState | null>(null)

  const zoom = view?.zoom ?? filters.z ?? DEFAULT_VIEW.zoom
  const bbox = useMemo(
    () => view?.bbox ?? viewBbox(filters.ll?.[0] ?? DEFAULT_VIEW.lat, filters.ll?.[1] ?? DEFAULT_VIEW.lon, zoom),
    [view, filters.ll, zoom],
  )
  const zoomedIn = zoom >= MIN_LIST_ZOOM
  const { homes, loading } = useViewportHomes(bbox, index.data, 220, zoomedIn)

  const f = filters
  const pi = index.data?.priceIndex
  const priceOf = useMemo(() => makePriceOf(f.adj, pi), [f.adj, pi])
  const filterKey = JSON.stringify([f.minp, f.maxp, f.beds, f.baths, f.sfMin, f.sfMax, f.ybMin, f.ybMax, f.gr, f.wf, f.dv])
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `f` is only read through filterKey
  const filtered = useMemo(() => filterHomes(homes, f, priceOf), [homes, filterKey, priceOf])
  const rows = useMemo(
    () => sortHomes(f.follow ? inBbox(filtered, bbox) : filtered, f.sort, priceOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, bbox, f.sort, f.follow, priceOf],
  )

  // Cards show only the best matches for the current map area; panning or zooming, or changing a filter or the sort, starts again at the first page.
  const sig = JSON.stringify([bbox.map((n) => Math.round(n * 1000)), filterKey, f.sort, f.show, f.adj, f.follow])
  const panelRef = useRef<HTMLElement>(null)
  const cols = useColumns(panelRef)
  const page = pageSizeFor(cols)
  const step = stepFor(cols)
  const [more, setMore] = useState({ sig: '', n: page })
  const shown = more.sig === `${sig}|${page}` ? more.n : page
  const showMore = useCallback(() => setMore({ sig: `${sig}|${page}`, n: shown + step }), [sig, page, shown, step])
  const listed = useMemo(() => rows.slice(0, shown), [rows, shown])
  const listedKeys = useMemo(() => listed.map((h) => h.key), [listed])

  // draggable divider between the list and the map
  const splitRef = useRef<HTMLElement>(null)
  const [panelW, setPanelW] = useState<number | null>(readPanelWidth)
  const onPanelWidth = useCallback((px: number | null, final: boolean) => {
    setPanelW(px)
    if (!final) return
    try {
      if (px === null) localStorage.removeItem(PANEL_KEY)
      else localStorage.setItem(PANEL_KEY, String(px))
    } catch {
      /* ignore */
    }
  }, [])

  const homeMatch = useMatch('/home/:id')
  const selected = useHome(homeMatch?.params.id, index.data).data ?? null
  const similar = useSimilar(selected, index.data).data
  // a different map area or filter makes a different list, so it starts from the top again
  useEffect(() => {
    listMemory.scrollTop = 0
  }, [sig])

  const onViewChange = useCallback(
    (v: ViewState, persist: boolean) => {
      setView(v)
      if (persist) setFilters({ ll: [v.lat, v.lon], z: v.zoom })
    },
    [setFilters],
  )
  const onSelectHome = useCallback(
    (key: string) => navigate({ pathname: `/home/${key}`, search }, { state: { from: selected ? { kind: 'home', label: homeLabel(selected.price, selected.zip) } : { kind: 'results' } } }),
    [navigate, search, selected],
  )

  const detail = pathname !== '/'
  const ctx: ExploreContext = { index: index.data, view, filtered, rows, listed, shown, showMore, step, loading, zoomedIn, priceOf }

  return (
    <div className="explore" data-view={filters.view} data-detail={detail}>
      <FilterChips filters={filters} index={index.data} count={rows.length} onChange={(patch) => setFilters(patch)} />
      <DisclaimerBanner range={index.data?.dataRange} />
      <main className="split" ref={splitRef} style={{ '--panel-w': panelW ? `${panelW}px` : DEFAULT_PANEL } as CSSProperties}>
        <h1 className="sr-only">{t('h1')}</h1>
        <section id="main-content" ref={panelRef} className="panel" aria-label={t('panel.results')} tabIndex={-1}>
          <Outlet context={ctx} />
        </section>
        <Splitter container={splitRef} value={panelW} onChange={onPanelWidth} />
        <section className="mapwrap" aria-label={t('map.region')}>
          <Suspense fallback={<p style={{ padding: 'var(--s-5)' }}>{t('map.loading')}</p>}>
            <MapView index={index.data} filters={filters} homes={filtered} listed={listedKeys} similar={similar ?? NO_HOMES} priceOf={priceOf} selected={selected} onSelectHome={onSelectHome} onViewChange={onViewChange} />
          </Suspense>
          <LayersButton />
        </section>
      </main>
      <nav className="viewtoggle" aria-label={t('view.toggle')}>
        <button type="button" aria-pressed={filters.view === 'list'} onClick={() => setFilters({ view: 'list' })}>{t('view.list')}</button>
        <button type="button" aria-pressed={filters.view === 'map'} onClick={() => setFilters({ view: 'map' })}>{t('view.map')}</button>
      </nav>
    </div>
  )
}
