import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl'
import type { Home, IndexData } from '../data/types'
import { priceShort } from '../lib/format'
import { devRank, type PriceOf } from '../lib/query'
import { addBubbleIcons, PILL } from './bubbleIcon'

/** Data colours: blue = sold below the model estimate, red = above, grey = close. Used for nothing else. */
export const TONE = { below: '#2166ac', above: '#b2182b', near: '#8a8a8a', ink: '#222222' } as const

export const HL = {
  src: 'homes', selSrc: 'selected-home', simSrc: 'similar-homes',
  dotShadow: 'homes-dot-shadow', dots: 'homes-dots',
  pills: 'homes-pills', pillsViewed: 'homes-pills-viewed', pillsHover: 'homes-pills-hover',
  selRing: 'selected-ring', selPill: 'selected-pill',
  simRing: 'similar-ring', simHover: 'similar-ring-hover',
} as const

const BEFORE_LABELS = 'waterway_line_label' // keep place labels above the markers
const empty = { type: 'FeatureCollection', features: [] }
type Band = IndexData['model']['error_overall']

const toneColor = (below: string, above: string, near: string): ExpressionSpecification =>
  ['match', ['get', 't'], 'b', below, 'a', above, near] as unknown as ExpressionSpecification
const hover: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false]
const noneKey: ExpressionSpecification = ['==', ['get', 'key'], '__none__']

// Which pills are drawn: the key filter each layer wants, and the "far enough from the map edge" test that
// applies to all of them. Kept here because there is one map, and both halves change at different times.
let edgeFilter: ExpressionSpecification | null = null
let viewedKeys: string[] = []
let hoverKey: string | null = null
let selectedKey: string | null = null
const inEdge = (f: ExpressionSpecification): ExpressionSpecification =>
  (edgeFilter ? (['all', f, edgeFilter] as unknown as ExpressionSpecification) : f)
const keyIn = (keys: string[]): ExpressionSpecification =>
  (keys.length ? (['in', ['get', 'key'], ['literal', keys]] as unknown as ExpressionSpecification) : noneKey)

function applyPillFilters(map: MlMap): void {
  if (map.getLayer(HL.pills)) map.setFilter(HL.pills, edgeFilter)
  if (map.getLayer(HL.pillsViewed)) map.setFilter(HL.pillsViewed, inEdge(keyIn(viewedKeys)))
  const hovered = hoverKey && hoverKey !== selectedKey ? keyIn([hoverKey]) : noneKey
  if (map.getLayer(HL.pillsHover)) map.setFilter(HL.pillsHover, inEdge(hovered))
  if (map.getLayer(HL.simHover)) map.setFilter(HL.simHover, hovered)
}

/**
 * Hide price pills whose point sits within `inset` pixels of the map edge. MapLibre happily draws a pill that
 * runs off the canvas, and a half-cut price reads as a different number, so they are dropped instead.
 */
export function setPillEdge(map: MlMap, inset = 64): void {
  const { width, height } = map.getCanvas().getBoundingClientRect()
  if (width <= inset * 2 || height <= inset * 2) {
    edgeFilter = null // too small to inset: better a clipped pill than none at all
  } else {
    const corners: [number, number][] = [[inset, inset], [width - inset, inset], [width - inset, height - inset], [inset, height - inset]]
    const ring = corners.map((c) => {
      const ll = map.unproject(c)
      return [ll.lng, ll.lat]
    })
    ring.push(ring[0])
    edgeFilter = ['within', { type: 'Polygon', coordinates: [ring] }] as unknown as ExpressionSpecification
  }
  applyPillFilters(map)
}

const pillLayout = (icon: string, size = 13) => ({
  'icon-image': icon, 'icon-text-fit': 'both' as const, 'icon-text-fit-padding': [0, 0, 0, 0] as [number, number, number, number],
  'text-font': ['Noto Sans Bold'], 'text-size': size, 'text-padding': 2,
  'symbol-sort-key': ['get', 'rank'] as unknown as ExpressionSpecification,
})

