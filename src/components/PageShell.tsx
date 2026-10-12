import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useT } from '../i18n'
import { SiteTools } from './SiteTools'

/** Frame for the stand-alone pages (calculator, compare, about). */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  const { search } = useLocation()
  const t = useT()
  return (
    <div className="page">
      <header className="topbar">
        <Link to={{ pathname: '/', search }} className="brand">Seattle Home Value Finder</Link>
        <nav className="topnav" aria-label={t('nav.site')}>
          <Link to={{ pathname: '/', search }}>{t('nav.backToMap')}</Link>
          <SiteTools />
        </nav>
      </header>
      <main className="page-body">
        <h1>{title}</h1>
        {children}
      </main>
      <footer className="page-footer">
        <span>{t('credit')}</span>
        <span>{t('footer.feedbackNote')} <Link to={{ pathname: '/about', search }}>{t('footer.data')}</Link></span>
      </footer>
    </div>
  )
}
