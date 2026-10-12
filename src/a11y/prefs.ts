import { useSyncExternalStore } from 'react'

/** Per-viewer display preferences. They are applied as data-* attributes on <html> and kept in localStorage. */
export interface A11yPrefs {
  text: 'base' | 'lg' | 'xl'
  contrast: 'base' | 'high'
  motion: 'system' | 'reduce'
  underline: boolean
}
export const DEFAULT_PREFS: A11yPrefs = { text: 'base', contrast: 'base', motion: 'system', underline: false }
const KEY = 'hvf.a11y'

export function parsePrefs(raw: string | null): A11yPrefs {
  try {
    const o = raw ? JSON.parse(raw) : {}
    return {
      text: o.text === 'lg' || o.text === 'xl' ? o.text : 'base',
      contrast: o.contrast === 'high' ? 'high' : 'base',
      motion: o.motion === 'reduce' ? 'reduce' : 'system',
      underline: o.underline === true,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function load(): A11yPrefs {
  try {
    return parsePrefs(localStorage.getItem(KEY))
  } catch {
    return DEFAULT_PREFS // storage blocked: defaults, and changes last for this visit only
  }
}

let prefs: A11yPrefs = DEFAULT_PREFS
const listeners = new Set<() => void>()

export function applyToDocument(p: A11yPrefs, root: HTMLElement = document.documentElement): void {
  root.dataset.text = p.text
  root.dataset.contrast = p.contrast
  root.dataset.motion = p.motion
  root.dataset.underline = p.underline ? 'on' : 'off'
}

/** Call once before the first render so there is no flash of the wrong size or contrast. */
export function initA11y(): void {
  prefs = load()
  applyToDocument(prefs)
}

export function setPrefs(patch: Partial<A11yPrefs>): void {
  prefs = { ...prefs, ...patch }
  applyToDocument(prefs)
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function resetPrefs(): void {
  prefs = DEFAULT_PREFS
  applyToDocument(prefs)
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export const usePrefs = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => prefs,
  )

/** True when the map should jump instead of animate: the OS asks for it or the viewer chose "Reduce". */
export function reducedMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduce') return true
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
