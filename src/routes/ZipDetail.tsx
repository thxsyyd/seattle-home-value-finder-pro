import { lazy, Suspense } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { SearchLink } from '../components/SearchLink'
import { useZipHomes } from '../data/useZipHomes'
import { money, signedPct } from '../lib/format'
import { useFilters } from '../state/useFilters'
import type { ExploreContext } from './Explore'

const ZipCharts = lazy(() => import('../components/ZipCharts'))

export function ZipDetail() {
  const { zip } = useParams()
  const { index } = useOutletContext<ExploreContext>()
  const [, setFilters] = useFilters()
  const navigate = useNavigate()
  const row = index?.zips.find((z) => z.zip === zip)
  const homes = useZipHomes(row ? zip : undefined, index)

  return (
    <div className="panel-pad detail">
      <SearchLink to="/" className="backlink">← Back to results</SearchLink>
      <h1>ZIP {zip}</h1>
      {!index && <p>Loading…</p>}
      {index && !row && <p>No sales from this ZIP are in the data.</p>}
      {row && index && (
        <>
          <dl>
            <dt>Sales</dt><dd>{row.n.toLocaleString()}</dd>
            <dt>Median price</dt><dd>{money(row.medPrice)}</dd>
            <dt>Median $ per sq ft</dt><dd>${row.medPpsf}</dd>
            <dt>Median vs. model</dt><dd>{signedPct(row.medDev, 1)}</dd>
            <dt>Sold ≥10% below model</dt><dd>{Math.round(row.pctBelow * 100)}% of sales</dd>
          </dl>
          <p style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="secondary" onClick={() => setFilters({ ll: [row.centroid[1], row.centroid[0]], z: 12.5 })}>Show on map</button>
            <label>
              Compare with{' '}
              <select
                value=""
                onChange={(e) => e.target.value && navigate({ pathname: `/compare/${zip}/${e.target.value}`, search: location.search })}
                style={{ minHeight: 40, font: 'inherit' }}
              >
                <option value="">Choose a ZIP…</option>
                {index.zips.filter((z) => z.zip !== zip).map((z) => <option key={z.zip} value={z.zip}>{z.zip}</option>)}
              </select>
            </label>
          </p>
          {homes.data && (
            <Suspense fallback={<p>Loading charts…</p>}>
              <ZipCharts series={[{ name: `ZIP ${zip}`, color: '#0b5cad', homes: homes.data }]} />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}
