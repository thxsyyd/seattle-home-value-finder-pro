import { describe, expect, it } from 'vitest'
import { applyFilters, DEFAULT_BUDGET, DEFAULTS, effectiveDv, moreFilterCount, parseFilters, UNDER_DEV_FALLBACK } from './filters'

const p = (s: string) => new URLSearchParams(s)

describe('filter URL codec', () => {
  it('opens on the starting view for an empty query and writes an empty query back', () => {
    const f = parseFilters(p(''))
    expect(f).toMatchObject({ maxp: DEFAULT_BUDGET, show: 'under', sort: 'dev', layer: 'none', metric: 'ppsf', adj: 'none', view: 'map', follow: true })
    expect(applyFilters(p(''), f).toString()).toBe('')
  })

  it('writes "no limit" as maxp=any and reads it back', () => {
    const f = parseFilters(p('maxp=any'))
    expect(f.maxp).toBeUndefined()
    expect(applyFilters(p(''), f).get('maxp')).toBe('any')
    expect(parseFilters(applyFilters(p(''), f)).maxp).toBeUndefined()
  })

  it('keeps show=all and a custom budget; omits the default budget', () => {
    expect(applyFilters(p(''), parseFilters(p('show=all&maxp=750000'))).toString()).toBe('maxp=750000&show=all')
    expect(applyFilters(p(''), parseFilters(p('maxp=500000'))).has('maxp')).toBe(false)
  })

  it('round-trips a full set of filters', () => {
    const q = 'minp=200000&maxp=750000&beds=3&baths=2&sf=1000-2500&yb=1950-&gr=8&wf=1&dv=-10&show=all&sort=price&layer=zip&metric=dev&adj=x2.1&ll=47.6062%2C-122.3321&z=11.5&view=list&follow=0'
    const f = parseFilters(p(q))
    expect(f).toMatchObject({ minp: 200000, maxp: 750000, beds: 3, baths: 2, sfMin: 1000, sfMax: 2500, ybMin: 1950, gr: 8, wf: true, dv: -0.1, show: 'all', follow: false })
    expect(f.ybMax).toBeUndefined()
    expect(parseFilters(applyFilters(p(''), f))).toEqual(f)
  })

  it('falls back to defaults for invalid values', () => {
    const f = parseFilters(p('minp=abc&beds=-2&sort=bogus&layer=3d&adj=evil&ll=1,2,3&z=99&view=x&show=maybe&maxp=lots'))
    expect(f.minp).toBeUndefined()
    expect(f.beds).toBeUndefined()
    expect(f).toMatchObject({ sort: DEFAULTS.sort, layer: DEFAULTS.layer, adj: 'none', view: 'map', show: 'under' })
    expect(f.maxp).toBeUndefined() // an unreadable number falls back to "no limit", not to a silent filter
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
})

describe('derived values', () => {
  it('uses the model\'s own p10 error for "possibly undervalued", nothing for "all", and lets an old dv link win', () => {
    expect(effectiveDv(parseFilters(p('')), -0.1645)).toBe(-0.1645)
    expect(effectiveDv(parseFilters(p('show=all')), -0.1645)).toBeUndefined()
    expect(effectiveDv(parseFilters(p('dv=-20')), -0.1645)).toBe(-0.2)
  })
  it('falls back to a fixed threshold until the index has loaded', () => {
    expect(effectiveDv(parseFilters(p('')))).toBe(UNDER_DEV_FALLBACK)
  })
  it('counts only the filters hidden under "More filters"', () => {
    expect(moreFilterCount(parseFilters(p('beds=2&maxp=any&show=all&sort=price&ll=47.6,-122.3&z=11')))).toBe(0)
    expect(moreFilterCount(parseFilters(p('baths=2&gr=7&adj=metro&minp=100000')))).toBe(4)
  })
})
