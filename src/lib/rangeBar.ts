/** Geometry of the "sold price vs. model estimate" bar. Positions are percentages of the bar's width. */
export const RANGE = 0.5 // the bar spans -50% to +50% of the model estimate

export interface BarGeometry {
  /** where the sold price sits, clamped so far-off sales stay on the bar */
  marker: number
  /** left edge and width of the model's typical-error band (p10 to p90) */
  bandLeft: number
  bandWidth: number
  /** where the estimate itself is (always the centre) */
  centre: number
  clamped: boolean
}

const pct = (dev: number) => ((dev + RANGE) / (2 * RANGE)) * 100

export function barGeometry(dev: number, band: { p10: number; p90: number }): BarGeometry {
  const clampedDev = Math.max(-RANGE, Math.min(RANGE, dev))
  return {
    marker: pct(clampedDev),
    bandLeft: pct(band.p10),
    bandWidth: pct(band.p90) - pct(band.p10),
    centre: 50,
    clamped: clampedDev !== dev,
  }
}
