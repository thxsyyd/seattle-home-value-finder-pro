import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { en, type MsgKey } from './en'
import { zh } from './zh'

export type Lang = 'en' | 'zh'
export const LANGS: { code: Lang; label: string; htmlLang: string }[] = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'zh', label: '中文', htmlLang: 'zh-Hans' },
]
const CATALOGS: Record<Lang, Record<MsgKey, string>> = { en, zh }
const STORE_KEY = 'hvf.lang'

export const isLang = (s: string | null | undefined): s is Lang => s === 'en' || s === 'zh'

/** Fill {name} placeholders. */
export function format(template: string, params?: Record<string, string | number>): string {
  return params ? template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : template
}

export function translate(lang: Lang, key: MsgKey, params?: Record<string, string | number>): string {
  return format(CATALOGS[lang][key] ?? en[key], params)
}

/** Language when the URL has no ?lang: the viewer's own earlier choice in this browser, otherwise English (the browser's language is deliberately ignored). */
export function detectLang(stored: string | null): Lang {
  return isLang(stored) ? stored : 'en'
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORE_KEY)
  } catch {
    return null // storage can be blocked (private windows); the URL still carries the choice
  }
}

export function useLang(): Lang {
  const [params] = useSearchParams()
  const fromUrl = params.get('lang')
  return isLang(fromUrl) ? fromUrl : detectLang(readStored())
}

export type T = (key: MsgKey, params?: Record<string, string | number>) => string

export function useT(): T {
  const lang = useLang()
  return useCallback((key, params) => translate(lang, key, params), [lang])
}

export function useSetLang(): (l: Lang) => void {
  const [, setParams] = useSearchParams()
  return useCallback(
    (l) => {
      try {
        localStorage.setItem(STORE_KEY, l)
      } catch {
        /* ignore */
      }
      setParams((prev) => {
        const p = new URLSearchParams(prev)
        p.set('lang', l)
        return p
      }, { replace: true })
    },
    [setParams],
  )
}
