import { memo, type CSSProperties } from 'react'
import type { Home, IndexData } from '../data/types'
import { useLang, useT } from '../i18n'
import { money } from '../lib/format'
import { describeDev } from '../lib/model'
import { setHovered } from '../state/hoverStore'
import { RangeBar } from './RangeBar'
import { SearchLink } from './SearchLink'

interface Props {
  home: Home
  band: IndexData['model']['error_overall']
  hovered: boolean
  /** price shown (as sold, or restated to today's dollars) */
  price?: number
  /** hide the "Possibly undervalued" badge when the whole list already is (it would say the same on every card) */
  hideUnderBadge?: boolean
  style?: CSSProperties
}

/** A sale as a card: where it sold against the model estimate, then the facts. No photo exists, so the bar stands in. */
export const HomeCard = memo(function HomeCard({ home: h, band, hovered, price, hideUnderBadge, style }: Props) {
  const t = useT()
  const lang = useLang()
  const d = describeDev(h.dev, band, t)
  const shown = price ?? h.price
  const sold = new Date(h.date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', year: 'numeric' })
  const devShort = d.tone === 'below' ? t('card.below', { n: Math.round(-h.dev * 100) }) : d.tone === 'above' ? t('card.above', { n: Math.round(h.dev * 100) }) : `≈ ${Math.round(h.dev * 100)}%`
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
      <div className="card-visual">
        {(d.unusual || (d.tone === 'below' && !hideUnderBadge)) && <span className={`card-badge${d.unusual ? ' notice' : ''}`}>{d.unusual ? t('card.unusual') : t('show.under')}</span>}
        <RangeBar dev={h.dev} band={band} />
      </div>
      <div className="card-row">
        <span className="card-title">{t('card.in', { zip: h.zip })}</span>
        <span className={`dev dev-${d.tone}`}><span aria-hidden="true">{d.arrow}</span> {devShort}</span>
      </div>
      <div className="card-sub">{t('card.specs', { beds: h.beds, baths: h.baths, sqft: h.sqft.toLocaleString() })}</div>
      <div className="card-sub">{t('card.sold', { date: sold })}</div>
      <div className="card-price">
        <strong>{money(shown)}</strong>
        {price !== undefined && Math.round(price) !== h.price && <span className="was"> {t('card.was', { price: money(h.price) })}</span>}
        <span className="card-est"> · {t('card.estimateVal', { price: money(h.pred) })}</span>
      </div>
    </SearchLink>
  )
})
