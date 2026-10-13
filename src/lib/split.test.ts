import { describe, expect, it } from 'vitest'
import { clampPanel, HANDLE, MIN_MAP, MIN_PANEL } from './split'

describe('clampPanel', () => {
  it('leaves a sensible width alone', () => {
    expect(clampPanel(600, 1400)).toBe(600)
  })
  it('never lets the list get narrower than its minimum', () => {
    expect(clampPanel(50, 1400)).toBe(MIN_PANEL)
  })
  it('always leaves room for the map and the handle', () => {
    expect(clampPanel(5000, 1400)).toBe(1400 - MIN_MAP - HANDLE)
  })
  it('falls back to the minimum when the window is too narrow for both', () => {
    expect(clampPanel(500, 500)).toBe(MIN_PANEL)
  })
})
