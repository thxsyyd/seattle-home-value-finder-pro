import type { T } from '../i18n'

/** Row of mutually exclusive number buttons ("Any, 1+, 2+ ..."). */
export function Seg({ label, value, options, onPick }: { label: string; value: number | undefined; options: [number | undefined, string][]; onPick: (v?: number) => void }) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map(([v, text]) => (
        <button key={text} type="button" aria-pressed={value === v} onClick={() => onPick(v)}>{text}</button>
      ))}
    </div>
  )
}

/** "min to max" pair of number inputs. */
export function NumberPair({ label, a, b, onA, onB, t }: { label: string; a?: number; b?: number; onA: (v?: number) => void; onB: (v?: number) => void; t: T }) {
  const parse = (s: string) => (s === '' ? undefined : Number(s))
  return (
    <div role="group" aria-label={label} className="pair">
      <input type="number" inputMode="numeric" min={0} aria-label={t('field.minOf', { label })} placeholder={t('field.noMin')} value={a ?? ''} onChange={(e) => onA(parse(e.target.value))} />
      <span aria-hidden="true">{t('field.to')}</span>
      <input type="number" inputMode="numeric" min={0} aria-label={t('field.maxOf', { label })} placeholder={t('field.noMax')} value={b ?? ''} onChange={(e) => onB(parse(e.target.value))} />
    </div>
  )
}
