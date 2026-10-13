/** Where the person came from when they opened a home, kept in the router's location state so "Back" can say so. */
export type From = { kind: 'results' } | { kind: 'home'; label: string }

export function readFrom(state: unknown): From | null {
  const f = (state as { from?: unknown } | null)?.from as { kind?: unknown; label?: unknown } | undefined
  if (f?.kind === 'results') return { kind: 'results' }
  if (f?.kind === 'home' && typeof f.label === 'string') return { kind: 'home', label: f.label }
  return null
}

/** "$399,950 · ZIP 98144": names a home in the back link. */
export const homeLabel = (price: number, zip: string) => `$${Math.round(price).toLocaleString('en-US')} · ZIP ${zip}`

export const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length === 0 ? 0 : s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
