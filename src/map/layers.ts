import type { GeoJSONSource, Map as MlMap } from 'maplibre-gl'
import type { MetricKey, LayerKey } from '../lib/filters'
import { fillColorExpression, NO_DATA } from './colors'

// Region fills go in above buildings (which are opaque from z12) but below every road layer, so roads and labels stay on top.
const BEFORE = 'tunnel_motorway_casing'

export const IDS = {
  hex7: 'hex7', hex8: 'hex8', zips: 'zips',
  hex7Fill: 'hex7-fill', hex8Fill: 'hex8-fill', hexLine: 'hex-line', hexGrey: 'hex-grey-line',
  zipFill: 'zip-fill', zipLine: 'zip-line', waterMask: 'water-mask',
} as const

const empty = { type: 'FeatureCollection', features: [] } as const

export function addRegionLayers(map: MlMap, metric: MetricKey): void {
  for (const id of [IDS.hex7, IDS.hex8, IDS.zips]) map.addSource(id, { type: 'geojson', data: empty as never, promoteId: id === IDS.zips ? 'z' : 'c' })
  const fill = fillColorExpression(metric)

  map.addLayer({ id: IDS.hex7Fill, type: 'fill', source: IDS.hex7, paint: { 'fill-color': fill, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0.78, 12.5, 0] } }, BEFORE)
  map.addLayer({ id: IDS.hex8Fill, type: 'fill', source: IDS.hex8, paint: { 'fill-color': fill, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 12.5, 0.7, 14.5, 0.3] } }, BEFORE)
  map.addLayer({ id: IDS.zipFill, type: 'fill', source: IDS.zips, layout: { visibility: 'none' }, paint: { 'fill-color': fill, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.75, 14, 0.35] } }, BEFORE)
  // Water drawn again above the fills so colour never spills over lakes and Puget Sound.
  map.addLayer({
    id: IDS.waterMask, type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
    filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': 'rgb(194, 200, 202)' },
  }, BEFORE)
  map.addLayer({
    id: IDS.hexLine, type: 'line', source: IDS.hex8, minzoom: 10.5,
    paint: { 'line-color': '#ffffff', 'line-width': 0.6, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 12.5, 0.6] },
  }, BEFORE)
  map.addLayer({
    id: IDS.hexGrey, type: 'line', source: IDS.hex8, minzoom: 10.5, filter: ['==', ['get', 'g'], 1],
    paint: { 'line-color': '#9aa1a9', 'line-width': 0.8, 'line-dasharray': [2, 2], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 12.5, 0.8] },
  }, BEFORE)
  map.addLayer({
    id: IDS.zipLine, type: 'line', source: IDS.zips, layout: { visibility: 'none', 'line-join': 'round' },
    paint: { 'line-color': '#5b6675', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 13, 2], 'line-opacity': 0.55 },
  }, BEFORE)
}

export function setSourceData(map: MlMap, id: string, data: unknown): void {
  ;(map.getSource(id) as GeoJSONSource | undefined)?.setData(data as never)
}

export function setMetric(map: MlMap, metric: MetricKey): void {
  const fill = fillColorExpression(metric)
  for (const id of [IDS.hex7Fill, IDS.hex8Fill, IDS.zipFill]) map.setPaintProperty(id, 'fill-color', fill)
}

export function setLayerMode(map: MlMap, layer: LayerKey): void {
  const showZips = layer === 'zip'
  const vis = (on: boolean) => (on ? 'visible' : 'none')
  for (const id of [IDS.hex7Fill, IDS.hex8Fill, IDS.hexLine, IDS.hexGrey]) map.setLayoutProperty(id, 'visibility', vis(!showZips))
  for (const id of [IDS.zipFill, IDS.zipLine]) map.setLayoutProperty(id, 'visibility', vis(showZips))
}

export { NO_DATA }
