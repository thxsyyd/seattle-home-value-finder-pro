import { useEffect, useState, type RefObject } from 'react'
import { columnsFor } from './split'

/** Number of card columns that fit in the element, updated as it is resized (e.g. by dragging the divider). */
export function useColumns(ref: RefObject<HTMLElement | null>): number {
  const [cols, setCols] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setCols(columnsFor(el.getBoundingClientRect().width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return cols
}
