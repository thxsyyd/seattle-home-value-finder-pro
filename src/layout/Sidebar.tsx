import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AccessibilityTool, LanguageSelect } from '../components/SiteTools'
import { Icon, type IconName } from '../components/Icon'
import { useIndex } from '../data/useIndex'
import { useT } from '../i18n'
import { applyFilters, BEST_DEALS, parseFilters } from '../lib/filters'
import { findZip } from '../lib/zipFind'
import { MapControls } from '../map/MapControls'
import { setCollapsed } from '../state/sidebar'
import { useFilters } from '../state/useFilters'

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

/** Jump straight to a ZIP code: type or pick from the list, then Enter. */
function ZipFinder({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const t = useT()
  const index = useIndex()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState('')
  const [missing, setMissing] = useState(false)

  if (collapsed) {
    return (
      <button type="button" className="sb-item" title={t('nav.zips')} onClick={() => setCollapsed(false)}>
        <Icon name="search" />
        <span className="sb-label">{t('nav.zips')}</span>
      </button>
    )
  }

  const go = (e: FormEvent) => {
    e.preventDefault()
    const zips = index.data?.zips ?? []
    const zip = findZip(value, zips.map((z) => z.zip))
    const row = zips.find((z) => z.zip === zip)
    if (!zip || !row) {
      setMissing(true)
      return
    }
    setMissing(false)
    setValue('')
    const next = applyFilters(params, { ...parseFilters(params), ll: [row.centroid[1], row.centroid[0]], z: 12.5 })
    navigate({ pathname: `/zip/${zip}`, search: `?${next.toString()}` })
    onNavigate?.()
  }

  return (
    <form className="sb-search" role="search" onSubmit={go}>
      <label>
        <span className="sr-only">{t('nav.zips')}</span>
        <Icon name="search" />
        <input
          type="search"
          inputMode="numeric"
          list="zip-options"
          autoComplete="off"
          placeholder={t('nav.zipPlaceholder')}
          value={value}
          aria-invalid={missing}
          aria-describedby={missing ? 'zip-missing' : undefined}
          onChange={(e) => { setValue(e.target.value); setMissing(false) }}
        />
      </label>
      <datalist id="zip-options">{(index.data?.zips ?? []).map((z) => <option key={z.zip} value={z.zip} />)}</datalist>
      {missing && <p id="zip-missing" role="alert" className="sb-error">{t('nav.zipNone')}</p>}
    </form>
  )
}

export function SidebarContent({ collapsed, drawer, onNavigate }: Props) {
  const t = useT()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const [filters, setFilters] = useFilters()
  const rail = collapsed && !drawer
  const onMap = pathname === '/' || pathname.startsWith('/zip/') || pathname.startsWith('/home/')

  const bestDeals = () => {
    setFilters({ ...BEST_DEALS, ll: [47.6, -122.25], z: 11.3 })
    if (pathname !== '/') navigate({ pathname: '/', search })
    onNavigate?.()
  }

  return (
    <nav className="sb" aria-label={t('nav.main')} data-collapsed={rail}>
      <div className="sb-head">
        <Link to={{ pathname: '/', search }} className="sb-brand" onClick={onNavigate}>
          <span className="sb-logo" aria-hidden="true" data-initials="SH" />
          <span className="sb-label">Seattle Home Value Finder</span>
        </Link>
      </div>

      <ZipFinder collapsed={rail} onNavigate={onNavigate} />

      <Group label={t('nav.g.explore')}>
        <Item to="/" icon="map" label={t('nav.map')} match={(p) => p === '/' || p.startsWith('/zip/') || p.startsWith('/home/')} onNavigate={onNavigate} />
        <button type="button" className="sb-item" title={t('chip.best')} onClick={bestDeals}>
          <Icon name="star" />
          <span className="sb-label">{t('chip.best')}</span>
        </button>
      </Group>

      {onMap && (
        <Group label={t('nav.g.map')}>
          {rail ? (
            <button type="button" className="sb-item" title={t('nav.mapSettingsShort')} aria-label={t('nav.mapSettingsShort')} onClick={() => setCollapsed(false)}>
              <Icon name="layers" />
            </button>
          ) : (
            <MapControls layer={filters.layer} metric={filters.metric} onLayer={(layer) => setFilters({ layer })} onMetric={(metric) => setFilters({ metric })} />
          )}
        </Group>
      )}

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
