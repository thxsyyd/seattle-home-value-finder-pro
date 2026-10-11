export type SortKey = 'dev' | 'price' | 'ppsf' | 'newest' | 'sqft'
export type LayerKey = 'hex' | 'zip' | 'dots'
export type MetricKey = 'ppsf' | 'price' | 'dev'
export type ViewKey = 'map' | 'list'

export interface Filters {
  minp?: number
  maxp?: number
  beds?: number
  baths?: number
  sfMin?: number
  sfMax?: number
  ybMin?: number
  ybMax?: number
  gr?: number
  wf?: boolean
  /** maximum deviation from the model as a fraction: -0.1 keeps homes sold at least 10% below the estimate */
  dv?: number
  sort: SortKey
  layer: LayerKey
  metric: MetricKey
  /** price basis: "none" (as sold), "metro", "zip", or a manual multiplier like "x2.1" */
  adj: string
  /** map centre [lat, lon] and zoom */
  ll?: [number, number]
  z?: number
  view: ViewKey
  follow: boolean
}

export const DEFAULTS: Filters = { sort: 'dev', layer: 'hex', metric: 'ppsf', adj: 'none', view: 'map', follow: true }

const SORTS: SortKey[] = ['dev', 'price', 'ppsf', 'newest', 'sqft']
const LAYERS: LayerKey[] = ['hex', 'zip', 'dots']
const METRICS: MetricKey[] = ['ppsf', 'price', 'dev']
const VIEWS: ViewKey[] = ['map', 'list']

/** Keys this module owns; anything else in the query string (e.g. debug) is left alone. */
export const FILTER_KEYS = ['minp', 'maxp', 'beds', 'baths', 'sf', 'yb', 'gr', 'wf', 'dv', 'sort', 'layer', 'metric', 'adj', 'll', 'z', 'view', 'follow']

const num = (s: string | null): number | undefined => {
  if (s === null || s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}
const oneOf = <T extends string>(s: string | null, all: T[], dflt: T): T => (all.includes(s as T) ? (s as T) : dflt)

function range(s: string | null): [number | undefined, number | undefined] {
  if (!s) return [undefined, undefined]
  const [a, b] = s.split('-', 2)
  return [num(a ?? null), num(b ?? null)]
}

const nonNeg = (n: number | undefined) => (n !== undefined && n >= 0 ? n : undefined)

export function parseFilters(p: URLSearchParams): Filters {
  let minp = nonNeg(num(p.get('minp')))
  let maxp = nonNeg(num(p.get('maxp')))
  if (minp !== undefined && maxp !== undefined && maxp < minp) [minp, maxp] = [maxp, minp]
  let [sfMin, sfMax] = range(p.get('sf'))
  if (sfMin !== undefined && sfMax !== undefined && sfMax < sfMin) [sfMin, sfMax] = [sfMax, sfMin]
  let [ybMin, ybMax] = range(p.get('yb'))
  if (ybMin !== undefined && ybMax !== undefined && ybMax < ybMin) [ybMin, ybMax] = [ybMax, ybMin]

  const llRaw = p.get('ll')?.split(',').map(Number)
  const ll = llRaw && llRaw.length === 2 && llRaw.every(Number.isFinite) && Math.abs(llRaw[0]) <= 90 && Math.abs(llRaw[1]) <= 180
    ? ([llRaw[0], llRaw[1]] as [number, number]) : undefined
  const z = num(p.get('z'))
  const dvPct = num(p.get('dv'))
  const adj = p.get('adj') ?? DEFAULTS.adj

  return {
    minp, maxp,
    beds: nonNeg(num(p.get('beds'))),
    baths: nonNeg(num(p.get('baths'))),
    sfMin: nonNeg(sfMin), sfMax: nonNeg(sfMax),
    ybMin, ybMax,
    gr: nonNeg(num(p.get('gr'))),
    wf: p.get('wf') === '1' ? true : undefined,
    dv: dvPct === undefined ? undefined : dvPct / 100,
    sort: oneOf(p.get('sort'), SORTS, DEFAULTS.sort),
    layer: oneOf(p.get('layer'), LAYERS, DEFAULTS.layer),
    metric: oneOf(p.get('metric'), METRICS, DEFAULTS.metric),
    adj: /^(none|metro|zip|x\d+(\.\d+)?)$/.test(adj) ? adj : DEFAULTS.adj,
    ll,
    z: z !== undefined && z >= 0 && z <= 22 ? z : undefined,
    view: oneOf(p.get('view'), VIEWS, DEFAULTS.view),
    follow: p.get('follow') !== '0',
  }
}

const r = (lo?: number, hi?: number) => (lo === undefined && hi === undefined ? null : `${lo ?? ''}-${hi ?? ''}`)

/** Write filters into a copy of `base`: defaults are omitted so URLs stay short; unknown params are kept. */
export function applyFilters(base: URLSearchParams, f: Filters): URLSearchParams {
  const p = new URLSearchParams(base)
  FILTER_KEYS.forEach((k) => p.delete(k))
  const set = (k: string, v: string | number | null | undefined) => {
    if (v !== null && v !== undefined) p.set(k, String(v))
  }
  set('minp', f.minp)
  set('maxp', f.maxp)
  set('beds', f.beds)
  set('baths', f.baths)
  set('sf', r(f.sfMin, f.sfMax))
  set('yb', r(f.ybMin, f.ybMax))
  set('gr', f.gr)
  if (f.wf) p.set('wf', '1')
  if (f.dv !== undefined) set('dv', Math.round(f.dv * 100))
  if (f.sort !== DEFAULTS.sort) p.set('sort', f.sort)
  if (f.layer !== DEFAULTS.layer) p.set('layer', f.layer)
  if (f.metric !== DEFAULTS.metric) p.set('metric', f.metric)
  if (f.adj !== DEFAULTS.adj) p.set('adj', f.adj)
  if (f.ll) p.set('ll', `${f.ll[0].toFixed(4)},${f.ll[1].toFixed(4)}`)
  if (f.z !== undefined) p.set('z', f.z.toFixed(2).replace(/\.?0+$/, ''))
  if (f.view !== DEFAULTS.view) p.set('view', f.view)
  if (!f.follow) p.set('follow', '0')
  return p
}

/** The "Best deals under $500k" preset (replaces the old strict default). */
export const BEST_DEALS: Partial<Filters> = { maxp: 500_000, dv: -0.1 }

/** Number of active (non-default, non-viewport) filters, for the "Filters (3)" badge. */
export function activeFilterCount(f: Filters): number {
  return [f.minp, f.maxp, f.beds, f.baths, f.sfMin ?? f.sfMax, f.ybMin ?? f.ybMax, f.gr, f.wf, f.dv].filter((v) => v !== undefined).length + (f.adj !== 'none' ? 1 : 0)
}
