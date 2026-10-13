import { useRef } from 'react'
import { Icon } from '../components/Icon'
import type { IndexData } from '../data/types'
import { useT } from '../i18n'
import { moreFilterCount, type Filters } from '../lib/filters'
import { parseAdj } from '../lib/priceIndex'
import { FilterModal } from './FilterModal'

interface Props {
  filters: Filters
  index: IndexData | undefined
  count: number
  onChange: (patch: Partial<Filters>) => void
}

/** Quick toggles under the header, plus the Filters button that opens the full list. */
export function FilterChips({ filters: f, index, count, onChange }: Props) {
  const t = useT()
  const modal = useRef<HTMLDialogElement>(null)
  const n = moreFilterCount(f)
  return (
    <section className="chips-row" aria-label={t('filters.label')}>
      <button type="button" className="chip" aria-haspopup="dialog" onClick={() => modal.current?.showModal()}>
        <Icon name="filters" /> {t('filters.title')}{n > 0 && <span className="badge-n">{n}</span>}
      </button>
      <button type="button" className="chip" title={t('show.under.tip')} aria-pressed={f.show === 'under' && f.dv === undefined} onClick={() => onChange({ show: f.show === 'under' ? 'all' : 'under', dv: undefined })}>{t('show.under')}</button>
      <button type="button" className="chip" title={t('chip.waterfront.tip')} aria-pressed={!!f.wf} onClick={() => onChange({ wf: f.wf ? undefined : true })}>{t('chip.waterfront')}</button>
      <button type="button" className="chip" title={t('chip.today.tip')} aria-pressed={parseAdj(f.adj).kind !== 'none'} onClick={() => onChange({ adj: parseAdj(f.adj).kind === 'none' ? 'metro' : 'none' })}>{t('chip.today')}</button>
      <FilterModal ref={modal} filters={f} index={index} count={count} onChange={onChange} />
    </section>
  )
}
