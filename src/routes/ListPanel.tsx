import { useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { DebugPanel } from '../components/DebugPanel'
import { useViewportHomes } from '../data/useViewportHomes'
import { BEST_DEALS, type SortKey } from '../lib/filters'
import { viewBbox } from '../lib/geo'
import { money, signedPct } from '../lib/format'
import type { ExploreContext } from './Explore'
import { DEFAULT_VIEW } from '../map/view'
import { filterHomes, inBbox, sortHomes } from '../lib/query'
import { useFilters } from '../state/useFilters'

/** Below this zoom a viewport spans too many zips to list individual sales. */
const MIN_LIST_ZOOM = 10.5
const MAX_ROWS = 50

// P2 stand-in for the final list: exercises URL state + lazy per-zip loading before the map exists.
export function ListPanel() {
  const [f, setFilters] = useFilters()
  const [params] = useSearchParams()
  const { index, view } = useOutletContext<ExploreContext>()
  const zoom = view?.zoom ?? f.z ?? DEFAULT_VIEW.zoom
  const bbox = useMemo(
    () => view?.bbox ?? viewBbox(f.ll?.[0] ?? DEFAULT_VIEW.lat, f.ll?.[1] ?? DEFAULT_VIEW.lon, zoom),
    [view, f.ll, zoom],
  )
  const zoomedIn = zoom >= MIN_LIST_ZOOM
  const { homes, loading } = useViewportHomes(bbox, index, 220, zoomedIn)

  const rows = useMemo(() => sortHomes(inBbox(filterHomes(homes, f), bbox), f.sort), [homes, f, bbox])

  return (
    <>
      <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Homes</h1>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>
        2014–2015 King County sales.
      </p>
      <div role="group" aria-label="Filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', margin: 'var(--s-3) 0' }}>
        <label>
          Beds{' '}
          <select value={f.beds ?? 0} onChange={(e) => setFilters({ beds: Number(e.target.value) || undefined })}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n === 0 ? 'Any' : `${n}+`}</option>
            ))}
          </select>
        </label>
        <label>
          Max price{' '}
          <input
            type="number" step={25000} min={0} value={f.maxp ?? ''}
            onChange={(e) => setFilters({ maxp: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>
        <label>
          Sort{' '}
          <select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as SortKey })}>
            <option value="dev">Most below model</option>
            <option value="price">Price</option>
            <option value="ppsf">$/sqft</option>
            <option value="newest">Newest sale</option>
            <option value="sqft">Largest</option>
          </select>
        </label>
        <button type="button" onClick={() => setFilters(BEST_DEALS)}>Best deals under $500k</button>
        <button type="button" onClick={() => setFilters({ minp: undefined, maxp: undefined, beds: undefined, baths: undefined, sfMin: undefined, sfMax: undefined, ybMin: undefined, ybMax: undefined, gr: undefined, wf: undefined, dv: undefined })}>
          Reset
        </button>
      </div>
      <p aria-live="polite">
        {!zoomedIn ? 'Zoom in or pick a ZIP code to list individual sales.' : loading ? 'Loading…' : `${rows.length.toLocaleString()} homes in view`}
      </p>
      {!zoomedIn && index && (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[...index.zips].sort((a, b) => a.medDev - b.medDev).map((z) => (
            <li key={z.zip} style={{ borderBottom: '1px solid var(--border)' }}>
              <button type="button" onClick={() => setFilters({ ll: [z.centroid[1], z.centroid[0]], z: 12 }, { push: true })} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, padding: 'var(--s-2) 0', cursor: 'pointer', font: 'inherit', minHeight: 44 }}>
                <strong>{z.zip}</strong> · {money(z.medPrice)} median · ${z.medPpsf}/sq ft · {z.n} sales
              </button>
            </li>
          ))}
        </ol>
      )}
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.slice(0, MAX_ROWS).map((h) => (
          <li key={h.key} style={{ padding: 'var(--s-2) 0', borderBottom: '1px solid var(--border)' }}>
            <strong>{money(h.price)}</strong> · {h.beds} bd · {h.baths} ba · {h.sqft.toLocaleString()} sqft · {h.zip}
            <br />
            <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>
              {signedPct(h.dev)} vs model estimate {money(h.pred)} · sold {h.date}
            </span>
          </li>
        ))}
      </ol>
      {params.get('debug') === '1' && <DebugPanel />}
    </>
  )
}
