import { useState, type ReactNode } from 'react'
import type { IndexData } from '../data/types'
import { useT, type T } from '../i18n'
import { activeFilterCount, BEST_DEALS, type Filters } from '../lib/filters'
import { priceShort } from '../lib/format'
import { adjSummary, parseAdj } from '../lib/priceIndex'
import { PriceRange } from './PriceRange'

type ChipId = 'price' | 'basis' | 'beds' | 'baths' | 'size' | 'built' | 'model'

interface Props {
  filters: Filters
  index: IndexData | undefined
  onChange: (patch: Partial<Filters>) => void
}

const RESET: Partial<Filters> = {
  minp: undefined, maxp: undefined, beds: undefined, baths: undefined, sfMin: undefined, sfMax: undefined,
  ybMin: undefined, ybMax: undefined, gr: undefined, wf: undefined, dv: undefined, adj: 'none',
}

function Seg({ label, value, options, onPick }: { label: string; value: number | undefined; options: [number | undefined, string][]; onPick: (v?: number) => void }) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map(([v, t]) => (
        <button key={t} type="button" aria-pressed={value === v} onClick={() => onPick(v)}>{t}</button>
      ))}
    </div>
  )
}

function NumberPair({ label, a, b, onA, onB, t }: { label: string; a?: number; b?: number; onA: (v?: number) => void; onB: (v?: number) => void; t: T }) {
  const parse = (s: string) => (s === '' ? undefined : Number(s))
  return (
    <div role="group" aria-label={label} className="pair">
      <input type="number" inputMode="numeric" min={0} aria-label={t('field.minOf', { label })} placeholder={t('field.noMin')} value={a ?? ''} onChange={(e) => onA(parse(e.target.value))} />
      <span aria-hidden="true">{t('field.to')}</span>
      <input type="number" inputMode="numeric" min={0} aria-label={t('field.maxOf', { label })} placeholder={t('field.noMax')} value={b ?? ''} onChange={(e) => onB(parse(e.target.value))} />
    </div>
  )
}

export function FilterBar({ filters: f, index, onChange }: Props) {
  const t = useT()
  const [open, setOpen] = useState<ChipId | null>(null)
  const count = activeFilterCount(f)

  const chip = (id: ChipId, text: string, active: boolean): ReactNode => (
    <button type="button" className={`chip${active ? ' on' : ''}`} aria-expanded={open === id} aria-controls={`chip-${id}`} onClick={() => setOpen(open === id ? null : id)}>
      {text}
    </button>
  )
  const priceText = f.minp || f.maxp ? `${f.minp ? priceShort(f.minp) : '$0'}–${f.maxp ? priceShort(f.maxp) : t('any')}` : t('chip.price')

  return (
    <div className="filterbar">
      <div className="chips" role="toolbar" aria-label={t('filters.label')}>
        {chip('price', priceText, f.minp !== undefined || f.maxp !== undefined)}
        {chip('basis', parseAdj(f.adj).kind === 'none' ? t('chip.asSold') : t('chip.today'), parseAdj(f.adj).kind !== 'none')}
        {chip('beds', f.beds ? t('chip.bedsN', { n: f.beds }) : t('chip.beds'), f.beds !== undefined)}
        {chip('baths', f.baths ? t('chip.bathsN', { n: f.baths }) : t('chip.baths'), f.baths !== undefined)}
        {chip('size', t('chip.size'), f.sfMin !== undefined || f.sfMax !== undefined)}
        {chip('built', t('chip.built'), f.ybMin !== undefined || f.ybMax !== undefined)}
        {chip('model', f.dv !== undefined ? t('chip.modelN', { n: Math.round(-f.dv * 100) }) : t('chip.model'), f.dv !== undefined)}
        <button type="button" className={`chip${f.wf ? ' on' : ''}`} aria-pressed={!!f.wf} onClick={() => onChange({ wf: f.wf ? undefined : true })}>{t('chip.waterfront')}</button>
        <button type="button" className="chip preset" onClick={() => onChange(BEST_DEALS)}>{t('chip.best')}</button>
        {count > 0 && <button type="button" className="chip linklike" onClick={() => { onChange(RESET); setOpen(null) }}>{t('chip.clear', { n: count })}</button>}
      </div>
      {open && (
        <div id={`chip-${open}`} className="chip-panel">
          {open === 'price' && index && parseAdj(f.adj).kind === 'none' && <PriceRange min={f.minp} max={f.maxp} histogram={index.histogram} onChange={(minp, maxp) => onChange({ minp, maxp })} />}
          {open === 'price' && (!index || parseAdj(f.adj).kind !== 'none') && (
            <>
              <NumberPair label={t('price.todayLabel')} a={f.minp} b={f.maxp} onA={(minp) => onChange({ minp })} onB={(maxp) => onChange({ maxp })} t={t} />
              <p className="hint">{t('price.todayNote')}</p>
            </>
          )}
          {open === 'basis' && (
            <>
              <div role="group" aria-label={t('basis.group')} className="seg">
                {(['none', 'metro', 'zip'] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={parseAdj(f.adj).kind === v} onClick={() => onChange({ adj: v })}>{t(`basis.${v}`)}</button>
                ))}
              </div>
              <label className="pair" style={{ marginTop: 'var(--s-2)' }}>
                <span>{t('basis.orMultiply')}</span>
                <input type="number" step={0.1} min={0.1} aria-label={t('basis.multiplier')} placeholder="2.1" value={parseAdj(f.adj).kind === 'manual' ? parseAdj(f.adj).mult : ''} onChange={(e) => onChange({ adj: e.target.value && Number(e.target.value) > 0 ? `x${Number(e.target.value)}` : 'none' })} />
              </label>
              <p className="hint">{t('basis.note', { summary: adjSummary(f.adj, index?.priceIndex, t) })}</p>
            </>
          )}
          {open === 'beds' && <Seg label={t('beds.group')} value={f.beds} options={[[undefined, t('any.cap')], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+'], [5, '5+']]} onPick={(beds) => onChange({ beds })} />}
          {open === 'baths' && <Seg label={t('baths.group')} value={f.baths} options={[[undefined, t('any.cap')], [1, '1+'], [1.5, '1.5+'], [2, '2+'], [3, '3+']]} onPick={(baths) => onChange({ baths })} />}
          {open === 'size' && <NumberPair label={t('size.label')} a={f.sfMin} b={f.sfMax} onA={(sfMin) => onChange({ sfMin })} onB={(sfMax) => onChange({ sfMax })} t={t} />}
          {open === 'built' && <NumberPair label={t('built.label')} a={f.ybMin} b={f.ybMax} onA={(ybMin) => onChange({ ybMin })} onB={(ybMax) => onChange({ ybMax })} t={t} />}
          {open === 'model' && (
            <>
              <Seg
                label={t('model.group')}
                value={f.dv === undefined ? undefined : Math.round(-f.dv * 100)}
                options={[[undefined, t('any.cap')], [5, '5%'], [10, '10%'], [20, '20%']]}
                onPick={(v) => onChange({ dv: v === undefined ? undefined : -v / 100 })}
              />
              <p className="hint">{t('model.hint')}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
