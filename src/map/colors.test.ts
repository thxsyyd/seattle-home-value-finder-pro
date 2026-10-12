import { describe, expect, it } from 'vitest'
import { translate } from '../i18n'
import { BREAKS, colorFor, DEV_COLORS, legendItems, SEQ_COLORS } from './colors'

const t = (k: Parameters<typeof translate>[1], p?: Record<string, string | number>) => translate('en', k, p)

describe('map colors', () => {
  it('has one more colour than breaks for every metric', () => {
    for (const m of ['ppsf', 'price', 'dev'] as const) {
      expect(legendItems(m, t)).toHaveLength(BREAKS[m].length + 1)
    }
    expect(DEV_COLORS).toHaveLength(7)
    expect(SEQ_COLORS).toHaveLength(7)
  })
  it('maps values into the right class', () => {
    expect(colorFor('ppsf', 100)).toBe(SEQ_COLORS[0])
    expect(colorFor('ppsf', 150)).toBe(SEQ_COLORS[1])
    expect(colorFor('ppsf', 9999)).toBe(SEQ_COLORS[6])
    expect(colorFor('dev', -0.5)).toBe(DEV_COLORS[0])
    expect(colorFor('dev', 0)).toBe(DEV_COLORS[3])
  })
  it('labels every class', () => {
    expect(legendItems('ppsf', t)[0].label).toBe('< $150')
    expect(legendItems('price', t)[6].label).toBe('≥ $1.2M')
    expect(legendItems('dev', t)[3].label).toBe('−1% to +1%')
  })
})
