import { Link, useLocation } from 'react-router'
import { Icon } from '../components/Icon'
import { useT } from '../i18n'
import { MenuPopover } from './MenuPopover'
import { SearchPill } from './SearchPill'

/** Logo, the three-part search pill, two tool links and the menu. */
export function Header() {
  const t = useT()
  const { search } = useLocation()
  return (
    <header className="hdr">
      <Link to={{ pathname: '/', search }} className="hdr-brand" aria-label="Seattle Home Value Finder">
        <span className="logo" aria-hidden="true"><Icon name="house" /></span>
        <span className="hdr-name">Seattle Home Value Finder</span>
      </Link>
      <SearchPill />
      <nav className="hdr-right" aria-label={t('nav.tools')}>
        <Link className="hdr-link only-desktop" to={{ pathname: '/afford', search }}>{t('nav.afford')}</Link>
        <Link className="hdr-link only-desktop" to={{ pathname: '/compare', search }}>{t('nav.compare')}</Link>
        <MenuPopover />
      </nav>
    </header>
  )
}
