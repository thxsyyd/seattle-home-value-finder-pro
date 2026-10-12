import { describe, expect, it } from 'vitest'
import type { Home } from '../data/types'
import { DEFAULTS, type Filters } from './filters'
import { histogram, inBbox, filterHomes, sortHomes } from './query'
import { money, priceShort, signedPct } from './format'
import { viewBbox } from './geo'

const home = (o: Partial<Home>): Home => ({
  key: 'k', zip: '98103', date: '2014-06-01', price: 500000, pred: 520000, predLin: 510000, dev: -0.04, beds: 3, baths: 2,
  sqft: 1500, lot: 4000, floors: 1, waterfront: 0, view: 0, condition: 3, grade: 7, yearBuilt: 1960, yearReno: 0,
  lat: 47.65, lon: -122.34, sim: [], ...o,
})
// DEFAULTS carry the app's starting budget and "possibly undervalued" view; these tests want an open filter set
const F = (o: Partial<Filters>): Filters => ({ ...DEFAULTS, maxp: undefined, show: 'all', ...o })

describe('filterHomes', () => {
  const homes = [
    home({ key: 'a', price: 300000, beds: 2, dev: -0.2 }),
    home({ key: 'b', price: 600000, beds: 4, waterfront: 1, dev: 0.05, grade: 10 }),
    home({ key: 'c', price: 450000, beds: 3, dev: -0.12, yearBuilt: 1925 }),
  ]
  it('applies each filter', () => {
    expect(filterHomes(homes, F({ maxp: 450000 })).map((h) => h.key)).toEqual(['a', 'c'])
    expect(filterHomes(homes, F({ beds: 3 })).map((h) => h.key)).toEqual(['b', 'c'])
    expect(filterHomes(homes, F({ wf: true })).map((h) => h.key)).toEqual(['b'])
    expect(filterHomes(homes, F({ dv: -0.1 })).map((h) => h.key)).toEqual(['a', 'c'])
    expect(filterHomes(homes, F({ gr: 9 })).map((h) => h.key)).toEqual(['b'])
    expect(filterHomes(homes, F({ ybMin: 1950 })).map((h) => h.key)).toEqual(['a', 'b'])
  })
  it('sorts unusually large gaps after ordinary ones', () => {
    const hs = [home({ key: 'odd', dev: -0.6 }), home({ key: 'a', dev: -0.2 }), home({ key: 'b', dev: 0.1 })]
    expect(sortHomes(hs, 'dev').map((h) => h.key)).toEqual(['a', 'b', 'odd'])
  })
  it('can filter on an adjusted price basis', () => {
    expect(filterHomes(homes, F({ maxp: 700000 }), (h) => h.price * 2).map((h) => h.key)).toEqual(['a'])
  })
  it('sorts by deviation and is stable on ties', () => {
    expect(sortHomes(homes, 'dev').map((h) => h.key)).toEqual(['a', 'c', 'b'])
    expect(sortHomes([home({ key: 'z' }), home({ key: 'y' })], 'price').map((h) => h.key)).toEqual(['y', 'z'])
  })
})

describe('geo and format helpers', () => {
  it('viewBbox is centred and shrinks as zoom grows', () => {
    const lo = viewBbox(47.6, -122.3, 10)
    const hi = viewBbox(47.6, -122.3, 12)
    expect((lo[0] + lo[2]) / 2).toBeCloseTo(-122.3, 4)
    expect(hi[2] - hi[0]).toBeCloseTo((lo[2] - lo[0]) / 4, 4)
    expect(inBbox([home({ lat: 47.6, lon: -122.3 }), home({ lat: 10, lon: 10 })], lo)).toHaveLength(1)
  })
  it('formats prices and percents', () => {
    expect([priceShort(840000), priceShort(1_200_000), priceShort(2_000_000), priceShort(950)]).toEqual(['$840k', '$1.2M', '$2M', '$950'])
    expect([signedPct(0.123), signedPct(-0.5), signedPct(0.001)]).toEqual(['+12%', '−50%', '0%'])
  })
  it('formats money including negatives', () => {
    expect([money(1234567), money(-191837.4)]).toEqual(['$1,234,567', '−$191,837'])
  })
  it('bins prices with an overflow bin', () => {
    expect(histogram([10, 60, 70, 5000], 50, 150)).toEqual([1, 2, 1])
  })
})
