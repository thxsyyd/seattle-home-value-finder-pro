import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { FilterBar } from '../components/FilterBar'
import type { Home, IndexData } from '../data/types'
import { useHome } from '../data/useHome'
import { useIndex } from '../data/useIndex'
import { useViewportHomes } from '../data/useViewportHomes'
import { viewBbox } from '../lib/geo'
import { makePriceOf } from '../lib/priceIndex'
import { filterHomes, inBbox, sortHomes, type PriceOf } from '../lib/query'
import { MapControls } from '../map/MapControls'
import type { ViewState } from '../map/MapView'
import { DEFAULT_VIEW } from '../map/view'
import { useFilters } from '../state/useFilters'

const MapView = lazy(() => import('../map/MapView'))

/** Below this zoom a viewport spans too many ZIPs to list individual sales. */
export const MIN_LIST_ZOOM = 10.5

export interface ExploreContext {
  index: IndexData | undefined
  view: ViewState | null
  /** sales that pass the filters, for the ZIPs near the viewport */
  filtered: Home[]
  /** filtered sales in the viewport (or all loaded ones when "follow map" is off), sorted */
  rows: Home[]
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

  const homeMatch = useMatch('/home/:id')
  const selected = useHome(homeMatch?.params.id, index.data).data ?? null

  const onViewChange = useCallback(
    (v: ViewState, persist: boolean) => {
      setView(v)
      if (persist) setFilters({ ll: [v.lat, v.lon], z: v.zoom })
    },
    [setFilters],
  )
  const onSelectHome = useCallback((key: string) => navigate({ pathname: `/home/${key}`, search }), [navigate, search])

  const detail = pathname !== '/'
  const ctx: ExploreContext = { index: index.data, view, filtered, rows, loading, zoomedIn, priceOf }

  return (
    <div className="explore" data-view={filters.view} data-detail={detail}>
      <a className="skip-link" href="#panel">Skip to results</a>
      <header className="topbar">
        <h1 className="sr-only">Seattle Home Value Finder: King County home sales, 2014–2015</h1>
        <Link to={{ pathname: '/', search }} className="brand" aria-label="Seattle Home Value Finder, home">Seattle Home Value Finder</Link>
        <nav className="topnav" aria-label="Site">
          <Link to={{ pathname: '/afford', search }}>Affordability</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <DisclaimerBanner range={index.data?.dataRange} />
      <main className="split">
        <section id="panel" className="panel" aria-label="Results" tabIndex={-1}>
          {!detail && <FilterBar filters={filters} index={index.data} onChange={(patch) => setFilters(patch)} />}
          <Outlet context={ctx} />
        </section>
        <section className="mapwrap" aria-label="Map and legend">
          <Suspense fallback={<p style={{ padding: 'var(--s-5)' }}>Loading map…</p>}>
            <MapView index={index.data} filters={filters} homes={filtered} priceOf={priceOf} selected={selected} onSelectHome={onSelectHome} onViewChange={onViewChange} />
          </Suspense>
          <div className="mapctl">
            <MapControls layer={filters.layer} metric={filters.metric} onLayer={(layer) => setFilters({ layer })} onMetric={(metric) => setFilters({ metric })} />
          </div>
        </section>
      </main>
      <nav className="viewtoggle" aria-label="Show list or map">
        <button type="button" aria-pressed={filters.view === 'list'} onClick={() => setFilters({ view: 'list' })}>List</button>
        <button type="button" aria-pressed={filters.view === 'map'} onClick={() => setFilters({ view: 'map' })}>Map</button>
      </nav>
    </div>
  )
}
