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
| `/` (English), `/?lang=zh`, deep link `/?ll=47.62,-122.33&z=11`, `/about` | 100 | 100 | 100 |

**Performance is not stable between runs.** Repeating Lighthouse on the *same* build gives two clusters: performance 98 (LCP
2.0 s) in most runs and 87–89 (LCP 3.5 s) in some. For the current build: 98, 87, 98, 88, 98 on `/` and 98, 98, 98 on the
deep link (and, after the sidebar was added, 88, 88 on `/`, 98 on `/?lang=zh` and `/about`); the previous build, measured the same way, gave 99 and 88. The 1.5 s step is the simulated network model
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
(the last four checked in English before the language work; `/about` and `/home/:id` re-checked in Chinese). After the sidebar was added, axe was re-run on the expanded and collapsed sidebar, the phone drawer, the accessibility dialog,
the ZIP finder, `/compare` and `/compare/:a/:b`, in English and Chinese: no violations (it caught two real issues on the way:
the brand link's accessible name and an `h1` outside a landmark, both fixed). Automated
checks do not replace a manual screen-reader pass, which has not been done.

Colour vision: [`scripts/cvd_check.py`](../scripts/cvd_check.py) simulates protan, deutan and tritan vision. After adjusting
the three middle classes of the deviation palette, neighbouring classes stay at least 17.2 Delta E apart in every
simulation (19.9 for normal vision); the sequential palette's minimum is 11.0 (tritanopia). Labels, ▼/▲ arrows and numbers
repeat what colour shows.

## First-screen simplification (2026-10-12)

The first screen had grown to 37 keyboard tab stops at 1280 px wide (sidebar 15, results panel 14, map 7, banner 1), with
the "best deals" entry in three places and unexplained terms. After the simplification (ZIP search, Show toggle, budget,
bedrooms and *More filters* up front; sidebar cut to four links plus settings; intro card and filter chips removed) the same
count is 28 (sidebar 8, results panel 11, map 8, banner 1). That is a crude measure: the map's attribution links and
zoom buttons are fixed cost, and what mattered more is the number of choices a first-time visitor must make, which
went from about nine filter chips plus three "best deals" entry points to four always-visible controls.

Lighthouse on the simplified build (mobile, production): accessibility, best practices and SEO 100 on `/`, `/?lang=zh`
and `/?show=all&maxp=any`. Performance on the default URL, which now opens on Seattle and so loads about twenty ZIP
chunks immediately: 79 (LCP 4.9 s) once, then 98, 97, 98, 98 and 98, 98 on the other two URLs. The spread is the same
simulation effect described above (one run in seven landed in a slow cluster, at 79 rather than 88), so the honest
range for this build is roughly 79–98 with most runs at 97–98.

## Airbnb-style redesign (2026-10-12)

What changed: sidebar replaced by a header with a three-part search pill and a chips row; cards lead with a
sold-vs-estimate bar; the map is a quiet grey-white base with ranked price pills and dots (no clusters, no default area
colouring); every colour has one meaning (see README, "Design rules").

- **Keyboard tab stops on the first screen at 1280 px:** 37 (before the first simplification) → 28 → **22** (header 7,
  chips 4, banner 1, results 1, map 9). The map's zoom buttons and attribution links are fixed cost.
- **Colour rule audit** (`scripts/color_audit.py`): 12 blue/red hex colours in `src/`, all in the design tokens, the marker
  layer and the optional area/deviation scales; none on controls, links or backgrounds. Two violations were found and
  fixed on the way (chart series in blue, a navy popup text colour).
- **Colour vision** (`scripts/cvd_check.py`): the three marker tones (blue / grey / red) stay at least 30.1 ΔE apart in
  protan, deutan and tritan simulation; the grey area scale's neighbours are 10.9 ΔE apart (lightness only, so identical
  in every simulation).
- **axe-core**, desktop and phone, English and Chinese: no violations on the map page, search pill panels (desktop segments
  and the phone panel), Filters window, menu, accessibility dialog (also with high contrast and larger text), ZIP detail,
  home detail (calculator open), compare chooser and comparison, affordability and About. It found three real issues on the
  way: the accessibility dialog was unmounted when the menu closed, the filter chips were outside a landmark, and the
  phone search button's accessible name left out its visible text. All fixed.
- **Lighthouse (mobile, production build):** accessibility, best practices and SEO 100 on all URLs tried. Performance on
  the default URL over nine runs: 87, 85, 86, 98, 97 (this build) and, earlier in the same session while other tools were
  running, 62, 80, 83. The same two-cluster pattern as before (about 85 or about 98); the outliers coincided with machine
  load, so treat 85–98 as the range. Area colouring is now off by default, so the hexagon data (about 125 KB) is not
  fetched on first load.
