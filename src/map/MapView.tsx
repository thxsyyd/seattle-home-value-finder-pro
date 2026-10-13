import { Map as MlMap, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl'
// MapLibre derives its worker URL from import.meta.url at run time, which bundlers can't see, so the
// production build would not ship the worker. Import it as an asset and point MapLibre at it.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { fetchJson } from '../data/client'
import type { BBox, Home, IndexData } from '../data/types'
import type { Filters } from '../lib/filters'
import type { PriceOf } from '../lib/query'
import { money } from '../lib/format'
import { useT } from '../i18n'
import { reducedMotion } from '../a11y/prefs'
import { setHovered, useHover } from '../state/hoverStore'
import { Legend } from './Legend'
import { applyQuietStyle } from './quietStyle'
import { addHomeLayers, HL, setHomes, setHoveredPill, setSelected, setViewedPills } from './homesLayer'
import { DEFAULT_VIEW, webglSupported } from './view'
import { addRegionLayers, IDS, setLayerMode, setMetric, setSourceData } from './layers'

setWorkerUrl(workerUrl)

const STYLE_URL = import.meta.env.VITE_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/positron'
const DATA = `${import.meta.env.BASE_URL}data/v1/`

interface FeatureCollection {
  type: 'FeatureCollection'
  features: { type: 'Feature'; properties: { z?: string } | null; geometry: unknown }[]
}

export interface ViewState {
  bbox: BBox
  lat: number
  lon: number
  zoom: number
}

interface Props {
  index: IndexData | undefined
  filters: Filters
  /** filtered sales for every zip near the viewport (drawn as dots plus the best-ranked price pills) */
  homes: Home[]
  selected: Home | null
  /** keys of the sales currently shown as cards, best first */
  listed: string[]
  priceOf: PriceOf
  onSelectHome: (key: string) => void
  /** `persist` is false for the initial load, so merely opening the page doesn't rewrite the URL */
  onViewChange: (v: ViewState, persist: boolean) => void
}

function readView(map: MlMap): ViewState {
  const b = map.getBounds()
  const c = map.getCenter()
  return { bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], lat: c.lat, lon: c.lng, zoom: map.getZoom() }
}

/** Show a popup whose content is built with textContent only (no HTML injection from data). */
function popupNode(title: string, lines: string[]): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'font: 14px/1.4 system-ui, sans-serif; color: #222222;'
  const h = document.createElement('strong')
  h.textContent = title
  el.append(h)
  for (const l of lines) {
    const p = document.createElement('div')
    p.textContent = l
    el.append(p)
  }
  return el
}

