export const MIN_PANEL = 320
export const MIN_MAP = 320
export const HANDLE = 12

/** Keep the list at least 320 px wide and leave the map at least 320 px, whatever the window size. */
export function clampPanel(px: number, total: number): number {
  const max = Math.max(MIN_PANEL, total - MIN_MAP - HANDLE)
  return Math.round(Math.min(max, Math.max(MIN_PANEL, px)))
}

/** Default list width: a single comfortable column, never more than a third of a wide window. */
export const DEFAULT_PANEL = 'clamp(380px, 34%, 480px)'

export const CARD_MIN = 300 // matches the grid's minmax(300px, 1fr)
export const CARD_GAP = 16
export const PANEL_PAD = 40 // 20px each side

/** How many card columns fit in a list panel of this width. */
export function columnsFor(panelWidth: number): number {
  const inner = panelWidth - PANEL_PAD
  return Math.max(1, Math.floor((inner + CARD_GAP) / (CARD_MIN + CARD_GAP)))
}

/** Cards shown first: four in one column, three rows when wider, so a wide list never ends in blank space. */
export const pageSizeFor = (cols: number) => (cols <= 1 ? 4 : cols * 3)
/** "Show more" adds whole rows. */
export const stepFor = (cols: number) => (cols <= 1 ? 4 : cols * 2)
