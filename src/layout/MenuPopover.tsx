import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Icon } from '../components/Icon'
import { AccessibilityTool, LanguageSelect } from '../components/SiteTools'
import { useT } from '../i18n'

/** Hamburger menu: the things a visitor rarely needs (method, language, accessibility). On phones it also carries the two header links. */
export function MenuPopover() {
  const t = useT()
  const { search } = useLocation()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const close = () => setOpen(false)
  return (
    <div className="menuwrap" ref={box}>
      <button type="button" className="menu-btn" aria-expanded={open} aria-controls="site-menu" aria-label={t('menu.label')} onClick={() => setOpen(!open)}>
        <Icon name="menu" />
      </button>
      {open && (
        <div id="site-menu" className="pop pop-right menu">
          <Link className="sb-item only-phone" to={{ pathname: '/afford', search }} onClick={close}><Icon name="calculator" /><span className="sb-label">{t('nav.afford')}</span></Link>
          <Link className="sb-item only-phone" to={{ pathname: '/compare', search }} onClick={close}><Icon name="compare" /><span className="sb-label">{t('nav.compare')}</span></Link>
          <Link className="sb-item" to={{ pathname: '/about', search }} onClick={close}><Icon name="info" /><span className="sb-label">{t('nav.method')}</span></Link>
          <hr />
          <LanguageSelect />
          <AccessibilityTool onOpen={close} />
        </div>
      )}
    </div>
  )
}
