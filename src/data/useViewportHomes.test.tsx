import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearParsed } from './api'
import { resetClient } from './client'
import { metrics, resetMetrics } from './metrics'
import type { IndexData } from './types'
import { useViewportHomes } from './useViewportHomes'

const zip = (z: string, w: number) => ({ zip: z, n: 1, medPrice: 1, medPpsf: 1, medDev: 0, pctBelow: 0, bbox: [w, 47, w + 0.1, 47.1], centroid: [w, 47] })
const index = { version: 'tv', zips: [zip('98001', -122.3), zip('98002', -122.1), zip('98003', -121.9)] } as unknown as IndexData
const chunk = (z: string) => ({
  cols: ['key', 'date', 'price', 'pred', 'predLin', 'dev', 'beds', 'baths', 'sqft', 'lot', 'floors', 'wf', 'view', 'cond', 'grade', 'yb', 'yr', 'lat', 'lon', 'sim'],
  rows: [[`${z}-1`, '2014-06-01', 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 3, 7, 1960, 0, 47.05, -122.2, []]],
})

let pending: { url: string; resolve: () => void; signal: AbortSignal }[]
beforeEach(() => {
  vi.useFakeTimers()
  clearParsed()
  resetClient()
  resetMetrics()
  pending = []
  vi.stubGlobal('fetch', (url: string, init: { signal: AbortSignal }) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      const z = /zip\/(\d+)\.json/.exec(url)![1]
      pending.push({ url, signal: init.signal, resolve: () => resolve({ ok: true, status: 200, json: async () => chunk(z) }) })
    }))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useViewportHomes', () => {
  it('debounces rapid viewport changes: zips passed over mid-burst are never requested', async () => {
    const view = (w: number): [number, number, number, number] => [w, 47.01, w + 0.02, 47.09]
    const { rerender } = renderHook(({ b }) => useViewportHomes(b, index, 200), { initialProps: { b: view(-122.29) } })
    expect(pending).toHaveLength(1) // first mount loads immediately
    expect(pending[0].url).toContain('zip/98001.json?v=tv')
    rerender({ b: view(-122.09) }) // sweep over 98002 ...
    await act(async () => { vi.advanceTimersByTime(50) })
    rerender({ b: view(-121.89) }) // ... and on to 98003 before the debounce fires
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(pending).toHaveLength(1)
    await act(async () => { vi.advanceTimersByTime(250) })
    expect(pending).toHaveLength(2)
    expect(pending[1].url).toContain('zip/98003.json')
    expect(pending[0].signal.aborted).toBe(true) // 98001 left the viewport while still loading
  })

  it('aborts in-flight chunks the viewport has left and never refetches loaded ones', async () => {
    const view = (w: number): [number, number, number, number] => [w, 47.01, w + 0.02, 47.09]
    const { result, rerender } = renderHook(({ b }) => useViewportHomes(b, index, 100), { initialProps: { b: view(-122.29) } })
    await act(async () => { vi.advanceTimersByTime(150) })
    expect(pending).toHaveLength(1)
    await act(async () => { pending[0].resolve(); await Promise.resolve() })
    await act(async () => { await Promise.resolve() })
    expect(result.current.homes.map((h) => h.key)).toEqual(['98001-1'])

    rerender({ b: view(-122.09) }) // pan to 98002, not yet loaded
    await act(async () => { vi.advanceTimersByTime(150) })
    expect(pending).toHaveLength(2)
    rerender({ b: view(-121.89) }) // pan on to 98003 before 98002 arrives
    await act(async () => { vi.advanceTimersByTime(150) })
    expect(pending[1].signal.aborted).toBe(true)
    expect(pending).toHaveLength(3)

    rerender({ b: view(-122.29) }) // back to 98001: already cached, no new request
    await act(async () => { vi.advanceTimersByTime(150) })
    expect(pending).toHaveLength(3)
    expect(metrics.requested).toBe(metrics.cacheHit + metrics.network + metrics.inflightJoin)
    expect(metrics.networkAborted).toBe(2)
  })
})
