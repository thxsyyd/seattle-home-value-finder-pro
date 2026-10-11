import { useState, type ReactNode } from 'react'
import type { IndexData } from '../data/types'
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
        {chip('basis', parseAdj(f.adj).kind === 'none' ? 'As sold' : 'Today’s dollars', parseAdj(f.adj).kind !== 'none')}
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
          {open === 'price' && index && parseAdj(f.adj).kind === 'none' && <PriceRange min={f.minp} max={f.maxp} histogram={index.histogram} onChange={(minp, maxp) => onChange({ minp, maxp })} />}
          {open === 'price' && (!index || parseAdj(f.adj).kind !== 'none') && (
            <>
              <NumberPair label="Price (today’s dollars)" a={f.minp} b={f.maxp} onA={(minp) => onChange({ minp })} onB={(maxp) => onChange({ maxp })} ph={['No min', 'No max']} />
              <p className="hint">Prices are restated to today’s dollars, so the sold-price histogram is hidden.</p>
            </>
          )}
          {open === 'basis' && (
            <>
              <div role="group" aria-label="Price basis" className="seg">
                {([['none', 'As sold'], ['metro', 'Today: Seattle index'], ['zip', 'Today: ZIP index']] as const).map(([v, t]) => (
                  <button key={v} type="button" aria-pressed={parseAdj(f.adj).kind === v} onClick={() => onChange({ adj: v })}>{t}</button>
                ))}
              </div>
              <label className="pair" style={{ marginTop: 'var(--s-2)' }}>
                <span>Or multiply by</span>
                <input type="number" step={0.1} min={0.1} aria-label="Price multiplier" placeholder="2.1" value={parseAdj(f.adj).kind === 'manual' ? parseAdj(f.adj).mult : ''} onChange={(e) => onChange({ adj: e.target.value && Number(e.target.value) > 0 ? `x${Number(e.target.value)}` : 'none' })} />
              </label>
              <p className="hint">{adjSummary(f.adj, index?.priceIndex)}. Index sources: S&amp;P Case-Shiller via FRED, FHFA. These are market averages, not an appraisal of any one home.</p>
            </>
          )}
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
