import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AccessibilityTool, LanguageSelect } from '../components/SiteTools'
import { Icon, type IconName } from '../components/Icon'
import { useT } from '../i18n'
import { setCollapsed } from '../state/sidebar'

interface Props {
  collapsed: boolean
  /** true inside the phone drawer: always expanded, closes after a choice */
  drawer?: boolean
  onNavigate?: () => void
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sb-group" role="group" aria-label={label}>
      <p className="sb-group-label" aria-hidden="true">{label}</p>
      {children}
    </div>
  )
}

function Item({ to, icon, label, onNavigate, match }: { to: string; icon: IconName; label: string; onNavigate?: () => void; match?: (path: string) => boolean }) {
  const { search, pathname } = useLocation()
  const active = match ? match(pathname) : undefined
  return (
    <NavLink
      to={{ pathname: to, search }}
      end={!match}
      title={label}
      className={({ isActive }) => `sb-item${(active ?? isActive) ? ' active' : ''}`}
      aria-current={(active ?? undefined) ? 'page' : undefined}
      onClick={onNavigate}
    >
      <Icon name={icon} />
      <span className="sb-label">{label}</span>
    </NavLink>
  )
}

export function SidebarContent({ collapsed, drawer, onNavigate }: Props) {
  const t = useT()
  const { search } = useLocation()
  const rail = collapsed && !drawer

  return (
    <nav className="sb" aria-label={t('nav.main')} data-collapsed={rail}>
      <div className="sb-head">
        <Link to={{ pathname: '/', search }} className="sb-brand" onClick={onNavigate}>
          <span className="sb-logo" aria-hidden="true" data-initials="SH" />
          <span className="sb-label">Seattle Home Value Finder</span>
        </Link>
      </div>

      <Group label={t('nav.g.explore')}>
        <Item to="/" icon="map" label={t('nav.map')} match={(p) => p === '/' || p.startsWith('/zip/') || p.startsWith('/home/')} onNavigate={onNavigate} />
      </Group>

      <Group label={t('nav.g.tools')}>
        <Item to="/afford" icon="calculator" label={t('nav.afford')} onNavigate={onNavigate} />
        <Item to="/compare" icon="compare" label={t('nav.compare')} onNavigate={onNavigate} match={(p) => p.startsWith('/compare')} />
      </Group>

      <Group label={t('nav.g.learn')}>
        <Item to="/about" icon="info" label={t('nav.method')} onNavigate={onNavigate} />
      </Group>

      <div className="sb-spacer" />
      <Group label={t('nav.g.settings')}>
        <LanguageSelect />
        <AccessibilityTool />
        {!drawer && (
          <button type="button" className="sb-item" title={collapsed ? t('nav.expand') : t('nav.collapse')} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
            <Icon name={collapsed ? 'right' : 'left'} />
            <span className="sb-label">{collapsed ? t('nav.expand') : t('nav.collapse')}</span>
          </button>
        )}
      </Group>
    </nav>
  )
}
