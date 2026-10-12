import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../data/useDebouncedValue'
import { useT } from '../i18n'
import { priceShort } from '../lib/format'

const MIN = 100_000
const MAX = 2_000_000
const STEP = 25_000

/** One slider for the budget ceiling; the far right means "no limit". Commits to the URL after a short pause. */
export function BudgetSlider({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const t = useT()
  const [v, setV] = useState(value ?? MAX)
  useEffect(() => setV(value ?? MAX), [value])
  const settled = useDebouncedValue(v, 200)
  useEffect(() => {
    const next = settled >= MAX ? undefined : settled
    if (next !== value) onChange(next)
    // only react to the debounced slider value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled])

  const label = v >= MAX ? t('budget.any') : t('budget.value', { price: priceShort(v) })
  return (
    <div className="fp-field">
      <label htmlFor="budget" className="fp-legend">
        {t('budget.label')} <strong aria-live="polite">{label}</strong>
      </label>
      <input id="budget" type="range" min={MIN} max={MAX} step={STEP} value={v} onChange={(e) => setV(Number(e.target.value))} aria-valuetext={label} />
    </div>
  )
}
