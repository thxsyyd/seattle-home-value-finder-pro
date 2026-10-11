import { describe, expect, it } from 'vitest'
import { activeFilterCount, applyFilters, DEFAULTS, parseFilters } from './filters'

const p = (s: string) => new URLSearchParams(s)

describe('filter URL codec', () => {
  it('has all defaults for an empty query and writes an empty query back', () => {
    const f = parseFilters(p(''))
    expect(f).toMatchObject({ sort: 'dev', layer: 'hex', metric: 'ppsf', adj: 'none', view: 'map', follow: true })
    expect(applyFilters(p(''), f).toString()).toBe('')
  })

  it('round-trips a full set of filters', () => {
    const q = 'minp=200000&maxp=750000&beds=3&baths=2&sf=1000-2500&yb=1950-&gr=8&wf=1&dv=-10&sort=price&layer=zip&metric=dev&adj=x2.1&ll=47.6062%2C-122.3321&z=11.5&view=list&follow=0'
    const f = parseFilters(p(q))
    expect(f).toMatchObject({ minp: 200000, maxp: 750000, beds: 3, baths: 2, sfMin: 1000, sfMax: 2500, ybMin: 1950, gr: 8, wf: true, dv: -0.1, follow: false })
    expect(f.ybMax).toBeUndefined()
    expect(parseFilters(applyFilters(p(''), f))).toEqual(f)
  })

  it('falls back to defaults for invalid values', () => {
    const f = parseFilters(p('minp=abc&beds=-2&sort=bogus&layer=3d&adj=evil&ll=1,2,3&z=99&view=x'))
    expect(f.minp).toBeUndefined()
    expect(f.beds).toBeUndefined()
    expect(f).toMatchObject({ sort: DEFAULTS.sort, layer: DEFAULTS.layer, adj: 'none', view: 'map' })
    expect(f.ll).toBeUndefined()
    expect(f.z).toBeUndefined()
  })

  it('fixes inverted ranges by swapping', () => {
    const f = parseFilters(p('minp=900000&maxp=300000&sf=3000-1000'))
    expect([f.minp, f.maxp, f.sfMin, f.sfMax]).toEqual([300000, 900000, 1000, 3000])
  })

  it('keeps unrelated params and omits defaults', () => {
    const out = applyFilters(p('debug=1&beds=2'), { ...parseFilters(p('beds=2')), sort: 'price' })
    expect(out.get('debug')).toBe('1')
    expect(out.get('sort')).toBe('price')
    expect(out.has('layer')).toBe(false)
  })

  it('counts active filters but not view state', () => {
    expect(activeFilterCount(parseFilters(p('beds=2&gr=7&sort=price&ll=47.6,-122.3&z=11')))).toBe(2)
  })
})
