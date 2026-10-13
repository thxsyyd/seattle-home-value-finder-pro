import { Outlet } from 'react-router'
import { AccessibilityDialog, LangSync } from '../components/SiteTools'
import { useT } from '../i18n'
import { Header } from './Header'

/** Header on every page; the page itself fills the rest. */
export function AppShell() {
  const t = useT()
  return (
    <div className="app">
      <LangSync />
      <AccessibilityDialog />
      <a className="skip-link" href="#main-content">{t('skip')}</a>
      <Header />
      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}
