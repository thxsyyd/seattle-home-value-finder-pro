import type { Home, PriceIndex } from '../data/types'
import type { PriceOf } from './query'

export type AdjKind = 'none' | 'metro' | 'zip' | 'manual'

export function parseAdj(adj: string): { kind: AdjKind; mult?: number } {
  if (adj === 'metro' || adj === 'zip') return { kind: adj }
  const m = /^x(\d+(\.\d+)?)$/.exec(adj)
  if (m) return { kind: 'manual', mult: Number(m[1]) }
  return { kind: 'none' }
}

/**
 * Multiplier that restates a 2014-15 sale price in today's dollars.
 *  metro:  Case-Shiller Seattle, latest / month of sale.
 *  zip:    FHFA ZIP5 (annual) rolled forward with Case-Shiller; ZIPs without a usable FHFA value fall back to metro.
 *  manual: a user-chosen multiplier ("x2.1").
 */
export function factorFor(h: Home, adj: string, pi: PriceIndex | undefined): { factor: number; fallback: boolean } {
  const a = parseAdj(adj)
  if (a.kind === 'none' || !pi) return { factor: 1, fallback: false }
  if (a.kind === 'manual') return { factor: a.mult ?? 1, fallback: false }
  const metro = pi.metro.byMonth[h.date.slice(0, 7)] ?? 1
  if (a.kind === 'metro') return { factor: metro, fallback: false }
  const z = pi.zip.factor[h.zip]?.[h.date.slice(0, 4)]
  return z ? { factor: z, fallback: false } : { factor: metro, fallback: true }
}

export function makePriceOf(adj: string, pi: PriceIndex | undefined): PriceOf {
  if (parseAdj(adj).kind === 'none' || !pi) return (h) => h.price
  return (h) => h.price * factorFor(h, adj, pi).factor
}

export function adjSummary(adj: string, pi: PriceIndex | undefined): string {
  const a = parseAdj(adj)
  if (a.kind === 'none' || !pi) return 'Prices as sold in 2014–15'
  if (a.kind === 'manual') return `Prices × ${a.mult} (your multiplier)`
  if (a.kind === 'metro') return `Prices in ${pi.metro.asOf} dollars (Seattle Case-Shiller index)`
  return `Prices in ${pi.metro.asOf} dollars (FHFA ZIP index; Seattle index where unavailable)`
}
