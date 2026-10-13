import type { Map as MlMap } from 'maplibre-gl'

/**
 * A calm base map: light grey-white land, barely-there water and parks, thin pale roads, grey place names.
 * OpenFreeMap's Positron style (OpenStreetMap data) is already light, but its white road casings, buildings,
 * rail lines, shields and road names compete with the markers, so they are removed or toned down here.
 */
export const QUIET = {
  land: '#f7f7f7',
  water: '#e1e8ec',
  park: '#eef1ec',
  road: '#e4e4e4',
  roadMajor: '#d7d7d7',
  boundary: '#cfcfcf',
  place: '#8c8c8c',
  placeStrong: '#6a6a6a',
  waterLabel: '#a9b6bd',
} as const

const HIDE = [
  'building', 'landuse_residential', 'landcover_ice_shelf', 'landcover_glacier',
  'tunnel_motorway_casing', 'highway_major_casing', 'highway_motorway_casing', 'highway_motorway_bridge_casing',
  'aeroway-taxiway', 'aeroway-runway-casing', 'aeroway-area', 'aeroway-runway', 'road_area_pier', 'road_pier',
  'highway_path', 'railway_transit', 'railway_transit_dashline', 'railway_service', 'railway_service_dashline',
  'railway', 'railway_dashline', 'waterway_line_label',
  'highway-name-path', 'highway-name-minor', 'highway-name-major',
  'highway-shield-non-us', 'highway-shield-us-interstate', 'road_shield_us', 'airport',
]

const PAINT: [string, string, unknown][] = [
  ['background', 'background-color', QUIET.land],
  ['park', 'fill-color', QUIET.park],
  ['landcover_wood', 'fill-color', QUIET.park],
  ['water', 'fill-color', QUIET.water],
  ['waterway', 'line-color', QUIET.water],
  ['highway_minor', 'line-color', QUIET.road],
  ['highway_major_inner', 'line-color', QUIET.roadMajor],
  ['highway_major_subtle', 'line-color', QUIET.roadMajor],
  ['highway_motorway_inner', 'line-color', QUIET.roadMajor],
  ['highway_motorway_subtle', 'line-color', QUIET.roadMajor],
  ['highway_motorway_bridge_inner', 'line-color', QUIET.roadMajor],
  ['tunnel_motorway_inner', 'line-color', QUIET.road],
  ['highway_minor', 'line-width', ['interpolate', ['exponential', 1.5], ['zoom'], 13, 0.7, 20, 10]],
  ['highway_major_inner', 'line-width', ['interpolate', ['exponential', 1.4], ['zoom'], 10, 0.6, 20, 12]],
  ['highway_motorway_inner', 'line-width', ['interpolate', ['exponential', 1.4], ['zoom'], 8, 0.5, 20, 14]],
  ['highway_motorway_bridge_inner', 'line-width', ['interpolate', ['exponential', 1.4], ['zoom'], 8, 0.5, 20, 14]],
  ['boundary_3', 'line-color', QUIET.boundary],
  ['boundary_2', 'line-color', QUIET.boundary],
  ['label_other', 'text-color', QUIET.place],
  ['label_village', 'text-color', QUIET.place],
  ['label_town', 'text-color', QUIET.place],
  ['label_state', 'text-color', QUIET.place],
  ['label_city', 'text-color', QUIET.placeStrong],
  ['label_city_capital', 'text-color', QUIET.placeStrong],
  ['water_name_point_label', 'text-color', QUIET.waterLabel],
  ['water_name_line_label', 'text-color', QUIET.waterLabel],
]
const HALO = ['label_other', 'label_village', 'label_town', 'label_state', 'label_city', 'label_city_capital', 'water_name_point_label', 'water_name_line_label']

/** Apply once, after the style has loaded. Missing layers (a different style URL) are skipped. */
export function applyQuietStyle(map: MlMap): void {
  const has = (id: string) => !!map.getLayer(id)
  for (const id of HIDE) if (has(id)) map.setLayoutProperty(id, 'visibility', 'none')
  for (const [id, prop, value] of PAINT) if (has(id)) map.setPaintProperty(id, prop as never, value as never)
  for (const id of HALO) if (has(id)) map.setPaintProperty(id, 'text-halo-color', QUIET.land)
}
