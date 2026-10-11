import { useState } from 'react'
import { breakdown, DEFAULT_LOAN } from '../lib/finance'
import { money } from '../lib/format'

function Field({ label, value, onChange, step = 1, suffix }: { label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input type="number" inputMode="decimal" step={step} min={0} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </span>
    </label>
  )
}

/** Monthly-cost estimate. All inputs are editable; defaults are generic planning numbers, not quotes. */
export function MortgageCalc({ price: initialPrice, ratePct, priceEditable = true }: { price: number; ratePct: number; priceEditable?: boolean }) {
  const [price, setPrice] = useState(Math.round(initialPrice))
  const [s, setS] = useState({ ...DEFAULT_LOAN, ratePct })
  const set = (k: keyof typeof s) => (n: number) => setS((p) => ({ ...p, [k]: n }))
  const ok = [price, s.downPct, s.ratePct, s.years, s.taxPct, s.insPct, s.hoaMonthly].every(Number.isFinite) && price > 0 && s.years > 0
  const b = ok ? breakdown({ ...s, price }) : null
  const rows: [string, number | undefined][] = b
    ? [['Principal and interest', b.pi], ['Property tax', b.tax], ['Home insurance', b.ins], ['Mortgage insurance (PMI)', b.pmi || undefined], ['HOA', b.hoa || undefined]]
    : []

  return (
    <div className="calc">
      <div className="fields">
        {priceEditable && <Field label="Home price" value={price} onChange={setPrice} step={5000} suffix="$" />}
        <Field label="Down payment" value={s.downPct} onChange={set('downPct')} suffix="%" />
        <Field label="Interest rate" value={s.ratePct} onChange={set('ratePct')} step={0.125} suffix="%" />
        <Field label="Loan term" value={s.years} onChange={set('years')} suffix="years" />
        <Field label="Property tax" value={s.taxPct} onChange={set('taxPct')} step={0.05} suffix="% / yr" />
        <Field label="Insurance" value={s.insPct} onChange={set('insPct')} step={0.05} suffix="% / yr" />
        <Field label="HOA" value={s.hoaMonthly} onChange={set('hoaMonthly')} step={25} suffix="$ / mo" />
      </div>
      {b && (
        <div aria-live="polite">
          <p className="calc-total">{money(b.total)}<span> per month</span></p>
          <dl className="calc-rows">
            {rows.filter(([, v]) => v !== undefined).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{money(v!)}</dd></div>
            ))}
          </dl>
          <p className="hint">Loan amount {money(b.loan)}. Estimates only: tax, insurance and PMI vary by home and lender.</p>
        </div>
      )}
    </div>
  )
}
