import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useIndex } from '../data/useIndex'
import { useT } from '../i18n'
import { applyFilters, parseFilters } from '../lib/filters'
import { findZip } from '../lib/zipFind'
import { Icon } from './Icon'

/** Jump straight to a ZIP code: type or pick from the list, then Enter. */
export function ZipFinder() {
  const t = useT()
  const index = useIndex()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState('')
  const [missing, setMissing] = useState(false)

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
