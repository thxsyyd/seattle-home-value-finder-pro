import { metrics } from './metrics'

const MAX_CACHE = 80

interface Entry {
  promise: Promise<unknown>
  controller: AbortController
  refs: number
}

const cache = new Map<string, unknown>()
const inflight = new Map<string, Entry>()

export function resetClient(): void {
  cache.clear()
  inflight.clear()
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function recordBytes(url: string): void {
  try {
    const abs = new URL(url, globalThis.location?.href ?? 'http://localhost/').href
    const e = performance.getEntriesByName(abs).pop() as PerformanceResourceTiming | undefined
    if (e && e.transferSize > 0) metrics.bytes += e.transferSize
    else metrics.bytesUnknown++
  } catch {
    metrics.bytesUnknown++
  }
}

function remember(url: string, value: unknown): void {
  cache.set(url, value)
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value as string)
}

/**
 * GET JSON with a module-level cache, in-flight de-duplication and ref-counted cancellation:
 * a shared network request is only aborted once every caller waiting on it has aborted.
 */
export function fetchJson<T>(url: string, opts: { signal?: AbortSignal } = {}): Promise<T> {
  const { signal } = opts
  if (signal?.aborted) return Promise.reject(abortError())
  metrics.requested++

  if (cache.has(url)) {
    metrics.cacheHit++
    return Promise.resolve(cache.get(url) as T)
  }

  let entry = inflight.get(url)
  if (entry) {
    metrics.inflightJoin++
    entry.refs++
  } else {
    metrics.network++
    const controller = new AbortController()
    const e: Entry = { controller, refs: 1, promise: Promise.resolve() }
    e.promise = fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
        return r.json()
      })
      .then((v) => {
        inflight.delete(url)
        remember(url, v)
        metrics.completed++
        recordBytes(url)
        return v
      })
      .catch((err) => {
        if (inflight.get(url) === e) inflight.delete(url)
        throw err
      })
    inflight.set(url, e)
    entry = e
  }

  const mine = entry
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const onAbort = () => {
      if (settled) return
      settled = true
      metrics.aborted++
      mine.refs--
      if (mine.refs === 0 && inflight.get(url) === mine) {
        inflight.delete(url)
        metrics.networkAborted++
        mine.controller.abort()
      }
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    mine.promise.then(
      (v) => {
        if (settled) return
        settled = true
        signal?.removeEventListener('abort', onAbort)
        resolve(v as T)
      },
      (err) => {
        if (settled) return
        settled = true
        signal?.removeEventListener('abort', onAbort)
        reject(err)
      },
    )
  })
}
