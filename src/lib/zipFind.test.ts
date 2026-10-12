import { describe, expect, it } from 'vitest'
import { findZip } from './zipFind'

const zips = ['98103', '98004']
describe('findZip', () => {
  it('accepts a listed ZIP, ignoring spaces and stray characters', () => {
    expect(findZip('98103', zips)).toBe('98103')
    expect(findZip(' 98-004 ', zips)).toBe('98004')
  })
  it('rejects unknown, short or empty input', () => {
    expect(findZip('98999', zips)).toBeNull()
    expect(findZip('981', zips)).toBeNull()
    expect(findZip('', zips)).toBeNull()
  })
})
