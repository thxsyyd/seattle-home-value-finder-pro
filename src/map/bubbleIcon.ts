import type { Map as MlMap } from 'maplibre-gl'

/** Draw a rounded "price pill" as a 9-slice image so MapLibre can stretch it around the label text. */
function pill(fill: string, stroke: string): ImageData {
  const w = 40
  const h = 32
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.beginPath()
  g.roundRect(2, 2, w - 4, h - 4, 14)
  g.fillStyle = fill
  g.fill()
  g.lineWidth = 2
  g.strokeStyle = stroke
  g.stroke()
  return g.getImageData(0, 0, w, h)
}

const nine = { pixelRatio: 2, stretchX: [[14, 26]] as [number, number][], stretchY: [[12, 20]] as [number, number][], content: [14, 12, 26, 20] as [number, number, number, number] }

export function addBubbleIcons(map: MlMap): void {
  if (!map.hasImage('bubble')) map.addImage('bubble', pill('#ffffff', '#8a93a0'), nine)
  if (!map.hasImage('bubble-selected')) map.addImage('bubble-selected', pill('#0b5cad', '#ffffff'), nine)
}
