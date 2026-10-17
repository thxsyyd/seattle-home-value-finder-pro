export type SortKey = 'dev' | 'price' | 'ppsf' | 'newest' | 'sqft'
/** Optional area colouring under the markers: none (default), smoothed hexagons, or ZIP-code areas. */
export type LayerKey = 'none' | 'hex' | 'zip'
export type MetricKey = 'ppsf' | 'price' | 'dev'
export type ViewKey = 'map' | 'list'
/** "under" keeps only sales further below the estimate than the model's own usual error; "all" shows every sale. */
export type ShowKey = 'under' | 'all'

/**
 * A sale is "possibly undervalued" when it sold further below the estimate than the model is usually wrong by,
 * i.e. below the model's own p10 error. Using one threshold for the filter and for the blue/grey split keeps
 * "possibly undervalued" and "below the estimate" meaning the same thing.
 * This constant is only the stand-in until the index (which carries the real p10) has loaded.
 */
export const UNDER_DEV_FALLBACK = -0.16
export const DEFAULT_BUDGET = 500_000

export interface Filters {
  minp?: number
  /** budget ceiling; undefined means no limit (written as maxp=any in the URL) */
  maxp?: number
  show: ShowKey
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

export const DEFAULTS: Filters = { maxp: DEFAULT_BUDGET, show: 'under', sort: 'dev', layer: 'none', metric: 'ppsf', adj: 'none', view: 'map', follow: true }

const SORTS: SortKey[] = ['dev', 'price', 'ppsf', 'newest', 'sqft']
const LAYERS: LayerKey[] = ['none', 'hex', 'zip']
const METRICS: MetricKey[] = ['ppsf', 'price', 'dev']
const VIEWS: ViewKey[] = ['map', 'list']
const SHOWS: ShowKey[] = ['under', 'all']

/** Keys this module owns; anything else in the query string (e.g. debug) is left alone. */
export const FILTER_KEYS = ['show', 'minp', 'maxp', 'beds', 'baths', 'sf', 'yb', 'gr', 'wf', 'dv', 'sort', 'layer', 'metric', 'adj', 'll', 'z', 'view', 'follow']

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
  let maxp = p.has('maxp') ? (p.get('maxp') === 'any' ? undefined : nonNeg(num(p.get('maxp')))) : DEFAULT_BUDGET
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
    show: oneOf(p.get('show'), SHOWS, DEFAULTS.show),
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
  if (f.maxp === undefined) p.set('maxp', 'any')
  else if (f.maxp !== DEFAULT_BUDGET) p.set('maxp', String(f.maxp))
  if (f.show !== DEFAULTS.show) p.set('show', f.show)
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

/** The deviation threshold in force: an explicit `dv` (old links) wins, otherwise the model's p10 error. */
export function effectiveDv(f: Filters, p10?: number): number | undefined {
  return f.dv ?? (f.show === 'under' ? p10 ?? UNDER_DEV_FALLBACK : undefined)
}

/** Number of active filters inside "More filters" (budget, bedrooms and the show toggle are always visible). */
export function moreFilterCount(f: Filters): number {
  return [f.minp, f.baths, f.sfMin ?? f.sfMax, f.ybMin ?? f.ybMax, f.gr, f.wf].filter((v) => v !== undefined).length + (f.adj !== 'none' ? 1 : 0)
}
