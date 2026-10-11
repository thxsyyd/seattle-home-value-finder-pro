import { fetchJson } from './client'
import type { Home, IndexData } from './types'

const BASE = `${import.meta.env.BASE_URL}data/v1/`

export function loadIndex(signal?: AbortSignal): Promise<IndexData> {
  return fetchJson<IndexData>(`${BASE}index.json`, { signal })
}

interface Chunk {
  cols: string[]
  rows: unknown[][]
}

const parsed = new Map<string, Home[]>()
export const parsedKey = (version: string, zip: string) => `${version}:${zip}`
export const getParsed = (version: string, zip: string) => parsed.get(parsedKey(version, zip))
export function clearParsed(): void {
  parsed.clear()
}

export function parseChunk(zip: string, chunk: Chunk): Home[] {
  const ix = Object.fromEntries(chunk.cols.map((c, i) => [c, i])) as Record<string, number>
  return chunk.rows.map((r) => ({
    key: r[ix.key] as string,
    zip,
    date: r[ix.date] as string,
    price: r[ix.price] as number,
    pred: r[ix.pred] as number,
    predLin: r[ix.predLin] as number,
    dev: (r[ix.dev] as number) / 1000,
    beds: r[ix.beds] as number,
    baths: r[ix.baths] as number,
    sqft: r[ix.sqft] as number,
    lot: r[ix.lot] as number,
    floors: r[ix.floors] as number,
    waterfront: r[ix.wf] as number,
    view: r[ix.view] as number,
    condition: r[ix.cond] as number,
    grade: r[ix.grade] as number,
    yearBuilt: r[ix.yb] as number,
    yearReno: r[ix.yr] as number,
    lat: r[ix.lat] as number,
    lon: r[ix.lon] as number,
    sim: r[ix.sim] as [number, number][],
  }))
}

/** Load one zip's sales. `?v=` ties the URL to the data version so stale caches are never mixed in. */
export async function loadZip(zip: string, version: string, signal?: AbortSignal): Promise<Home[]> {
  const hit = getParsed(version, zip)
  if (hit) return hit
  const chunk = await fetchJson<Chunk>(`${BASE}zip/${zip}.json?v=${version}`, { signal })
  const homes = parseChunk(zip, chunk)
  parsed.set(parsedKey(version, zip), homes)
  return homes
}
