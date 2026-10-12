import { useEffect, useRef } from 'react'
import { resetPrefs, setPrefs, usePrefs, type A11yPrefs } from '../a11y/prefs'
import { LANGS, useLang, useSetLang, useT, type Lang } from '../i18n'
import { Icon } from './Icon'

function Choice<K extends keyof A11yPrefs>({ label, name, value, options }: { label: string; name: K; value: A11yPrefs[K]; options: [A11yPrefs[K], string][] }) {
  return (
    <fieldset className="a11y-field">
      <legend>{label}</legend>
      <div className="seg">
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => setPrefs({ [name]: v } as Partial<A11yPrefs>)}>{text}</button>
        ))}
      </div>
    </fieldset>
  )
}

/** Keeps <html lang> in step with the chosen language. Rendered once, by the app shell. */
export function LangSync() {
  const lang = useLang()
  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? 'en'
  }, [lang])
  return null
}

export function LanguageSelect() {
  const t = useT()
  const lang = useLang()
  const setLang = useSetLang()
  return (
    <label className="sb-field">
      <Icon name="globe" />
      <span className="sb-label">{t('lang.label')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t('lang.label')} lang={lang}>
        {LANGS.map((l) => <option key={l.code} value={l.code} lang={l.htmlLang}>{l.label}</option>)}
      </select>
    </label>
  )
}

/** Accessibility settings: a button for the sidebar plus the modal dialog it opens. */
export function AccessibilityTool({ onOpen }: { onOpen?: () => void }) {
  const t = useT()
  const prefs = usePrefs()
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" className="sb-item" title={t('a11y.button')} aria-haspopup="dialog" onClick={() => { onOpen?.(); dialog.current?.showModal() }}>
        <Icon name="access" />
        <span className="sb-label">{t('a11y.button')}</span>
      </button>
      <dialog ref={dialog} className="a11y-dialog" aria-labelledby="a11y-title" onClick={(e) => { if (e.target === dialog.current) dialog.current?.close() }}>
        <h2 id="a11y-title">{t('a11y.title')}</h2>
        <Choice label={t('a11y.text')} name="text" value={prefs.text} options={[['base', t('a11y.text.base')], ['lg', t('a11y.text.lg')], ['xl', t('a11y.text.xl')]]} />
        <Choice label={t('a11y.contrast')} name="contrast" value={prefs.contrast} options={[['base', t('a11y.contrast.base')], ['high', t('a11y.contrast.high')]]} />
        <Choice label={t('a11y.motion')} name="motion" value={prefs.motion} options={[['system', t('a11y.motion.system')], ['reduce', t('a11y.motion.reduce')]]} />
        <fieldset className="a11y-field">
          <legend>{t('a11y.links')}</legend>
          <label className="check">
            <input type="checkbox" checked={prefs.underline} onChange={(e) => setPrefs({ underline: e.target.checked })} /> {t('a11y.links.underline')}
          </label>
        </fieldset>
        <p className="hint">{t('a11y.note')}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={resetPrefs}>{t('a11y.reset')}</button>
          <button type="button" className="primary" onClick={() => dialog.current?.close()}>{t('a11y.close')}</button>
        </div>
      </dialog>
    </>
  )
}
