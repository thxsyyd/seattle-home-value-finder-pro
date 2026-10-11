import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl'
import type { Home, IndexData } from '../data/types'
import { priceShort } from '../lib/format'
import { addBubbleIcons } from './bubbleIcon'
import { DEV_COLORS, HOME_DEV_BREAKS } from './colors'

export const HL = {
  src: 'homes', selSrc: 'selected-home',
  clusters: 'homes-clusters', clusterCount: 'homes-cluster-count', circles: 'homes-circles', bubbles: 'homes-bubbles',
  selRing: 'selected-ring', selBubble: 'selected-bubble',
} as const

const BEFORE_LABELS = 'waterway_line_label' // keep road names and place labels above the markers
const empty = { type: 'FeatureCollection', features: [] }

const devStep = (): ExpressionSpecification => {
  const e: unknown[] = ['step', ['get', 'dev'], DEV_COLORS[0]]
  HOME_DEV_BREAKS.forEach((b, i) => e.push(b, DEV_COLORS[i + 1]))
  return e as unknown as ExpressionSpecification
}
const hover: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false]

export function addHomeLayers(map: MlMap): void {
  addBubbleIcons(map)
  map.addSource(HL.src, {
    type: 'geojson', data: empty as never, promoteId: 'key', cluster: true, clusterMaxZoom: 13, clusterRadius: 44,
  })
  map.addSource(HL.selSrc, { type: 'geojson', data: empty as never })

  map.addLayer({
    id: HL.clusters, type: 'circle', source: HL.src, filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#44546a', 'circle-opacity': 0.88, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2,
      'circle-radius': ['step', ['get', 'point_count'], 13, 25, 17, 100, 22, 400, 28],
    },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.clusterCount, type: 'symbol', source: HL.src, filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
    paint: { 'text-color': '#ffffff' },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.circles, type: 'circle', source: HL.src, filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': devStep(),
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3.5, 15, 8],
      'circle-stroke-color': ['case', hover, '#0b5cad', '#ffffff'],
      'circle-stroke-width': ['case', hover, 3, 1],
    },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.bubbles, type: 'symbol', source: HL.src, minzoom: 13.5, filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': 'bubble', 'icon-text-fit': 'both', 'icon-text-fit-padding': [2, 6, 2, 6],
      'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 13,
      'symbol-sort-key': ['get', 'dev'], 'icon-allow-overlap': false, 'text-allow-overlap': false, 'text-padding': 2,
    },
    paint: {
      // text colours are the dark tones used on cards (>= 7:1 on white); the arrow in the label repeats the colour
      'text-color': ['match', ['get', 't'], 'b', '#1c5a99', 'a', '#9c1d2b', '#1b2430'],
      'text-halo-color': '#0b5cad', 'text-halo-width': ['case', hover, 2, 0],
    },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.selRing, type: 'circle', source: HL.selSrc,
    paint: { 'circle-radius': 13, 'circle-color': 'rgba(11,92,173,0.15)', 'circle-stroke-color': '#0b5cad', 'circle-stroke-width': 3 },
  }, BEFORE_LABELS)
  map.addLayer({
    id: HL.selBubble, type: 'symbol', source: HL.selSrc, minzoom: 11,
    layout: {
      'icon-image': 'bubble-selected', 'icon-text-fit': 'both', 'icon-text-fit-padding': [2, 6, 2, 6], 'icon-anchor': 'bottom', 'icon-offset': [0, -10],
      'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 14, 'text-anchor': 'bottom', 'text-offset': [0, -0.55],
      'icon-allow-overlap': true, 'text-allow-overlap': true,
    },
    paint: { 'text-color': '#ffffff' },
  })
}

/** Label such as "▼ $350k": the arrow repeats the below/above-model colour so colour is never the only cue. */
export function labelFor(h: Home, band: IndexData['model']['error_overall']): { label: string; t: 'b' | 'a' | 'n' } {
  const t = h.dev < band.p10 ? 'b' : h.dev > band.p90 ? 'a' : 'n'
  return { t, label: `${t === 'b' ? '▼ ' : t === 'a' ? '▲ ' : ''}${priceShort(h.price)}` }
}

const point = (h: Home, props: Record<string, unknown>) => ({
  type: 'Feature' as const, properties: props, geometry: { type: 'Point' as const, coordinates: [h.lon, h.lat] },
})

export function homesGeoJSON(homes: Home[], band: IndexData['model']['error_overall']) {
  return {
    type: 'FeatureCollection' as const,
    features: homes.map((h) => point(h, { key: h.key, dev: h.dev, ...labelFor(h, band) })),
  }
}

export function setHomes(map: MlMap, homes: Home[], band: IndexData['model']['error_overall']): void {
  ;(map.getSource(HL.src) as GeoJSONSource | undefined)?.setData(homesGeoJSON(homes, band) as never)
}

export function setSelected(map: MlMap, h: Home | null, band: IndexData['model']['error_overall']): void {
  const data = h ? { type: 'FeatureCollection', features: [point(h, labelFor(h, band))] } : empty
  ;(map.getSource(HL.selSrc) as GeoJSONSource | undefined)?.setData(data as never)
}

export function setBubblesVisible(map: MlMap, on: boolean): void {
  if (map.getLayer(HL.bubbles)) map.setLayoutProperty(HL.bubbles, 'visibility', on ? 'visible' : 'none')
}
