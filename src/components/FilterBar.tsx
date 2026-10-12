import type { IndexData } from '../data/types'
import { useT, type T } from '../i18n'
import { effectiveDv, moreFilterCount, type Filters, type ShowKey } from '../lib/filters'
import { adjSummary, parseAdj } from '../lib/priceIndex'
import { BudgetSlider } from './BudgetSlider'
import { ZipFinder } from './ZipFinder'

interface Props {
  filters: Filters
  index: IndexData | undefined
  onChange: (patch: Partial<Filters>) => void
}

/** Everything "More filters" can clear. The budget, bedrooms and the show toggle are not part of it. */
const CLEAR_MORE: Partial<Filters> = { minp: undefined, baths: undefined, sfMin: undefined, sfMax: undefined, ybMin: undefined, ybMax: undefined, gr: undefined, wf: undefined, adj: 'none' }

function Seg({ label, value, options, onPick }: { label: string; value: number | undefined; options: [number | undefined, string][]; onPick: (v?: number) => void }) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map(([v, text]) => (
        <button key={text} type="button" aria-pressed={value === v} onClick={() => onPick(v)}>{text}</button>
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

/**
 * The first screen answers one question (what sold below the model's estimate, within a budget?), so only
 * a ZIP search, the show toggle, budget and bedrooms are always visible. The rest sits under "More filters".
 */
export function FilterBar({ filters: f, index, onChange }: Props) {
  const t = useT()
  const more = moreFilterCount(f)
  const adj = parseAdj(f.adj)
  const shows: [ShowKey, string][] = [['all', t('show.all')], ['under', t('show.under')]]

  return (
    <div className="fp" role="group" aria-label={t('filters.label')}>
      <ZipFinder />

      <div className="fp-field" role="group" aria-label={t('show.label')}>
        <span className="fp-legend" aria-hidden="true">{t('show.label')}</span>
        <div className="seg two">
          {shows.map(([v, text]) => (
            <button key={v} type="button" aria-pressed={f.show === v && (v === 'all' || effectiveDv(f) !== undefined)} onClick={() => onChange({ show: v, dv: undefined })}>{text}</button>
          ))}
        </div>
        <details className="explain">
          <summary>{t('show.explainSummary')}</summary>
          <p>{t('show.explain')}</p>
        </details>
      </div>

      <BudgetSlider value={f.maxp} onChange={(maxp) => onChange({ maxp })} />

      <div className="fp-field">
        <span className="fp-legend" aria-hidden="true">{t('beds.group')}</span>
        <Seg label={t('beds.group')} value={f.beds} options={[[undefined, t('any.cap')], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+']]} onPick={(beds) => onChange({ beds })} />
      </div>

      <details className="more">
        <summary>{more > 0 ? t('more.countN', { n: more }) : t('more.label')}</summary>
        <div className="more-body">
          <div className="fp-field">
            <span className="fp-legend" aria-hidden="true">{t('baths.group')}</span>
            <Seg label={t('baths.group')} value={f.baths} options={[[undefined, t('any.cap')], [1, '1+'], [1.5, '1.5+'], [2, '2+'], [3, '3+']]} onPick={(baths) => onChange({ baths })} />
          </div>
          <div className="fp-field">
            <span className="fp-legend" aria-hidden="true">{t('size.label')}</span>
            <NumberPair label={t('size.label')} a={f.sfMin} b={f.sfMax} onA={(sfMin) => onChange({ sfMin })} onB={(sfMax) => onChange({ sfMax })} t={t} />
          </div>
          <div className="fp-field">
            <span className="fp-legend" aria-hidden="true">{t('built.label')}</span>
            <NumberPair label={t('built.label')} a={f.ybMin} b={f.ybMax} onA={(ybMin) => onChange({ ybMin })} onB={(ybMax) => onChange({ ybMax })} t={t} />
          </div>
          <label className="check">
            <input type="checkbox" checked={!!f.wf} onChange={(e) => onChange({ wf: e.target.checked ? true : undefined })} /> {t('chip.waterfront')}
          </label>
          <div className="fp-field">
            <label className="fp-legend" htmlFor="minp">{t('more.minPrice')}</label>
            <input id="minp" className="num-input" type="number" inputMode="numeric" min={0} step={25000} placeholder={t('field.noMin')} value={f.minp ?? ''} onChange={(e) => onChange({ minp: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <div className="fp-field">
            <span className="fp-legend" aria-hidden="true">{t('more.basis')}</span>
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
          {more > 0 && <button type="button" className="linklike" onClick={() => onChange(CLEAR_MORE)}>{t('chip.clear', { n: more })}</button>}
        </div>
      </details>
    </div>
  )
}
