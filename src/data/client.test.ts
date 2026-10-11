import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchJson, resetClient } from './client'
import { metrics, resetMetrics } from './metrics'

type Pending = { url: string; resolve: (v: unknown) => void; signal: AbortSignal }
let pending: Pending[]

beforeEach(() => {
  resetClient()
  resetMetrics()
  pending = []
  vi.stubGlobal(
    'fetch',
    (url: string, init: { signal: AbortSignal }) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        pending.push({ url, signal: init.signal, resolve: (v) => resolve({ ok: true, status: 200, json: async () => v }) })
      }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const conserved = () => metrics.requested === metrics.cacheHit + metrics.network + metrics.inflightJoin

describe('fetchJson', () => {
  it('shares one network request between concurrent callers and then serves from cache', async () => {
    const a = fetchJson('/x')
    const b = fetchJson('/x')
    expect(pending).toHaveLength(1)
    pending[0].resolve({ ok: 1 })
    expect(await a).toEqual({ ok: 1 })
    expect(await b).toEqual({ ok: 1 })
    expect(await fetchJson('/x')).toEqual({ ok: 1 })
    expect(pending).toHaveLength(1)
    expect(metrics).toMatchObject({ requested: 3, network: 1, inflightJoin: 1, cacheHit: 1, completed: 1 })
    expect(conserved()).toBe(true)
  })

  it('aborts the network request only once every caller has aborted', async () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const p1 = fetchJson('/y', { signal: c1.signal })
    const p2 = fetchJson('/y', { signal: c2.signal })
    c1.abort()
    await expect(p1).rejects.toMatchObject({ name: 'AbortError' })
    expect(pending[0].signal.aborted).toBe(false)
    c2.abort()
    await expect(p2).rejects.toMatchObject({ name: 'AbortError' })
    expect(pending[0].signal.aborted).toBe(true)
    expect(metrics).toMatchObject({ aborted: 2, networkAborted: 1, completed: 0 })
    expect(conserved()).toBe(true)
  })

  it('lets a later caller start a fresh request after an abort', async () => {
    const c = new AbortController()
    const p = fetchJson('/z', { signal: c.signal })
    c.abort()
    await expect(p).rejects.toBeDefined()
    const again = fetchJson('/z')
    expect(pending).toHaveLength(2)
    pending[1].resolve({ n: 2 })
    expect(await again).toEqual({ n: 2 })
  })

  it('rejects immediately, without counting, when the signal is already aborted', async () => {
    const c = new AbortController()
    c.abort()
    await expect(fetchJson('/w', { signal: c.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(metrics.requested).toBe(0)
    expect(pending).toHaveLength(0)
  })

  it('does not cache failures', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }))
    await expect(fetchJson('/e')).rejects.toThrow('HTTP 500')
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }))
    expect(await fetchJson('/e')).toEqual({ ok: true })
  })
})
