import type { BBox, Home } from '../data/types'
import type { Filters, SortKey } from './filters'
import { pointInBbox } from './geo'

export type PriceOf = (h: Home) => number

const asSold: PriceOf = (h) => h.price

export function filterHomes(homes: Home[], f: Filters, priceOf: PriceOf = asSold): Home[] {
  return homes.filter((h) => {
    const p = priceOf(h)
    if (f.minp !== undefined && p < f.minp) return false
    if (f.maxp !== undefined && p > f.maxp) return false
    if (f.beds !== undefined && h.beds < f.beds) return false
    if (f.baths !== undefined && h.baths < f.baths) return false
    if (f.sfMin !== undefined && h.sqft < f.sfMin) return false
    if (f.sfMax !== undefined && h.sqft > f.sfMax) return false
    if (f.ybMin !== undefined && h.yearBuilt < f.ybMin) return false
    if (f.ybMax !== undefined && h.yearBuilt > f.ybMax) return false
    if (f.gr !== undefined && h.grade < f.gr) return false
    if (f.wf && !h.waterfront) return false
    if (f.dv !== undefined && h.dev > f.dv) return false
    return true
  })
}

export const inBbox = (homes: Home[], b: BBox) => homes.filter((h) => pointInBbox(h.lon, h.lat, b))

export function sortHomes(homes: Home[], sort: SortKey, priceOf: PriceOf = asSold): Home[] {
  const key: Record<SortKey, (h: Home) => number> = {
    dev: (h) => h.dev,
    price: (h) => priceOf(h),
    ppsf: (h) => priceOf(h) / h.sqft,
    newest: (h) => -Date.parse(h.date),
    sqft: (h) => -h.sqft,
  }
  const k = key[sort]
  return [...homes].sort((a, b) => k(a) - k(b) || (a.key < b.key ? -1 : 1))
}

/** Counts per `step`-wide price bin, last bin collecting everything above `top`. */
export function histogram(prices: number[], step: number, top: number): number[] {
  const bins = new Array<number>(Math.ceil(top / step)).fill(0)
  for (const p of prices) bins[Math.min(bins.length - 1, Math.floor(p / step))]++
  return bins
}
