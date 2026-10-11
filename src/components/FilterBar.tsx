import { useState, type ReactNode } from 'react'
import type { IndexData } from '../data/types'
import { activeFilterCount, BEST_DEALS, type Filters } from '../lib/filters'
import { priceShort } from '../lib/format'
import { PriceRange } from './PriceRange'

type ChipId = 'price' | 'beds' | 'baths' | 'size' | 'built' | 'model'

interface Props {
  filters: Filters
  index: IndexData | undefined
  onChange: (patch: Partial<Filters>) => void
}

const RESET: Partial<Filters> = {
  minp: undefined, maxp: undefined, beds: undefined, baths: undefined, sfMin: undefined, sfMax: undefined,
  ybMin: undefined, ybMax: undefined, gr: undefined, wf: undefined, dv: undefined,
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

function NumberPair({ label, a, b, onA, onB, ph }: { label: string; a?: number; b?: number; onA: (v?: number) => void; onB: (v?: number) => void; ph: [string, string] }) {
  const parse = (s: string) => (s === '' ? undefined : Number(s))
  return (
    <div role="group" aria-label={label} className="pair">
      <input type="number" inputMode="numeric" min={0} aria-label={`${label}, minimum`} placeholder={ph[0]} value={a ?? ''} onChange={(e) => onA(parse(e.target.value))} />
      <span aria-hidden="true">to</span>
      <input type="number" inputMode="numeric" min={0} aria-label={`${label}, maximum`} placeholder={ph[1]} value={b ?? ''} onChange={(e) => onB(parse(e.target.value))} />
    </div>
  )
}

export function FilterBar({ filters: f, index, onChange }: Props) {
  const [open, setOpen] = useState<ChipId | null>(null)
  const count = activeFilterCount(f)

  const chip = (id: ChipId, text: string, active: boolean): ReactNode => (
    <button type="button" className={`chip${active ? ' on' : ''}`} aria-expanded={open === id} aria-controls={`chip-${id}`} onClick={() => setOpen(open === id ? null : id)}>
      {text}
    </button>
  )
  const priceText = f.minp || f.maxp ? `${f.minp ? priceShort(f.minp) : '$0'}–${f.maxp ? priceShort(f.maxp) : 'any'}` : 'Price'

  return (
    <div className="filterbar">
      <div className="chips" role="toolbar" aria-label="Filters">
        {chip('price', priceText, f.minp !== undefined || f.maxp !== undefined)}
        {chip('beds', f.beds ? `${f.beds}+ beds` : 'Beds', f.beds !== undefined)}
        {chip('baths', f.baths ? `${f.baths}+ baths` : 'Baths', f.baths !== undefined)}
        {chip('size', 'Home size', f.sfMin !== undefined || f.sfMax !== undefined)}
        {chip('built', 'Year built', f.ybMin !== undefined || f.ybMax !== undefined)}
        {chip('model', f.dv !== undefined ? `≥${Math.round(-f.dv * 100)}% below model` : 'Vs. model', f.dv !== undefined)}
        <button type="button" className={`chip${f.wf ? ' on' : ''}`} aria-pressed={!!f.wf} onClick={() => onChange({ wf: f.wf ? undefined : true })}>Waterfront</button>
        <button type="button" className="chip preset" onClick={() => onChange(BEST_DEALS)}>Best deals under $500k</button>
        {count > 0 && <button type="button" className="chip linklike" onClick={() => { onChange(RESET); setOpen(null) }}>Clear all ({count})</button>}
      </div>
      {open && (
        <div id={`chip-${open}`} className="chip-panel">
          {open === 'price' && index && <PriceRange min={f.minp} max={f.maxp} histogram={index.histogram} onChange={(minp, maxp) => onChange({ minp, maxp })} />}
          {open === 'beds' && <Seg label="Bedrooms" value={f.beds} options={[[undefined, 'Any'], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+'], [5, '5+']]} onPick={(beds) => onChange({ beds })} />}
          {open === 'baths' && <Seg label="Bathrooms" value={f.baths} options={[[undefined, 'Any'], [1, '1+'], [1.5, '1.5+'], [2, '2+'], [3, '3+']]} onPick={(baths) => onChange({ baths })} />}
          {open === 'size' && <NumberPair label="Living area (sq ft)" a={f.sfMin} b={f.sfMax} onA={(sfMin) => onChange({ sfMin })} onB={(sfMax) => onChange({ sfMax })} ph={['No min', 'No max']} />}
          {open === 'built' && <NumberPair label="Year built" a={f.ybMin} b={f.ybMax} onA={(ybMin) => onChange({ ybMin })} onB={(ybMax) => onChange({ ybMax })} ph={['1900', '2015']} />}
          {open === 'model' && (
            <>
              <Seg
                label="Sold below model estimate by at least"
                value={f.dv === undefined ? undefined : Math.round(-f.dv * 100)}
                options={[[undefined, 'Any'], [5, '5%'], [10, '10%'], [20, '20%']]}
                onPick={(v) => onChange({ dv: v === undefined ? undefined : -v / 100 })}
              />
              <p className="hint">The model’s usual error is about ±17%, so small gaps are mostly noise.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
