import { describe, expect, it } from 'vitest'
import { breakdown, DEFAULT_LOAN, maxAffordablePrice, monthlyPI } from './finance'
import { factorFor, makePriceOf, parseAdj } from './priceIndex'
import type { Home, PriceIndex } from '../data/types'

describe('finance', () => {
  it('matches the textbook payment for $300k at 6% over 30 years', () => {
    expect(monthlyPI(300_000, 6, 30)).toBeCloseTo(1798.65, 2)
    expect(monthlyPI(120_000, 0, 10)).toBe(1000)
  })
  it('adds PMI only below 20% down', () => {
    const base = { ...DEFAULT_LOAN, price: 500_000 }
    expect(breakdown(base).pmi).toBe(0)
    expect(breakdown({ ...base, downPct: 10 }).pmi).toBeGreaterThan(0)
    const b = breakdown(base)
    expect(b.total).toBeCloseTo(b.pi + b.tax + b.ins + b.pmi + b.hoa, 6)
  })
  it('finds a price whose payment fits the budget', () => {
    const { price: _p, ...base } = { ...DEFAULT_LOAN, price: 0 }
    const p = maxAffordablePrice(150_000, 500, base)
    expect(breakdown({ ...base, price: p }).total).toBeLessThanOrEqual(Math.min(0.28 * 12_500, 0.36 * 12_500 - 500) + 1e-6)
    expect(breakdown({ ...base, price: p + 5000 }).total).toBeGreaterThan(Math.min(0.28 * 12_500, 0.36 * 12_500 - 500))
    expect(maxAffordablePrice(30_000, 3000, base)).toBe(0)
  })
})

describe('price index', () => {
  const pi = {
    metro: { series: '', asOf: '2026-07', byMonth: { '2014-06': 2.3, '2015-02': 2.2 } },
    zip: { series: '', fhfaLatestYear: 2025, rollForward: 1, factor: { '98103': { '2014': 1.8, '2015': 1.7 } }, missing: [] },
    mortgageRate: { series: '', asOf: '', pct: 7 },
  } as PriceIndex
  const h = (zip: string, date: string) => ({ zip, date, price: 100 }) as Home
  it('parses adjustment modes', () => {
    expect(parseAdj('none').kind).toBe('none')
    expect(parseAdj('x2.1')).toEqual({ kind: 'manual', mult: 2.1 })
  })
  it('uses ZIP factors and falls back to metro when missing', () => {
    expect(factorFor(h('98103', '2014-06-01'), 'zip', pi)).toEqual({ factor: 1.8, fallback: false })
    expect(factorFor(h('98004', '2015-02-03'), 'zip', pi)).toEqual({ factor: 2.2, fallback: true })
    expect(factorFor(h('98103', '2014-06-01'), 'metro', pi).factor).toBe(2.3)
    expect(makePriceOf('x2', pi)(h('98103', '2014-06-01'))).toBe(200)
    expect(makePriceOf('none', pi)(h('98103', '2014-06-01'))).toBe(100)
  })
})
