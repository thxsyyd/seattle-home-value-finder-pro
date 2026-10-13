import type { Map as MlMap } from 'maplibre-gl'

interface Look {
  fill: string
  stroke: string
}

/** Rounded price pill with a soft baked-in shadow, as a 9-slice image so MapLibre can stretch it around the label. */
function pill({ fill, stroke }: Look): ImageData {
  const w = 60
  const h = 48
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.shadowColor = 'rgba(0, 0, 0, 0.30)'
  g.shadowBlur = 7
  g.shadowOffsetY = 2
  g.beginPath()
  g.roundRect(8, 6, w - 16, h - 16, 16)
  g.fillStyle = fill
  g.fill()
  g.shadowColor = 'transparent'
  g.lineWidth = 1
  g.strokeStyle = stroke
  g.stroke()
  return g.getImageData(0, 0, w, h)
}

const nine = {
  pixelRatio: 2,
  stretchX: [[24, 36]] as [number, number][],
  stretchY: [[20, 24]] as [number, number][],
  content: [18, 12, 42, 32] as [number, number, number, number],
}

export const PILL = { normal: 'pill', ink: 'pill-ink', viewed: 'pill-viewed' } as const

/** Three looks: white (default), ink (hovered or selected), pale grey (already opened). */
export function addBubbleIcons(map: MlMap): void {
  if (!map.hasImage(PILL.normal)) map.addImage(PILL.normal, pill({ fill: '#ffffff', stroke: '#dddddd' }), nine)
  if (!map.hasImage(PILL.ink)) map.addImage(PILL.ink, pill({ fill: '#222222', stroke: '#222222' }), nine)
  if (!map.hasImage(PILL.viewed)) map.addImage(PILL.viewed, pill({ fill: '#f0f0f0', stroke: '#dddddd' }), nine)
}
