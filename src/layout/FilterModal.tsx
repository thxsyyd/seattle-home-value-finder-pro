import { forwardRef } from 'react'
import { Seg, NumberPair } from '../components/Controls'
import type { IndexData } from '../data/types'
import { useT } from '../i18n'
import { moreFilterCount, type Filters } from '../lib/filters'
import { adjSummary, parseAdj } from '../lib/priceIndex'

const CLEAR: Partial<Filters> = { minp: undefined, baths: undefined, sfMin: undefined, sfMax: undefined, ybMin: undefined, ybMax: undefined, gr: undefined, wf: undefined, adj: 'none' }

interface Props {
  filters: Filters
  index: IndexData | undefined
  count: number
  onChange: (patch: Partial<Filters>) => void
}

/** Everything beyond the search pill and the quick chips. Changes apply live; the button just shows the resulting count and closes. */
export const FilterModal = forwardRef<HTMLDialogElement, Props>(function FilterModal({ filters: f, index, count, onChange }, ref) {
  const t = useT()
  const adj = parseAdj(f.adj)
  const n = moreFilterCount(f)
  const close = () => (ref as React.RefObject<HTMLDialogElement>).current?.close()
  return (
    <dialog ref={ref} className="modal" aria-labelledby="filters-title" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="modal-head">
        <h2 id="filters-title">{t('filters.title')}</h2>
      </div>
      <div className="modal-body">
        <div className="fp-field">
          <label className="fp-legend" htmlFor="minp">{t('more.minPrice')}</label>
          <input id="minp" className="num-input" type="number" inputMode="numeric" min={0} step={25000} placeholder={t('field.noMin')} value={f.minp ?? ''} onChange={(e) => onChange({ minp: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </div>
        <div className="fp-field">
          <span className="fp-legend">{t('baths.group')}</span>
          <Seg label={t('baths.group')} value={f.baths} options={[[undefined, t('any.cap')], [1, '1+'], [1.5, '1.5+'], [2, '2+'], [3, '3+']]} onPick={(baths) => onChange({ baths })} />
        </div>
        <div className="fp-field">
          <span className="fp-legend">{t('size.label')}</span>
          <NumberPair label={t('size.label')} a={f.sfMin} b={f.sfMax} onA={(sfMin) => onChange({ sfMin })} onB={(sfMax) => onChange({ sfMax })} t={t} />
        </div>
        <div className="fp-field">
          <span className="fp-legend">{t('built.label')}</span>
          <NumberPair label={t('built.label')} a={f.ybMin} b={f.ybMax} onA={(ybMin) => onChange({ ybMin })} onB={(ybMax) => onChange({ ybMax })} t={t} />
        </div>
        <div className="fp-field">
          <span className="fp-legend">{t('more.basis')}</span>
          <div role="group" aria-label={t('basis.group')} className="seg">
            {(['none', 'metro', 'zip'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={adj.kind === v} onClick={() => onChange({ adj: v })}>{t(`basis.${v}`)}</button>
            ))}
          </div>
          <label className="pair" style={{ marginTop: 'var(--s-2)' }}>
            <span>{t('basis.orMultiply')}</span>
            <input type="number" step={0.1} min={0.1} aria-label={t('basis.multiplier')} placeholder="2.1" value={adj.kind === 'manual' ? adj.mult : ''} onChange={(e) => onChange({ adj: e.target.value && Number(e.target.value) > 0 ? `x${Number(e.target.value)}` : 'none' })} />
          </label>
          <p className="hint">{t('basis.note', { summary: adjSummary(f.adj, index?.priceIndex, t) })}</p>
        </div>
      </div>
      <div className="modal-foot">
        <button type="button" className="linklike" disabled={n === 0} onClick={() => onChange(CLEAR)}>{t('filters.clear')}</button>
        <button type="button" className="primary" onClick={close}>{t('filters.show', { n: count.toLocaleString() })}</button>
      </div>
    </dialog>
  )
})