export default function MapView({ index, filters, homes, selected, listed, priceOf, onSelectHome, onViewChange }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(() => !webglSupported())
  const [zoom, setZoom] = useState(filters.z ?? DEFAULT_VIEW.zoom)
  const initial = useRef(filters)
  const onView = useRef(onViewChange)
  const onSelect = useRef(onSelectHome)
  useEffect(() => {
    onView.current = onViewChange
    onSelect.current = onSelectHome
    tRef.current = t
  })
  const t = useT()
  const tRef = useRef(t)
  const hover = useHover()
  const prevHover = useRef<string | null>(null)
  const band = index?.model.error_overall

  // create the map once
  useEffect(() => {
    if (!box.current) return
    if (failed) return
    let map: MlMap
    try {
      const f = initial.current
      map = new MlMap({
        container: box.current,
        style: STYLE_URL,
        center: f.ll ? [f.ll[1], f.ll[0]] : [DEFAULT_VIEW.lon, DEFAULT_VIEW.lat],
        zoom: f.z ?? DEFAULT_VIEW.zoom,
        minZoom: 8,
        maxZoom: 17,
        hash: false,
      })
    } catch {
      queueMicrotask(() => setFailed(true))
      return
    }
    mapRef.current = map
    if (import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1') (window as unknown as { __map?: MlMap }).__map = map // handle for scripted checks
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    // the list/map divider can be dragged, so follow the container's size as well as the window's
    const ro = new ResizeObserver(() => map.resize())
    if (box.current) ro.observe(box.current)
    map.on('error', (e) => {
      if (!map.isStyleLoaded() && !map.getStyle()) setFailed(true)
      console.warn('map error', e.error?.message)
    })
    map.on('load', () => {
      applyQuietStyle(map)
      addRegionLayers(map, initial.current.metric)
      addHomeLayers(map)
      setLayerMode(map, initial.current.layer)
      setReady(true)
      onView.current(readView(map), false)
    })
    map.on('moveend', () => {
      setZoom(map.getZoom())
      onView.current(readView(map), true)
    })

    const areas = [IDS.hex7Fill, IDS.hex8Fill, IDS.zipFill]
    const markers = [HL.pillsHover, HL.pills, HL.pillsViewed, HL.dots]
    const present = (ids: string[]) => ids.filter((id) => map.getLayer(id))
    map.on('mousemove', (e) => {
      const m = map.queryRenderedFeatures(e.point, { layers: present(markers) })[0]
      setHovered(m ? String(m.properties?.key) : null, 'map')
      map.getCanvas().style.cursor = m || map.queryRenderedFeatures(e.point, { layers: present(areas) }).length ? 'pointer' : ''
    })
    map.on('mouseout', () => setHovered(null))
    map.on('click', (e) => {
      const m = map.queryRenderedFeatures(e.point, { layers: present(markers) })[0]
      if (m) {
        onSelect.current(String(m.properties?.key))
        return
      }
      const f = map.queryRenderedFeatures(e.point, { layers: present(areas) })[0]
      if (!f) return
      const p = f.properties as Record<string, number | string>
      const isZip = f.layer.id === IDS.zipFill
      const tt = tRef.current
      const lines = isZip
        ? [tt('popup.sales', { n: Number(p.n).toLocaleString() }), tt('popup.median', { price: money(Number(p.m)) }), tt('popup.medianPpsf', { p: String(p.p) })]
        : [tt('popup.hex', { n: String(p.n) }), p.g ? tt('popup.few') : tt('popup.smoothed', { p: String(p.p) }), tt('popup.raw', { r: String(p.r) })]
      new Popup({ closeButton: true, maxWidth: '240px' })
        .setLngLat(e.lngLat)
        .setDOMContent(popupNode(isZip ? tt('popup.zip', { z: String(p.z) }) : tt('popup.area'), lines))
        .addTo(map)
    })
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create once; `failed` only gates the initial attempt
  }, [])

  // area layers (off by default, so their data is only fetched when the viewer turns them on)
  const showHex = filters.layer === 'hex'
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !index || !showHex) return
    const ctl = new AbortController()
    fetchJson(`${DATA}hex7.geojson?v=${index.version}`, { signal: ctl.signal }).then((d) => setSourceData(map, IDS.hex7, d), () => {})
    return () => ctl.abort()
  }, [ready, index, showHex])

  const needHex8 = showHex && zoom >= 10
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !index || !needHex8) return
    const ctl = new AbortController()
    fetchJson(`${DATA}hex8.geojson?v=${index.version}`, { signal: ctl.signal }).then((d) => setSourceData(map, IDS.hex8, d), () => {})
    return () => ctl.abort()
  }, [ready, index, needHex8])

  const showZips = filters.layer === 'zip'
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !index || !showZips) return
    const ctl = new AbortController()
    fetchJson<FeatureCollection>(`${DATA}zips.geojson?v=${index.version}`, { signal: ctl.signal }).then((gj) => {
      const rows = new Map(index.zips.map((z) => [z.zip, z]))
      // join per-zip stats onto the polygons so they use the same property keys as the hexagons
      const joined = {
        ...gj,
        features: gj.features.map((f) => {
          const z = rows.get(f.properties?.z ?? '')
          return { ...f, properties: { z: f.properties?.z, n: z?.n ?? 0, p: z?.medPpsf ?? 0, m: z?.medPrice ?? 0, d: z?.medDev ?? 0, g: 0 } }
        }),
      }
      setSourceData(map, IDS.zips, joined)
    }, () => {})
    return () => ctl.abort()
  }, [ready, index, showZips])

  // homes -> map: a dot for every sale; MapLibre keeps as many ranked price pills as fit
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !band) return
    setHomes(map, homes, band, priceOf, listed)
  }, [ready, homes, band, priceOf, listed])
  // selected home: ring + bubble, and bring it into view if it is outside the current viewport
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !band) return
    setSelected(map, selected, band, priceOf)
    if (selected && !map.getBounds().contains([selected.lon, selected.lat])) {
      map.easeTo({ center: [selected.lon, selected.lat], zoom: Math.max(map.getZoom(), 14), duration: reducedMotion() ? 0 : 600 })
    }
  }, [ready, selected, band, priceOf])

  // opened sales turn their pill pale grey
  const viewed = useRef<string[]>([])
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    if (selected && !viewed.current.includes(selected.key)) viewed.current = [...viewed.current, selected.key]
    setViewedPills(map, viewed.current.filter((k) => k !== selected?.key))
  }, [ready, selected])

  // hover from the list (or the map): dark pill and a ringed dot
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const prev = prevHover.current
    if (prev && map.getSource(HL.src)) map.setFeatureState({ source: HL.src, id: prev }, { hover: false })
    if (hover.key && map.getSource(HL.src)) map.setFeatureState({ source: HL.src, id: hover.key }, { hover: true })
    prevHover.current = hover.key
    setHoveredPill(map, hover.key)
  }, [ready, hover.key])

  // filters -> map
  useEffect(() => {
    const map = mapRef.current
    if (ready && map) setMetric(map, filters.metric)
  }, [ready, filters.metric])
  useEffect(() => {
    const map = mapRef.current
    if (ready && map) setLayerMode(map, filters.layer)
  }, [ready, filters.layer])

  // URL -> map: only move when the URL differs from where the map already is (avoids write/read loops)
  const { ll, z } = filters
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !ll) return
    const c = map.getCenter()
    const zz = z ?? map.getZoom()
    if (Math.abs(c.lat - ll[0]) > 5e-4 || Math.abs(c.lng - ll[1]) > 5e-4 || Math.abs(map.getZoom() - zz) > 0.02) {
      map.flyTo({ center: [ll[1], ll[0]], zoom: zz, duration: reducedMotion() ? 0 : 700, essential: false })
    }
  }, [ready, ll, z])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={box} role="region" aria-label={t('map.aria')} style={{ position: 'absolute', inset: 0 }} />
      {failed && (
        <p role="alert" style={{ position: 'absolute', inset: 0, margin: 0, padding: 'var(--s-5)', background: 'var(--bg)' }}>
          {t('map.failed')}
        </p>
      )}
      <div className="legend-slot">
        <Legend metric={filters.metric} layer={filters.layer} />
      </div>
    </div>
  )
}
