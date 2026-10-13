import { describe, expect, it } from 'vitest'
import { clampPanel, columnsFor, HANDLE, MIN_MAP, MIN_PANEL, pageSizeFor, stepFor } from './split'

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

describe('columnsFor', () => {
  it('is one column until two cards fit side by side', () => {
    expect(columnsFor(320)).toBe(1)
    expect(columnsFor(655)).toBe(1)
    expect(columnsFor(656)).toBe(2)
  })
  it('adds a third column at 972 px', () => {
    expect(columnsFor(971)).toBe(2)
    expect(columnsFor(972)).toBe(3)
  })
  it('never returns less than one', () => {
    expect(columnsFor(0)).toBe(1)
  })
})

describe('pageSizeFor / stepFor', () => {
  it('shows four cards in one column and three rows otherwise', () => {
    expect([1, 2, 3].map(pageSizeFor)).toEqual([4, 6, 9])
  })
  it('adds whole rows', () => {
    expect([1, 2, 3].map(stepFor)).toEqual([4, 4, 6])
  })
})
