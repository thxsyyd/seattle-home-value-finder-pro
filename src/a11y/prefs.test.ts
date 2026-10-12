import { describe, expect, it } from 'vitest'
import { applyToDocument, DEFAULT_PREFS, parsePrefs } from './prefs'

describe('accessibility preferences', () => {
  it('falls back to defaults for missing or broken storage', () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS)
    expect(parsePrefs('not json')).toEqual(DEFAULT_PREFS)
    expect(parsePrefs('{"text":"huge","contrast":3}')).toEqual(DEFAULT_PREFS)
  })
  it('keeps valid values', () => {
    expect(parsePrefs('{"text":"xl","contrast":"high","motion":"reduce","underline":true}')).toEqual({
      text: 'xl', contrast: 'high', motion: 'reduce', underline: true,
    })
  })
  it('writes data attributes on the root element', () => {
    const el = document.createElement('html')
    applyToDocument({ text: 'lg', contrast: 'high', motion: 'reduce', underline: true }, el)
    expect(el.dataset).toMatchObject({ text: 'lg', contrast: 'high', motion: 'reduce', underline: 'on' })
  })
})
