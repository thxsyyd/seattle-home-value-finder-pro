import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useT } from '../i18n'

/** Frame for the stand-alone pages (calculator, compare, about); navigation lives in the sidebar. */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  const { search } = useLocation()
  const t = useT()
  return (
    <div className="page">
      <main id="main-content" tabIndex={-1} className="page-body">
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
