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

## Page quality checks (2026-10-11, updated after adding languages and accessibility settings)

Production build served with `vite preview`; Lighthouse 13.5.0 (headless Chrome, simulated mobile throttling).

| Page | Accessibility | Best practices | SEO |
|---|---|---|---|
| `/` (English), `/?lang=zh`, deep link `/?ll=47.62,-122.33&z=11` | 100 | 100 | 100 |

**Performance is not stable between runs.** Repeating Lighthouse on the *same* build gives two clusters: performance 98 (LCP
2.0 s) in most runs and 87–89 (LCP 3.5 s) in some. For the current build: 98, 87, 98, 88, 98 on `/` and 98, 98, 98 on the
deep link; the previous build, measured the same way, gave 99 and 88. The 1.5 s step is the simulated network model
scheduling one more round trip, not a code change, so quote the range (87–99), not a single score. Lighthouse also stops
at page idle, so map tiles that arrive later are not included.

Real changes that came out of this measuring:

- Mobile deep link scored 43 (total blocking time 2.8 s) when every arriving ZIP chunk rebuilt the filtered list and the
  map GeoJSON. Chunk arrivals within 80 ms are now merged into one update (TBT now 30–110 ms).
- Pages other than the map are lazy-loaded: entry JavaScript went from 128 KB to 81 KB gzipped.
- No `main` landmark was visible on phones (the results panel is hidden in map view): the whole split view is `<main>`.
- `robots.txt` was served as the SPA fallback page: added a real file.

Accessibility: axe-core (WCAG 2.0/2.1 A and AA plus best-practice rules, via the development-only `?a11y=1` runner in
`src/dev/axe.ts`) reported no violations on `/` (also with the filter panels, in Chinese, with the accessibility dialog
open and with high contrast on), `/zip/:zip`, `/home/:id` (calculator open), `/compare/:a/:b`, `/afford` and `/about`
(the last four checked in English before the language work; `/about` and `/home/:id` re-checked in Chinese). Automated
checks do not replace a manual screen-reader pass, which has not been done.

Colour vision: [`scripts/cvd_check.py`](../scripts/cvd_check.py) simulates protan, deutan and tritan vision. After adjusting
the three middle classes of the deviation palette, neighbouring classes stay at least 17.2 Delta E apart in every
simulation (19.9 for normal vision); the sequential palette's minimum is 11.0 (tritanopia). Labels, ▼/▲ arrows and numbers
repeat what colour shows.
