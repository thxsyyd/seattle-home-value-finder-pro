// Scripted pan/zoom scenario for measuring the data layer. Run in the browser console (or via a
// browser-automation "evaluate") on a PRODUCTION build opened with ?debug=1 (that exposes window.__map).
// It returns the request counters plus a "naive" count: how many chunk fetches there would have been if
// every map move re-fetched every ZIP chunk it touches (no debounce, no cache, no cancellation).
(async () => {
  const map = window.__map
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const idx = await (await fetch(`${import.meta?.env?.BASE_URL ?? '/'}data/v1/index.json`)).json()
  const hit = (b, z) => !(z.bbox[0] > b.getEast() || z.bbox[2] < b.getWest() || z.bbox[1] > b.getNorth() || z.bbox[3] < b.getSouth())
  let naive = 0
  let moves = 0
  map.on('moveend', () => {
    moves++
    if (map.getZoom() >= 10.5) naive += idx.zips.filter((z) => hit(map.getBounds(), z)).length
  })
  window.__hvf.reset()
  naive = 0
  moves = 0

  const pts = [[47.62, -122.33], [47.61, -122.2], [47.68, -122.2], [47.67, -122.12], [47.48, -122.21], [47.38, -122.23], [47.45, -122.35], [47.7, -122.35], [47.62, -122.33]]
  const lerp = (a, b, t) => a + (b - a) * t
  for (let i = 1; i < pts.length; i++) {
    // a drag: 4 quick intermediate positions (40 ms apart, below the 220 ms debounce), then settle
    for (let s = 1; s <= 4; s++) {
      map.jumpTo({ center: [lerp(pts[i - 1][1], pts[i][1], s / 4), lerp(pts[i - 1][0], pts[i][0], s / 4)], zoom: 12 })
      await sleep(40)
    }
    await sleep(700)
  }
  for (const z of [14, 11.5, 13, 12, 14, 12]) { // rapid zoom changes
    map.jumpTo({ zoom: z })
    await sleep(60)
  }
  await sleep(1200)
  const m = { ...window.__hvf.metrics }
  return JSON.stringify({ moves, naiveChunkFetches: naive, ...m, reductionVsNaive: +(1 - m.network / naive).toFixed(3) })
})()
