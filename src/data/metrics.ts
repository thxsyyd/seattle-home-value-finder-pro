/**
 * Request counters, exposed on window.__hvf.metrics so a scripted scenario can measure real numbers.
 * Invariant: requested === cacheHit + network + inflightJoin (pre-aborted calls are not counted).
 */
export interface Metrics {
  requested: number
  network: number
  cacheHit: number
  inflightJoin: number
  /** caller-level cancellations of requests that had not finished */
  aborted: number
  /** network fetches actually cancelled because no caller still wanted them */
  networkAborted: number
  completed: number
  /** sum of transferSize where the browser reported it */
  bytes: number
  bytesUnknown: number
}

export const metrics: Metrics = {
  requested: 0, network: 0, cacheHit: 0, inflightJoin: 0, aborted: 0, networkAborted: 0, completed: 0, bytes: 0, bytesUnknown: 0,
}

export function resetMetrics(): void {
  for (const k of Object.keys(metrics) as (keyof Metrics)[]) metrics[k] = 0
}

declare global {
  interface Window {
    __hvf?: { metrics: Metrics; reset: () => void }
  }
}

if (typeof window !== 'undefined') window.__hvf = { metrics, reset: resetMetrics }
