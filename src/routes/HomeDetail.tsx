import { useEffect } from 'react'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import { MortgageCalc } from '../components/MortgageCalc'
import { RangeBar } from '../components/RangeBar'
import { SearchLink } from '../components/SearchLink'
import { SimilarRow } from '../components/SimilarRow'
import { useHome, useSimilar } from '../data/useHome'
import { useT } from '../i18n'
import { homeLabel, median, readFrom } from '../lib/backTarget'
import { money, signedPct } from '../lib/format'
import { describeDev } from '../lib/model'
import { factorFor } from '../lib/priceIndex'
import { useFocusOnMount } from '../lib/useFocusOnMount'
import { useHovered } from '../state/hoverStore'
import { listMemory } from '../state/listMemory'
import type { ExploreContext } from './Explore'

export function HomeDetail() {
  const { id } = useParams()
  const t = useT()
  const navigate = useNavigate()
  const { state, search } = useLocation()
  const { index, priceOf } = useOutletContext<ExploreContext>()
  const home = useHome(id, index)
  const similar = useSimilar(home.data, index)
  const hovered = useHovered()
  const h = home.data
  const heading = useFocusOnMount<HTMLHeadingElement>(h?.key)
  const band = index?.model.error_overall
  const pi = index?.priceIndex
  const from = readFrom(state)

  // "Back" returns to where the person came from (the list, or the home they were just looking at)
  const goBack = () => navigate(-1)
  useEffect(() => {
    if (h) listMemory.opened = h.key
  }, [h])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]')) return
      const el = e.target as HTMLElement | null
      if (el?.closest('input, select, textarea, [role="dialog"]')) return
      if (from) navigate(-1)
      else navigate({ pathname: '/', search })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [from, navigate, search])

  const verdict = (() => {
    if (!h || !band) return ''
    const d = describeDev(h.dev, band, t)
    const n = Math.round(Math.abs(h.dev) * 100)
    const vars = { price: money(h.price), est: money(h.pred), n }
    const key = d.tone === 'below' ? 'home.verdict.below' : d.tone === 'above' ? 'home.verdict.above' : n === 0 ? 'home.verdict.exact' : h.dev < 0 ? 'home.verdict.nearBelow' : 'home.verdict.nearAbove'
    return t(key, vars) + (d.unusual ? t('home.verdict.unusual') : '')
  })()
  const tone = h && band ? describeDev(h.dev, band, t).tone : 'near'
  const sims = similar.data ?? []
  const here = h ? ({ kind: 'home', label: homeLabel(h.price, h.zip) } as const) : null

  return (
    <div className="panel-pad detail">
      {from ? (
        <button type="button" className="linklike backlink" onClick={goBack}>
          {from.kind === 'home' ? t('back.prev', { label: from.label }) : t('back.results')}
        </button>
      ) : (
        <SearchLink to="/" className="backlink">{t('back.results')}</SearchLink>
      )}
      {home.status === 'loading' && <p>{t('loading')}</p>}
      {home.status === 'ready' && !h && <p>{t('home.notFound')}</p>}
      {h && band && (
        <>
          <h1 ref={heading} tabIndex={-1}>{money(h.price)}</h1>
          <p className={`verdict verdict-${tone}`}>{verdict}</p>
          <div className="detail-bar"><RangeBar dev={h.dev} band={band} /></div>

          <h2 className="grp">{t('home.g.home')}</h2>
          <dl>
            <dt>{t('home.bedsBaths')}</dt><dd>{h.beds} / {h.baths}</dd>
            <dt>{t('home.area')}</dt><dd>{t('home.areaVal', { sqft: h.sqft.toLocaleString(), ppsf: Math.round(h.price / h.sqft) })}</dd>
            <dt>{t('home.lot')}</dt><dd>{t(h.floors === 1 ? 'home.lot1' : 'home.lotN', { lot: h.lot.toLocaleString(), floors: h.floors })}</dd>
            <dt>{t('home.built')}</dt><dd>{h.yearReno ? t('home.renovated', { y: h.yearBuilt, r: h.yearReno }) : h.yearBuilt}</dd>
          </dl>

          <h2 className="grp">{t('home.g.price')}</h2>
          <dl>
            <dt>{t('home.sold')}</dt><dd>{h.date}</dd>
            <dt>{t('home.soldPrice')}</dt><dd>{money(h.price)}</dd>
            <dt>{t('home.estimate')}</dt><dd>{t('home.estimateVal', { est: money(h.pred) })}</dd>
            <dt>{t('home.gap')}</dt><dd>{money(h.price - h.pred)} ({signedPct(h.dev)})</dd>
          </dl>
          {pi && (() => {
            const m = factorFor(h, 'metro', pi)
            const z = factorFor(h, 'zip', pi)
            const vals = [h.price * m.factor, h.price * z.factor]
            return (
              <>
                <p className="hint">{t('home.todayShort', { asOf: pi.metro.asOf, lo: money(Math.round(Math.min(...vals) / 1000) * 1000), hi: money(Math.round(Math.max(...vals) / 1000) * 1000) })}</p>
                <details className="explain">
                  <summary>{t('home.how.q')}</summary>
                  <p>{t('home.how.estimate', { lin: money(h.predLin) })}</p>
                  <p>{t('home.how.today', { m: money(h.price * m.factor), mf: m.factor.toFixed(2), z: money(h.price * z.factor), zf: z.factor.toFixed(2), fallback: z.fallback ? t('home.todayFallback') : '' })}</p>
                </details>
              </>
            )
          })()}
          {pi && (
            <details className="calc-details">
              <summary>{t('home.calc', { rate: pi.mortgageRate.pct })}</summary>
              <MortgageCalc price={priceOf(h) === h.price ? h.price * factorFor(h, 'metro', pi).factor : priceOf(h)} ratePct={pi.mortgageRate.pct} />
            </details>
          )}

          <h2 className="grp">{t('home.g.other')}</h2>
          <dl>
            <dt>{t('home.grade')}</dt><dd>{t('home.gradeVal', { g: h.grade })}</dd>
            <dt>{t('home.cond')}</dt><dd>{t('home.condVal', { c: h.condition })}</dd>
            <dt>{t('home.view')}</dt><dd>{t('home.viewVal', { v: h.view })}</dd>
            <dt>{t('home.wf')}</dt><dd>{h.waterfront ? t('yes') : t('no')}</dd>
            <dt>{t('home.zip')}</dt><dd><SearchLink to={`/zip/${h.zip}`}>{h.zip}</SearchLink></dd>
          </dl>
          <p className="hint">{t('home.hint', { p10: signedPct(band.p10), p90: signedPct(band.p90) })}</p>

          <h2 className="grp">{t('home.similar')}</h2>
          <p className="hint">{t('home.similarHint')}</p>
          {similar.status === 'loading' && <p>{t('loading')}</p>}
          {sims.length > 0 && (
            <p className="hint">
              {t('home.similarSummary', {
                lo: money(Math.min(...sims.map(priceOf))),
                hi: money(Math.max(...sims.map(priceOf))),
                mid: money(median(sims.map(priceOf))),
              })}
            </p>
          )}
          <ul className="sim-list">
            <li><SimilarRow home={h} band={band} price={priceOf(h)} hovered={false} from={here!} current /></li>
            {sims.map((s) => (
              <li key={s.key}>
                <SimilarRow home={s} band={band} price={priceOf(s)} hovered={hovered === s.key} from={here!} />
                <SearchLink to={`/compare/${h.key}/${s.key}`} className="backlink sim-compare">{t('home.compare')}</SearchLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
