import { memo, type CSSProperties } from 'react'
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
  const d = describeDev(h.dev, band)
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
      <span className="card-price">{money(price ?? h.price)}{price !== undefined && Math.round(price) !== h.price && <small className="was"> (sold {money(h.price)})</small>}</span>
      <span className={`dev dev-${d.tone}`}>
        <span aria-hidden="true">{d.arrow}</span> {d.text}
      </span>
      <span className="card-meta">
        {h.beds} bd · {h.baths} ba · {h.sqft.toLocaleString()} sqft · ZIP {h.zip} · sold {h.date.slice(0, 7)}
      </span>
      {d.unusual && <span className="badge">Unusual sale: check before trusting</span>}
    </SearchLink>
  )
})
