import { describe, expect, it } from 'vitest'
import { barGeometry } from './rangeBar'

const band = { p10: -0.16, p90: 0.18 }
describe('barGeometry', () => {
  it('puts an exact match in the middle of the bar', () => {
    expect(barGeometry(0, band).marker).toBe(50)
    expect(barGeometry(0, band).centre).toBe(50)
  })
  it('places the error band around the centre using the model band', () => {
    const g = barGeometry(0, band)
    expect(g.bandLeft).toBeCloseTo(34, 5)
    expect(g.bandWidth).toBeCloseTo(34, 5)
  })
  it('puts cheaper sales to the left and dearer ones to the right', () => {
    expect(barGeometry(-0.25, band).marker).toBeLessThan(50)
    expect(barGeometry(0.25, band).marker).toBeGreaterThan(50)
  })
  it('keeps extreme sales on the bar and says so', () => {
    const g = barGeometry(-0.9, band)
    expect(g.marker).toBe(0)
    expect(g.clamped).toBe(true)
    expect(barGeometry(0.1, band).clamped).toBe(false)
  })
})
