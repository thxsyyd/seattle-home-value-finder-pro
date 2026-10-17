import type { IndexData } from '../data/types'
import type { T } from '../i18n'
import { signedPct } from './format'

/** Sales this far below the model are more often unusual transactions than bargains. */
export const UNUSUAL_DEV = -0.4

export interface DevInfo {
  tone: 'below' | 'above' | 'near'
  arrow: '▼' | '▲' | '≈'
  text: string
  unusual: boolean
}

/** Describe how a sale compares with the model, using the model's own error band (p10..p90). */
export function describeDev(dev: number, band: IndexData['model']['error_overall'], t: T): DevInfo {
  const unusual = dev <= UNUSUAL_DEV
  if (dev <= band.p10) return { tone: 'below', arrow: '▼', text: t('dev.below', { n: Math.round(-dev * 100) }), unusual }
  if (dev > band.p90) return { tone: 'above', arrow: '▲', text: t('dev.above', { n: Math.round(dev * 100) }), unusual }
  return { tone: 'near', arrow: '≈', text: t('dev.near', { pct: signedPct(dev), lo: signedPct(band.p10), hi: signedPct(band.p90) }), unusual }
}
