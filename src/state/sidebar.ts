import { useSyncExternalStore } from 'react'

const KEY = 'hvf.sidebar'
const WIDE = '(min-width: 1200px)'

function initial(): boolean {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'collapsed') return true
    if (v === 'expanded') return false
  } catch {
    /* storage blocked: fall through to the default */
  }
  // narrower windows start as an icon rail so the map and list keep their room
  return typeof matchMedia === 'function' ? !matchMedia(WIDE).matches : false
}

let collapsed = initial()
const listeners = new Set<() => void>()

export function setCollapsed(next: boolean): void {
  collapsed = next
  try {
    localStorage.setItem(KEY, next ? 'collapsed' : 'expanded')
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export const useCollapsed = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => collapsed,
  )
