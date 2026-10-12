import { Link, useLocation } from 'react-router'
import { useT } from '../i18n'

export function Placeholder({ titleKey }: { titleKey: 'notFound' }) {
  const t = useT()
  const { search } = useLocation()
  return (
    <div style={{ padding: 'var(--s-4)' }}>
      <h1 style={{ fontSize: '1.25rem', margin: 0 }}>{t(titleKey)}</h1>
      <p>
        <Link to={{ pathname: '/', search }}>{t('backToMapShort')}</Link>
      </p>
    </div>
  )
}
