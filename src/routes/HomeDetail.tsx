import { useOutletContext, useParams } from 'react-router'
import { HomeCard } from '../components/HomeCard'
import { MortgageCalc } from '../components/MortgageCalc'
import { SearchLink } from '../components/SearchLink'
import { useHome, useSimilar } from '../data/useHome'
import { useT } from '../i18n'
import { money, signedPct } from '../lib/format'
import { describeDev } from '../lib/model'
import { factorFor } from '../lib/priceIndex'
import { useFocusOnMount } from '../lib/useFocusOnMount'
import { useHovered } from '../state/hoverStore'
import type { ExploreContext } from './Explore'

export function HomeDetail() {
  const { id } = useParams()
  const t = useT()
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
      <SearchLink to="/" className="backlink">{t('back.results')}</SearchLink>
      {home.status === 'loading' && <p>{t('loading')}</p>}
      {home.status === 'ready' && !h && <p>{t('home.notFound')}</p>}
      {h && band && (
        <>
          <h1 ref={heading} tabIndex={-1}>{money(h.price)}</h1>
          <p style={{ margin: 0 }}>
            {(() => {
              const d = describeDev(h.dev, band, t)
              return <strong className={`dev dev-${d.tone}`}><span aria-hidden="true">{d.arrow}</span> {d.text}</strong>
            })()}
          </p>
          <dl>
            <dt>{t('home.sold')}</dt><dd>{h.date}</dd>
            <dt>{t('home.estimate')}</dt><dd>{t('home.estimateVal', { est: money(h.pred), lin: money(h.predLin) })}</dd>
            <dt>{t('home.gap')}</dt><dd>{money(h.price - h.pred)} ({signedPct(h.dev)})</dd>
            <dt>{t('home.bedsBaths')}</dt><dd>{h.beds} / {h.baths}</dd>
            <dt>{t('home.area')}</dt><dd>{t('home.areaVal', { sqft: h.sqft.toLocaleString(), ppsf: Math.round(h.price / h.sqft) })}</dd>
            <dt>{t('home.lot')}</dt><dd>{t(h.floors === 1 ? 'home.lot1' : 'home.lotN', { lot: h.lot.toLocaleString(), floors: h.floors })}</dd>
            <dt>{t('home.built')}</dt><dd>{h.yearReno ? t('home.renovated', { y: h.yearBuilt, r: h.yearReno }) : h.yearBuilt}</dd>
            <dt>{t('home.grade')}</dt><dd>{t('home.gradeVal', { g: h.grade, c: h.condition })}</dd>
            <dt>{t('home.view')}</dt><dd>{t('home.viewVal', { v: h.view, w: h.waterfront ? t('yes') : t('no') })}</dd>
            <dt>{t('home.zip')}</dt><dd><SearchLink to={`/zip/${h.zip}`}>{h.zip}</SearchLink></dd>
          </dl>
          {pi && (() => {
            const m = factorFor(h, 'metro', pi)
            const z = factorFor(h, 'zip', pi)
            return (
              <p className="hint">
                {t('home.today', {
                  asOf: pi.metro.asOf, m: money(h.price * m.factor), mf: m.factor.toFixed(2),
                  z: money(h.price * z.factor), zf: z.factor.toFixed(2), fallback: z.fallback ? t('home.todayFallback') : '',
                })}
              </p>
            )
          })()}
          {pi && (
            <details className="calc-details">
              <summary>{t('home.calc', { rate: pi.mortgageRate.pct })}</summary>
              <MortgageCalc price={priceOf(h) === h.price ? h.price * factorFor(h, 'metro', pi).factor : priceOf(h)} ratePct={pi.mortgageRate.pct} />
            </details>
          )}
          <p className="hint">{t('home.hint', { p10: signedPct(band.p10), p90: signedPct(band.p90) })}</p>
          <h2 style={{ fontSize: '1.125rem' }}>{t('home.similar')}</h2>
          {similar.status === 'loading' && <p>{t('loading')}</p>}
          <ul className="sim-list">
            {(similar.data ?? []).map((s) => (
              <li key={s.key}>
                <HomeCard home={s} band={band} hovered={hovered === s.key} price={priceOf(s)} />
                <SearchLink to={`/compare/${h.key}/${s.key}`} className="backlink">{t('home.compare')}</SearchLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
