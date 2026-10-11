# Data-layer measurements

Only numbers measured with the scripted scenario below are quoted anywhere in this project.

## Scenario 1: pan and zoom across King County (2026-10-11)

Script: [`scripts/perf-scenario.js`](../scripts/perf-scenario.js), run in the browser on a **production build**
(`npm run build`, `vite preview`, page opened with `?debug=1`), Chromium in the Claude desktop app's browser pane.
Starts at Seattle (zoom 12), then eight "drags" between neighbourhoods (Seattle → Bellevue → Kirkland → Redmond →
Renton → Kent → Burien → north Seattle → Seattle; each drag is four quick position changes 40 ms apart, then a
700 ms pause), then six rapid zoom changes 60 ms apart.

| Measure | Value |
|---|---|
| Map moves in the scenario (`moveend` events) | 38 |
| ZIP-chunk fetches a naive client would make (re-fetch every chunk each move touches) | 445 |
| Chunk requests the app actually sent over the network | 41 (each distinct ZIP once) |
| Reduction versus the naive client | 90.8% |
| Requests aborted in flight | 0 |
| Transfer reported by the browser for those 41 requests | 640,843 bytes (localhost, `vite preview`) |

How to read this:

- The "naive" figure is *computed*, not measured on a second implementation: for every move at zoom ≥ 10.5 it counts the
  ZIP bounding boxes that intersect the viewport. It is the request count if nothing were cached, debounced or cancelled.
- Almost all of the 90.8% comes from caching (a chunk is parsed once and reused). The 220 ms debounce keeps the
  intermediate drag positions from requesting chunks for ZIPs that are only passed over; it is not separated out here.
- No request was cancelled in this run because every pause was longer than the debounce and each chunk resolves in tens
  of milliseconds on localhost. Cancellation is covered by unit tests (`src/data/client.test.ts`,
  `src/data/useViewportHomes.test.tsx`), not by this scenario.
- `bytes` comes from `PerformanceResourceTiming.transferSize` on localhost, so it says nothing about CDN compression.

To reproduce: build, serve, open `/?ll=47.62,-122.33&z=12&debug=1`, paste the script into the console.
