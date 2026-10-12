import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../data/useDebouncedValue'
import { useT } from '../i18n'
import { priceShort } from '../lib/format'

interface Props {
  min?: number
  max?: number
  histogram: { step: number; top: number; counts: number[] }
  onChange: (min?: number, max?: number) => void
}

const STEP = 25_000

/** Price histogram with two range inputs (real <input type=range>, so keyboard and screen readers work). */
export function PriceRange({ min, max, histogram: h, onChange }: Props) {
  const t = useT()
  const [lo, setLo] = useState(min ?? 0)
  const [hi, setHi] = useState(max ?? h.top)
  useEffect(() => {
    setLo(min ?? 0)
    setHi(max ?? h.top)
  }, [min, max, h.top])

  const pair = useDebouncedValue(`${lo}:${hi}`, 200)
  useEffect(() => {
    const [a, b] = pair.split(':').map(Number)
    const nextMin = a <= 0 ? undefined : a
    const nextMax = b >= h.top ? undefined : b
    if (nextMin !== min || nextMax !== max) onChange(nextMin, nextMax)
    // only react to the debounced slider value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair])

  const peak = Math.max(...h.counts)
  const bw = 100 / h.counts.length
  const label = (v: number, top: boolean) => (top && v >= h.top ? `${priceShort(h.top)}+` : priceShort(v))

  return (
    <div className="price-range">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label={t('price.hist')} className="hist">
        {h.counts.map((c, i) => {
          const x0 = i * h.step
          const inside = x0 + h.step > lo && x0 < hi
          return <rect key={i} x={i * bw + 0.15} width={bw - 0.3} y={30 - (c / peak) * 28} height={(c / peak) * 28} fill={inside ? 'var(--accent)' : 'var(--border)'} />
        })}
      </svg>
      <div className="range-pair">
        <input type="range" aria-label={t('price.min')} min={0} max={h.top} step={STEP} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - STEP))} />
        <input type="range" aria-label={t('price.max')} min={0} max={h.top} step={STEP} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + STEP))} />
      </div>
      <p className="range-readout" aria-live="polite">
        {t('price.range', { a: label(lo, false), b: label(hi, true) })}
      </p>
    </div>
  )
}
