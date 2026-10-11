import { lazy, Suspense, useCallback, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { useIndex } from '../data/useIndex'
import type { IndexData } from '../data/types'
import { MapControls } from '../map/MapControls'
import type { ViewState } from '../map/MapView'
import { useFilters } from '../state/useFilters'

const MapView = lazy(() => import('../map/MapView'))

export interface ExploreContext {
  index: IndexData | undefined
  view: ViewState | null
}

// Layout route: the map lives here so it stays mounted while the side panel changes.
export function Explore() {
  const [filters, setFilters] = useFilters()
  const index = useIndex()
  const [view, setView] = useState<ViewState | null>(null)

  const onViewChange = useCallback(
    (v: ViewState, persist: boolean) => {
      setView(v)
      if (persist) setFilters({ ll: [v.lat, v.lon], z: v.zoom })
    },
    [setFilters],
  )
  const ctx: ExploreContext = { index: index.data, view }

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <a className="skip-link" href="#panel">Skip to results</a>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--s-3) var(--s-4)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>Seattle Home Value Finder</Link>
        <Link to="/about">About</Link>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', minHeight: 0 }}>
        <main id="panel" style={{ overflow: 'auto', padding: 'var(--s-4)', background: 'var(--surface)' }}>
          <Outlet context={ctx} />
        </main>
        <div style={{ position: 'relative', background: 'var(--bg)' }}>
          <Suspense fallback={<p style={{ padding: 'var(--s-5)' }}>Loading map…</p>}>
            <MapView index={index.data} filters={filters} onViewChange={onViewChange} />
          </Suspense>
          <div style={{ position: 'absolute', top: 'var(--s-3)', left: 'var(--s-3)', zIndex: 2 }}>
            <MapControls layer={filters.layer} metric={filters.metric} onLayer={(layer) => setFilters({ layer })} onMetric={(metric) => setFilters({ metric })} />
          </div>
        </div>
      </div>
    </div>
  )
}