export function addHomeLayers(map: MlMap): void {
  addBubbleIcons(map)
  map.addSource(HL.src, { type: 'geojson', data: empty as never, promoteId: 'key' })
  map.addSource(HL.selSrc, { type: 'geojson', data: empty as never })
  map.addSource(HL.simSrc, { type: 'geojson', data: empty as never, promoteId: 'key' })

  // 1. every sale is a dot, so nothing is ever hidden
  map.addLayer({
    id: HL.dotShadow, type: 'circle', source: HL.src,
    paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 7.5, 17, 11], 'circle-color': '#000', 'circle-opacity': 0.18, 'circle-blur': 0.6 },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.dots, type: 'circle', source: HL.src,
    paint: {
      'circle-color': toneColor(TONE.below, TONE.above, TONE.near),
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 5.5, 17, 8],
      'circle-stroke-color': ['case', hover, TONE.ink, '#ffffff'],
      'circle-stroke-width': ['case', hover, 3, 1.5],
    },
  }, BEFORE_LABELS)

  // 2. the best-ranked sales also get a price pill; MapLibre's collision detection hides the pills that do not fit,
  //    in rank order (most below the estimate first), leaving the dots underneath
  const label = ['format', ['get', 'arrow'], { 'text-color': toneColor(TONE.below, TONE.above, TONE.ink) }, ['get', 'price'], { 'text-color': TONE.ink }] as unknown as ExpressionSpecification
  map.addLayer({
    id: HL.pills, type: 'symbol', source: HL.src, minzoom: 11,
    layout: { ...pillLayout(PILL.normal), 'text-field': label, 'icon-allow-overlap': false, 'text-allow-overlap': false },
  }, BEFORE_LABELS)
  const flat = ['concat', ['get', 'arrow'], ['get', 'price']] as unknown as ExpressionSpecification
  map.addLayer({
    id: HL.pillsViewed, type: 'symbol', source: HL.src, minzoom: 11, filter: noneKey,
    layout: { ...pillLayout(PILL.viewed), 'text-field': flat, 'icon-allow-overlap': true, 'text-allow-overlap': true },
    paint: { 'text-color': '#717171' },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.pillsHover, type: 'symbol', source: HL.src, minzoom: 11, filter: noneKey,
    layout: { ...pillLayout(PILL.ink), 'text-field': flat, 'icon-allow-overlap': true, 'text-allow-overlap': true },
    paint: { 'text-color': '#ffffff' },
  }, BEFORE_LABELS)

  // 3a. the five sales most like the opened one: a grey ring each, darker while hovered in the list
  map.addLayer({
    id: HL.simRing, type: 'circle', source: HL.simSrc,
    paint: { 'circle-radius': 9, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#717171', 'circle-stroke-width': 2 },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.simHover, type: 'circle', source: HL.simSrc, filter: noneKey,
    paint: { 'circle-radius': 11, 'circle-color': 'rgba(34,34,34,0.12)', 'circle-stroke-color': TONE.ink, 'circle-stroke-width': 3 },
  }, BEFORE_LABELS)

  // 3b. the opened sale: dark ring plus a dark pill, always drawn
  map.addLayer({
    id: HL.selRing, type: 'circle', source: HL.selSrc,
    paint: { 'circle-radius': 12, 'circle-color': 'rgba(34,34,34,0.12)', 'circle-stroke-color': TONE.ink, 'circle-stroke-width': 3 },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.selPill, type: 'symbol', source: HL.selSrc,
    layout: {
      ...pillLayout(PILL.ink, 14), 'icon-anchor': 'bottom', 'icon-offset': [0, -10], 'text-anchor': 'bottom', 'text-offset': [0, -0.7],
      'text-field': flat, 'icon-allow-overlap': true, 'text-allow-overlap': true,
    },
    paint: { 'text-color': '#ffffff' },
  })
}

/** Tone and label parts for a sale. "b" below, "a" above, "n" near the model estimate. */
export function labelFor(h: Home, band: Band, priceOf: PriceOf = (x) => x.price): { t: 'b' | 'a' | 'n'; arrow: string; price: string } {
  const t = h.dev < band.p10 ? 'b' : h.dev > band.p90 ? 'a' : 'n'
  return { t, arrow: t === 'b' ? '▼ ' : t === 'a' ? '▲ ' : '', price: priceShort(priceOf(h)) }
}

const point = (h: Home, props: Record<string, unknown>) => ({
  type: 'Feature' as const, properties: props, geometry: { type: 'Point' as const, coordinates: [h.lon, h.lat] },
})

/** `listed` are the sales shown as cards: their pills get first claim on space so list and map always agree. */
export function homesGeoJSON(homes: Home[], band: Band, priceOf: PriceOf, listed: string[] = []) {
  const order = new Map(listed.map((k, i) => [k, i]))
  return {
    type: 'FeatureCollection' as const,
    features: homes.map((h) => {
      const i = order.get(h.key)
      return point(h, { key: h.key, rank: i === undefined ? devRank(h) : -100 + i, ...labelFor(h, band, priceOf) })
    }),
  }
}

export function setHomes(map: MlMap, homes: Home[], band: Band, priceOf: PriceOf, listed: string[] = []): void {
  ;(map.getSource(HL.src) as GeoJSONSource | undefined)?.setData(homesGeoJSON(homes, band, priceOf, listed) as never)
}

export function setSelected(map: MlMap, h: Home | null, band: Band, priceOf: PriceOf): void {
  const data = h ? { type: 'FeatureCollection', features: [point(h, labelFor(h, band, priceOf))] } : empty
  ;(map.getSource(HL.selSrc) as GeoJSONSource | undefined)?.setData(data as never)
  selectedKey = h?.key ?? null
  applyPillFilters(map)
}

export function setSimilar(map: MlMap, homes: Home[], band: Band, priceOf: PriceOf): void {
  const data = { type: 'FeatureCollection', features: homes.map((h) => point(h, { key: h.key, ...labelFor(h, band, priceOf) })) }
  ;(map.getSource(HL.simSrc) as GeoJSONSource | undefined)?.setData(data as never)
}

/** The pill drawn dark while its card (or the pill itself) is hovered. */
export function setHoveredPill(map: MlMap, key: string | null): void {
  hoverKey = key
  applyPillFilters(map)
}

/** Pills of sales that have already been opened turn pale grey. */
export function setViewedPills(map: MlMap, keys: string[]): void {
  viewedKeys = keys
  applyPillFilters(map)
}
