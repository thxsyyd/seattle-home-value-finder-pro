import type { IndexData, Home } from '../data/types'
import { useT } from '../i18n'
import { money } from '../lib/format'
import { describeDev } from '../lib/model'
import { setHovered } from '../state/hoverStore'
import { SearchLink } from './SearchLink'
import type { From } from '../lib/backTarget'

interface Props {
  home: Home
  band: IndexData['model']['error_overall']
  price: number
  hovered: boolean
  /** shown in the Back link of the home this row opens */
  from: From
  /** the home being looked at, which this row is compared with */
  current?: boolean
}

/** One line per similar sale: no bar, no photo, just the facts needed to judge the price. */
export function SimilarRow({ home: h, band, price, hovered, from, current }: Props) {
  const t = useT()
  const d = describeDev(h.dev, band, t)
  const sold = h.date.slice(0, 7)
  const body = (
    <>
      <span className="sim-main">
        <strong>{money(price)}</strong>
        <span className={`dev dev-${d.tone}`}><span aria-hidden="true">{d.arrow}</span> {d.tone === 'below' ? t('card.below', { n: Math.round(-h.dev * 100) }) : d.tone === 'above' ? t('card.above', { n: Math.round(h.dev * 100) }) : `${h.dev < 0 ? '−' : '+'}${Math.abs(Math.round(h.dev * 100))}%`}</span>
      </span>
      <span className="sim-sub">{t('card.specs', { beds: h.beds, baths: h.baths, sqft: h.sqft.toLocaleString() })} · {t('card.sold', { date: sold })}</span>
    </>
  )
  if (current) return <div className="sim-row is-current"><span className="sim-tag">{t('home.thisHome')}</span>{body}</div>
  return (
    <SearchLink
      to={`/home/${h.key}`}
      state={{ from }}
      className={`sim-row${hovered ? ' is-hover' : ''}`}
      data-key={h.key}
      onPointerEnter={() => setHovered(h.key, 'list')}
      onPointerLeave={() => setHovered(null)}
      onFocus={() => setHovered(h.key, 'list')}
      onBlur={() => setHovered(null)}
    >
      {body}
    </SearchLink>
  )
}
