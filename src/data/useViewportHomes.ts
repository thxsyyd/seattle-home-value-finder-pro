import { useEffect, useMemo, useRef, useState } from 'react'
import { bboxIntersects } from '../lib/geo'
import { getParsed, loadZip } from './api'
import type { BBox, Home, IndexData } from './types'
import { useDebouncedValue } from './useDebouncedValue'

/** Chunk arrivals closer together than this are merged into one update. */
const BATCH_MS = 80

const keyOf = (b: BBox) => b.map((n) => n.toFixed(3)).join(',')

/**
 * Sales for every zip whose bounding box meets the (debounced) viewport. Chunks that the viewport has
 * left are aborted if still in flight; chunks already loaded stay cached and are never refetched.
 */
export function useViewportHomes(bbox: BBox | null, index: IndexData | undefined, debounceMs = 220, enabled = true) {
  const debouncedKey = useDebouncedValue(bbox ? keyOf(bbox) : null, debounceMs)
  const [tick, setTick] = useState(0)
  const controllers = useRef(new Map<string, AbortController>())
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const needed = useMemo(() => {
    if (!enabled || !index || !debouncedKey) return [] as string[]
    const b = debouncedKey.split(',').map(Number) as BBox
    return index.zips.filter((z) => bboxIntersects(z.bbox, b)).map((z) => z.zip)
  }, [index, debouncedKey, enabled])
  const neededKey = needed.join(',')
  const version = index?.version

  useEffect(() => {
    if (!version) return
    const want = new Set(neededKey ? neededKey.split(',') : [])
    const ctls = controllers.current
    for (const [zip, ctl] of ctls) {
      if (!want.has(zip)) {
        ctl.abort()
        ctls.delete(zip)
      }
    }
    for (const zip of want) {
      if (ctls.has(zip) || getParsed(version, zip)) continue
      const ctl = new AbortController()
      ctls.set(zip, ctl)
      loadZip(zip, version, ctl.signal).then(
        () => {
          if (ctls.get(zip) === ctl) ctls.delete(zip)
          // Chunks usually arrive in a burst; rebuild the combined list once per burst, not once per chunk.
          if (flushTimer.current === null) {
            flushTimer.current = setTimeout(() => {
              flushTimer.current = null
              setTick((t) => t + 1)
            }, BATCH_MS)
          }
        },
        (e: Error) => {
          if (e.name !== 'AbortError') console.error(e)
          if (ctls.get(zip) === ctl) ctls.delete(zip)
        },
      )
    }
  }, [neededKey, version])

  useEffect(() => {
    const ctls = controllers.current
    return () => {
      ctls.forEach((c) => c.abort())
      ctls.clear()
      if (flushTimer.current !== null) clearTimeout(flushTimer.current)
      flushTimer.current = null
    }
  }, [])

  return useMemo(() => {
    void tick
    const homes: Home[] = []
    let pending = 0
    for (const zip of needed) {
      const h = version ? getParsed(version, zip) : undefined
      if (h) homes.push(...h)
      else pending++
    }
    return { homes, zips: needed, loading: pending > 0 }
  }, [needed, version, tick])
}
