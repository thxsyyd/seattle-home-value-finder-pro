import type { IndexData } from '../data/types'
import { useT } from '../i18n'
import { signedPct } from '../lib/format'
import { barGeometry } from '../lib/rangeBar'

/**
 * Stands where a photo would: a bar from 50% below to 50% above the model estimate. The grey band is the model's
 * typical error, the tick in the middle is the estimate itself, and the dot is what the home sold for
 * (blue = below, red = above, grey = close; the same meaning as everywhere else).
 */
export function RangeBar({ dev, band }: { dev: number; band: IndexData['model']['error_overall'] }) {
  const t = useT()
  const g = barGeometry(dev, band)
  const tone = dev < band.p10 ? 'below' : dev > band.p90 ? 'above' : 'near'
  const label = t('card.range', { pct: signedPct(dev), lo: signedPct(band.p10), hi: signedPct(band.p90) })
  return (
    <div className="rbar" role="img" aria-label={label}>
      <div className="rbar-track">
        <span className="rbar-band" style={{ left: `${g.bandLeft}%`, width: `${g.bandWidth}%` }} />
        <span className="rbar-centre" style={{ left: `${g.centre}%` }} />
        <span className={`rbar-dot rbar-${tone}${g.clamped ? ' clamped' : ''}`} style={{ left: `${g.marker}%` }} />
      </div>
      <div className="rbar-axis" aria-hidden="true">
        <span>−50%</span>
        <span>{t('card.estimate')}</span>
        <span>+50%</span>
      </div>
    </div>
  )
}
