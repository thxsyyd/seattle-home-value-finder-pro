import { describe, expect, it } from 'vitest'
import { homeLabel, median, readFrom } from './backTarget'

describe('readFrom', () => {
  it('reads where the person came from', () => {
    expect(readFrom({ from: { kind: 'results' } })).toEqual({ kind: 'results' })
    expect(readFrom({ from: { kind: 'home', label: '$1 · ZIP 98101' } })).toEqual({ kind: 'home', label: '$1 · ZIP 98101' })
  })
  it('returns null for a link opened directly or with odd state', () => {
    expect(readFrom(null)).toBeNull()
    expect(readFrom({})).toBeNull()
    expect(readFrom({ from: { kind: 'home' } })).toBeNull()
    expect(readFrom({ from: { kind: 'other' } })).toBeNull()
  })
})

describe('homeLabel / median', () => {
  it('names a home', () => expect(homeLabel(399950, '98144')).toBe('$399,950 · ZIP 98144'))
  it('takes the middle value', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBe(0)
  })
})
