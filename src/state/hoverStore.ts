import { useSyncExternalStore } from 'react'

// Hover/focus state is deliberately outside the URL and React state tree, so moving the
// pointer over a card or marker never re-renders the whole page.
export type HoverSource = 'map' | 'list'
interface Hover {
  key: string | null
  source: HoverSource | null
}
let hover: Hover = { key: null, source: null }
const listeners = new Set<() => void>()

export function setHovered(key: string | null, source: HoverSource | null = null): void {
  if (key === hover.key) return
  hover = { key, source: key ? source : null }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const useHover = () => useSyncExternalStore(subscribe, () => hover)
export const useHovered = () => useHover().key
