import { useSyncExternalStore } from 'react'

// Hover/focus state is deliberately outside the URL and React state tree, so moving the
// pointer over a card or marker never re-renders the whole page.
let hovered: string | null = null
const listeners = new Set<() => void>()

export function setHovered(key: string | null): void {
  if (key === hovered) return
  hovered = key
  listeners.forEach((l) => l())
}

export const useHovered = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => hovered,
  )
