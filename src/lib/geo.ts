import type { BBox } from '../data/types'

const TILE = 512 // MapLibre world size at zoom 0
const worldPx = (z: number) => TILE * 2 ** z

const lonToX = (lon: number, z: number) => ((lon + 180) / 360) * worldPx(z)
const latToY = (lat: number, z: number) => {
  const s = Math.sin((lat * Math.PI) / 180)
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldPx(z)
}
const xToLon = (x: number, z: number) => (x / worldPx(z)) * 360 - 180
const yToLat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / worldPx(z)
  return (180 / Math.PI) * Math.atan(Math.sinh(n))
}

/** Bounding box of a w x h pixel viewport centred on (lat, lon) at zoom z. */
export function viewBbox(lat: number, lon: number, z: number, w = 900, h = 700): BBox {
  const cx = lonToX(lon, z)
  const cy = latToY(lat, z)
  return [xToLon(cx - w / 2, z), yToLat(cy + h / 2, z), xToLon(cx + w / 2, z), yToLat(cy - h / 2, z)]
}

export function bboxIntersects(a: BBox, b: BBox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

export const pointInBbox = (lon: number, lat: number, b: BBox) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]
