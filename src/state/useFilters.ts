import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { applyFilters, parseFilters, type Filters } from '../lib/filters'

/**
 * The URL is the single source of truth for filter + viewport state. Writes `replace` by default so
 * dragging a slider doesn't flood history; pass push:true for a deliberate navigation step.
 */
export function useFilters(): [Filters, (patch: Partial<Filters>, opts?: { push?: boolean }) => void] {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const filters = useMemo(() => parseFilters(new URLSearchParams(key)), [key])
  const update = useCallback(
    (patch: Partial<Filters>, opts?: { push?: boolean }) => {
      setParams((prev) => applyFilters(prev, { ...parseFilters(prev), ...patch }), { replace: !opts?.push })
    },
    [setParams],
  )
  return [filters, update]
}
