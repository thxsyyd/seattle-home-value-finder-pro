import { useOutletContext, useParams } from 'react-router'
import { SearchLink } from '../components/SearchLink'
import { money, signedPct } from '../lib/format'
import { useFilters } from '../state/useFilters'
import type { ExploreContext } from './Explore'

export function ZipDetail() {
  const { zip } = useParams()
  const { index } = useOutletContext<ExploreContext>()
  const [, setFilters] = useFilters()
  const row = index?.zips.find((z) => z.zip === zip)

  return (
    <div className="panel-pad detail">
      <SearchLink to="/" className="backlink">← Back to results</SearchLink>
      <h1>ZIP {zip}</h1>
      {!index && <p>Loading…</p>}
      {index && !row && <p>No sales from this ZIP are in the data.</p>}
      {row && (
        <>
          <dl>
            <dt>Sales</dt><dd>{row.n.toLocaleString()}</dd>
            <dt>Median price</dt><dd>{money(row.medPrice)}</dd>
            <dt>Median $ per sq ft</dt><dd>${row.medPpsf}</dd>
            <dt>Median vs. model</dt><dd>{signedPct(row.medDev, 1)}</dd>
            <dt>Sold ≥10% below model</dt><dd>{Math.round(row.pctBelow * 100)}% of sales</dd>
          </dl>
          <button type="button" onClick={() => setFilters({ ll: [row.centroid[1], row.centroid[0]], z: 12.5 })}>Show on map</button>
        </>
      )}
    </div>
  )
}
