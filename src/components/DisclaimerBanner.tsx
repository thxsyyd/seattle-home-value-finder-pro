import { useState } from 'react'
import { useT } from '../i18n'

export function DisclaimerBanner({ range }: { range?: [string, string] }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const span = range ? `${range[0].slice(0, 7)} – ${range[1].slice(0, 7)}` : '2014-05 – 2015-05'
  return (
    <aside aria-label={t('banner.label')} className="disclaimer">
      <strong>{t('banner.strong')}</strong> {t('banner.body', { span })}{' '}
      <button type="button" className="linklike" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? t('banner.less') : t('banner.more')}
      </button>
      {open && <p style={{ margin: 'var(--s-2) 0 0' }}>{t('banner.detail')}</p>}
    </aside>
  )
}
