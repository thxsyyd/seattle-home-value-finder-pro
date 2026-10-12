import { useState } from 'react'
import { useT } from '../i18n'
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
  const t = useT()
  const [price, setPrice] = useState(Math.round(initialPrice))
  const [s, setS] = useState({ ...DEFAULT_LOAN, ratePct })
  const set = (k: keyof typeof s) => (n: number) => setS((p) => ({ ...p, [k]: n }))
  const ok = [price, s.downPct, s.ratePct, s.years, s.taxPct, s.insPct, s.hoaMonthly].every(Number.isFinite) && price > 0 && s.years > 0
  const b = ok ? breakdown({ ...s, price }) : null
  const rows: [string, number | undefined][] = b
    ? [[t('calc.pi'), b.pi], [t('calc.taxRow'), b.tax], [t('calc.insRow'), b.ins], [t('calc.pmi'), b.pmi || undefined], [t('calc.hoa'), b.hoa || undefined]]
    : []

  return (
    <div className="calc">
      <div className="fields">
        {priceEditable && <Field label={t('calc.price')} value={price} onChange={setPrice} step={5000} suffix="$" />}
        <Field label={t('calc.down')} value={s.downPct} onChange={set('downPct')} suffix="%" />
        <Field label={t('calc.rate')} value={s.ratePct} onChange={set('ratePct')} step={0.125} suffix="%" />
        <Field label={t('calc.term')} value={s.years} onChange={set('years')} suffix={t('calc.years')} />
        <Field label={t('calc.tax')} value={s.taxPct} onChange={set('taxPct')} step={0.05} suffix={t('calc.perYear')} />
        <Field label={t('calc.ins')} value={s.insPct} onChange={set('insPct')} step={0.05} suffix={t('calc.perYear')} />
        <Field label={t('calc.hoa')} value={s.hoaMonthly} onChange={set('hoaMonthly')} step={25} suffix={t('calc.perMonthUnit')} />
      </div>
      {b && (
        <div aria-live="polite">
          <p className="calc-total">{money(b.total)}<span> {t('calc.perMonth')}</span></p>
          <dl className="calc-rows">
            {rows.filter(([, v]) => v !== undefined).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{money(v!)}</dd></div>
            ))}
          </dl>
          <p className="hint">{t('calc.hint', { loan: money(b.loan) })}</p>
        </div>
      )}
    </div>
  )
}
