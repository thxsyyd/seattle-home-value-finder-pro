export const MIN_PANEL = 320
export const MIN_MAP = 320
export const HANDLE = 12

/** Keep the list at least 320 px wide and leave the map at least 320 px, whatever the window size. */
export function clampPanel(px: number, total: number): number {
  const max = Math.max(MIN_PANEL, total - MIN_MAP - HANDLE)
  return Math.round(Math.min(max, Math.max(MIN_PANEL, px)))
}
