import { useState } from 'react'
import { SearchLink } from './SearchLink'
import type { IndexData } from '../data/types'
import { useT } from '../i18n'
import { BEST_DEALS } from '../lib/filters'
import { useFilters } from '../state/useFilters'

const KEY = 'hvf.intro.hidden'
const read = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Short orientation for first-time visitors. Hidden for the rest of the browser session once dismissed. */
export function IntroCard({ index }: { index: IndexData | undefined }) {
  const t = useT()
  const [, setFilters] = useFilters()
  const [hidden, setHidden] = useState(read)
  if (hidden) return null

  const m = index?.model
  // every number comes from the generated data, never typed by hand
  const err = m ? Math.round(((Math.abs(m.error_overall.p10) + m.error_overall.p90) / 2) * 100) : null
  const stats = index && m && err !== null
    ? [
        t('intro.stat.sales', { n: index.nHomes.toLocaleString() }),
        t('intro.stat.zips', { n: index.zips.length }),
        t('intro.stat.r2', { r: m.models.hgb_17_features_log_neighbors.r2.toFixed(2) }),
        t('intro.stat.err', { e: err }),
      ]
    : []
  const hide = () => {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setHidden(true)
  }

  return (
    <section className="intro" aria-labelledby="intro-title">
      <h2 id="intro-title">{t('intro.title')}</h2>
      <ol className="intro-steps">
        <li>{t('intro.step1')}</li>
        <li>{t('intro.step2')}</li>
        <li>{t('intro.step3')}</li>
      </ol>
      {stats.length > 0 && <ul className="intro-stats">{stats.map((s) => <li key={s}>{s}</li>)}</ul>}
      <div className="intro-actions">
        <button type="button" className="primary" onClick={() => setFilters({ ...BEST_DEALS, ll: [47.6, -122.25], z: 11.3 })}>{t('intro.cta')}</button>
        <SearchLink to="/about" className="secondary-link">{t('intro.how')}</SearchLink>
        <button type="button" className="linklike" onClick={hide}>{t('intro.hide')}</button>
      </div>
      <p className="credit">{t('credit')}</p>
    </section>
  )
}
