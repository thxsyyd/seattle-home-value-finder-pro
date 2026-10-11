import { describe, expect, it } from 'vitest'
import { describeDev, UNUSUAL_DEV } from './model'

const band = { p10: -0.16, p90: 0.18 }

describe('describeDev', () => {
  it('calls gaps inside the error band "near"', () => {
    expect(describeDev(-0.1, band)).toMatchObject({ tone: 'near', arrow: '≈', unusual: false })
    expect(describeDev(0.17, band).tone).toBe('near')
  })
  it('flags gaps beyond the band as below/above', () => {
    expect(describeDev(-0.25, band)).toMatchObject({ tone: 'below', arrow: '▼', text: '25% below model estimate' })
    expect(describeDev(0.3, band)).toMatchObject({ tone: 'above', arrow: '▲', text: '30% above model estimate' })
  })
  it('marks very large negative gaps as unusual sales', () => {
    expect(describeDev(UNUSUAL_DEV, band).unusual).toBe(true)
    expect(describeDev(UNUSUAL_DEV + 0.01, band).unusual).toBe(false)
  })
})
