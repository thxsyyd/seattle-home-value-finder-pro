import { memo, type CSSProperties } from 'react'
import { useT } from '../i18n'
import type { Home } from '../data/types'
import { money } from '../lib/format'
import { describeDev } from '../lib/model'
import type { IndexData } from '../data/types'
import { setHovered } from '../state/hoverStore'
import { SearchLink } from './SearchLink'

interface Props {
  home: Home
  band: IndexData['model']['error_overall']
  hovered: boolean
  /** price shown (as sold, or restated to today's dollars) */
  price?: number
  style?: CSSProperties
}

export const HomeCard = memo(function HomeCard({ home: h, band, hovered, price, style }: Props) {
  const t = useT()
  const d = describeDev(h.dev, band, t)
  return (
    <SearchLink
      to={`/home/${h.key}`}
      className={`card${hovered ? ' is-hover' : ''}`}
      data-key={h.key}
      style={style}
      onPointerEnter={() => setHovered(h.key, 'list')}
      onPointerLeave={() => setHovered(null)}
      onFocus={() => setHovered(h.key, 'list')}
      onBlur={() => setHovered(null)}
    >
      <span className="card-price">{money(price ?? h.price)}{price !== undefined && Math.round(price) !== h.price && <small className="was"> {t('card.was', { price: money(h.price) })}</small>}</span>
      <span className={`dev dev-${d.tone}`}>
        <span aria-hidden="true">{d.arrow}</span> {d.text}
      </span>
      <span className="card-meta">
        {t('card.meta', { beds: h.beds, baths: h.baths, sqft: h.sqft.toLocaleString(), zip: h.zip, date: h.date.slice(0, 7) })}
      </span>
      {d.unusual && <span className="badge">{t('card.unusual')}</span>}
    </SearchLink>
  )
})
