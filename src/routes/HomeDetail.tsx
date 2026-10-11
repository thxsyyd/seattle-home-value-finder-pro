import { useFocusOnMount } from '../lib/useFocusOnMount'
import { useOutletContext, useParams } from 'react-router'
import { HomeCard } from '../components/HomeCard'
import { SearchLink } from '../components/SearchLink'
import { useHome, useSimilar } from '../data/useHome'
import { MortgageCalc } from '../components/MortgageCalc'
import { factorFor } from '../lib/priceIndex'
import { money, signedPct } from '../lib/format'
import { describeDev } from '../lib/model'
import { useHovered } from '../state/hoverStore'
import type { ExploreContext } from './Explore'

export function HomeDetail() {
  const { id } = useParams()
  const { index, priceOf } = useOutletContext<ExploreContext>()
  const home = useHome(id, index)
  const similar = useSimilar(home.data, index)
  const hovered = useHovered()
  const h = home.data
  const heading = useFocusOnMount<HTMLHeadingElement>(h?.key)
  const band = index?.model.error_overall
  const pi = index?.priceIndex

  return (
    <div className="panel-pad detail">
      <SearchLink to="/" className="backlink">← Back to results</SearchLink>
      {home.status === 'loading' && <p>Loading…</p>}
      {home.status === 'ready' && !h && <p>We couldn’t find that sale. It may be from an older version of the link.</p>}
      {h && band && (
        <>
          <h1 ref={heading} tabIndex={-1}>{money(h.price)}</h1>
          <p style={{ margin: 0 }}>
            {(() => {
              const d = describeDev(h.dev, band)
              return <strong className={`dev dev-${d.tone}`}><span aria-hidden="true">{d.arrow}</span> {d.text}</strong>
            })()}
          </p>
          <dl>
            <dt>Sold</dt><dd>{h.date}</dd>
            <dt>Model estimate</dt><dd>{money(h.pred)} (course linear model: {money(h.predLin)})</dd>
            <dt>Gap</dt><dd>{money(h.price - h.pred)} ({signedPct(h.dev)})</dd>
            <dt>Bedrooms / baths</dt><dd>{h.beds} / {h.baths}</dd>
            <dt>Living area</dt><dd>{h.sqft.toLocaleString()} sq ft (${Math.round(h.price / h.sqft)} per sq ft)</dd>
            <dt>Lot</dt><dd>{h.lot.toLocaleString()} sq ft · {h.floors} floor{h.floors === 1 ? '' : 's'}</dd>
            <dt>Built</dt><dd>{h.yearBuilt}{h.yearReno ? ` · renovated ${h.yearReno}` : ''}</dd>
            <dt>Grade / condition</dt><dd>{h.grade} of 13 / {h.condition} of 5</dd>
            <dt>View / waterfront</dt><dd>{h.view} of 4 / {h.waterfront ? 'yes' : 'no'}</dd>
            <dt>ZIP</dt><dd><SearchLink to={`/zip/${h.zip}`}>{h.zip}</SearchLink></dd>
          </dl>
          {pi && (() => {
            const m = factorFor(h, 'metro', pi)
            const z = factorFor(h, 'zip', pi)
            return (
              <p className="hint">
                In {pi.metro.asOf} dollars, roughly {money(h.price * m.factor)} (Seattle index ×{m.factor.toFixed(2)}) or {money(h.price * z.factor)} (ZIP index ×{z.factor.toFixed(2)}{z.fallback ? ', Seattle index used: no ZIP value' : ''}).
                Market averages, not an appraisal.
              </p>
            )
          })()}
          {pi && (
            <details className="calc-details">
              <summary>Monthly cost at today’s price and {pi.mortgageRate.pct}% interest</summary>
              <MortgageCalc price={priceOf(h) === h.price ? h.price * factorFor(h, 'metro', pi).factor : priceOf(h)} ratePct={pi.mortgageRate.pct} />
            </details>
          )}
          <p className="hint">
            The model’s usual error is about {signedPct(band.p10)} to {signedPct(band.p90)}. It cannot see condition or finishes, so a gap is a reason to look closer, not proof of a bargain.
          </p>
          <h2 style={{ fontSize: '1.125rem' }}>Similar sales</h2>
          {similar.status === 'loading' && <p>Loading…</p>}
          <ul className="sim-list">
            {(similar.data ?? []).map((s) => (
              <li key={s.key}>
                <HomeCard home={s} band={band} hovered={hovered === s.key} price={priceOf(s)} />
                <SearchLink to={`/compare/${h.key}/${s.key}`} className="backlink">Compare with this home</SearchLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
