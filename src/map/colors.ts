import type { ExpressionSpecification } from 'maplibre-gl'
import type { MetricKey } from '../lib/filters'
import { priceShort, signedPct } from '../lib/format'

// Diverging: ColorBrewer RdBu (7 classes) with the three middle classes adjusted so neighbours stay at least 17 Delta E
// apart under protan/deutan/tritan simulation (scripts/cvd_check.py); blue = sold below the model estimate. Sequential: YlGnBu, last 7 of 9.
export const DEV_COLORS = ['#2166ac', '#67a9cf', '#b0d0e6', '#efefef', '#f9cdb1', '#ef8a62', '#b2182b']
export const SEQ_COLORS = ['#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58']
export const NO_DATA = '#cfd3d8'

export const BREAKS: Record<MetricKey, number[]> = {
  ppsf: [150, 200, 250, 300, 400, 500],
  price: [250_000, 350_000, 450_000, 600_000, 800_000, 1_200_000],
  // Area medians of (price / model - 1) span only about ±8%, so area classes are much tighter than the
  // per-home classes below (which follow the model's ±17% error band).
  dev: [-0.06, -0.03, -0.01, 0.01, 0.03, 0.06],
}

export const HOME_DEV_BREAKS = [-0.3, -0.15, -0.05, 0.05, 0.15, 0.3]

/** GeoJSON property that carries each metric (same short keys on hexagons and joined zip polygons). */
export const PROP: Record<MetricKey, string> = { ppsf: 'p', price: 'm', dev: 'd' }

export const palette = (m: MetricKey) => (m === 'dev' ? DEV_COLORS : SEQ_COLORS)

export function colorFor(m: MetricKey, v: number): string {
  const b = BREAKS[m]
  let i = 0
  while (i < b.length && v >= b[i]) i++
  return palette(m)[i]
}

export function fillColorExpression(m: MetricKey): ExpressionSpecification {
  const b = BREAKS[m]
  const c = palette(m)
  const step: unknown[] = ['step', ['get', PROP[m]], c[0]]
  b.forEach((v, i) => step.push(v, c[i + 1]))
  return ['case', ['==', ['get', 'g'], 1], NO_DATA, step] as unknown as ExpressionSpecification
}

export const metricTitle: Record<MetricKey, string> = {
  ppsf: 'Median $ per sq ft',
  price: 'Median sale price',
  dev: 'Median sold vs. model estimate',
}

/** All seven classes, with labels, for the legend. */
export function legendItems(m: MetricKey): { color: string; label: string }[] {
  const b = BREAKS[m]
  const fmt = m === 'ppsf' ? (v: number) => `$${v}` : m === 'price' ? priceShort : (v: number) => signedPct(v)
  return palette(m).map((color, i) => {
    const label =
      i === 0 ? `< ${fmt(b[0])}` : i === b.length ? `≥ ${fmt(b[i - 1])}` : `${fmt(b[i - 1])} to ${fmt(b[i])}`
    return { color, label }
  })
}
