import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Icon } from '../components/Icon'
import { LangSync } from '../components/SiteTools'
import { useT } from '../i18n'
import { useCollapsed } from '../state/sidebar'
import { SidebarContent } from './Sidebar'

/** Sidebar plus page content for every route. On phones the sidebar becomes a drawer behind a menu button. */
export function AppShell() {
  const t = useT()
  const collapsed = useCollapsed()
  const { search } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawer = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = drawer.current
    if (!d) return
    if (drawerOpen && !d.open) d.showModal()
    if (!drawerOpen && d.open) d.close()
  }, [drawerOpen])

  return (
    <div className="app" data-collapsed={collapsed}>
      <LangSync />
      <a className="skip-link" href="#main-content">{t('skip')}</a>
      <header className="appbar">
        <button type="button" className="appbar-btn" aria-label={t('nav.open')} aria-haspopup="dialog" onClick={() => setDrawerOpen(true)}>
          <Icon name="menu" />
        </button>
        <Link to={{ pathname: '/', search }} className="brand">Seattle Home Value Finder</Link>
      </header>
      <aside className="sidebar">
        <SidebarContent collapsed={collapsed} />
      </aside>
      <div className="content">
        <Outlet />
      </div>
      <dialog ref={drawer} className="drawer" aria-label={t('nav.main')} onClose={() => setDrawerOpen(false)} onClick={(e) => { if (e.target === drawer.current) setDrawerOpen(false) }}>
        {drawerOpen && (
          <>
            <button type="button" className="appbar-btn drawer-close" aria-label={t('nav.close')} onClick={() => setDrawerOpen(false)}>
              <Icon name="close" />
            </button>
            <SidebarContent collapsed={false} drawer onNavigate={() => setDrawerOpen(false)} />
          </>
        )}
      </dialog>
    </div>
  )
}
