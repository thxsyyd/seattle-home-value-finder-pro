import { describe, expect, it } from 'vitest'
import { en } from './en'
import { detectLang, format, translate } from './index'
import { zh } from './zh'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('catalogues', () => {
  it('give Chinese text for every English key and nothing extra', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })
  it('use the same placeholders in both languages', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(zh[k]), k).toEqual(placeholders(en[k]))
    }
  })
  it('have no empty strings', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[k].length, `en ${k}`).toBeGreaterThan(0)
      expect(zh[k].length, `zh ${k}`).toBeGreaterThan(0)
    }
  })
})

describe('helpers', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(format('{a} and {b}', { a: 1 })).toBe('1 and {b}')
    expect(translate('zh', 'list.inView', { n: 12 })).toBe('视野内 12 套')
    expect(translate('en', 'list.inView', { n: 12 })).toBe('12 homes in view')
  })
  it('detects the language: stored choice first, then the browser', () => {
    expect(detectLang('zh', 'en-US')).toBe('zh')
    expect(detectLang(null, 'zh-CN')).toBe('zh')
    expect(detectLang('fr', 'en-GB')).toBe('en')
    expect(detectLang(null, undefined)).toBe('en')
  })
})
