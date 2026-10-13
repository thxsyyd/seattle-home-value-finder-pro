import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BudgetSlider } from '../components/BudgetSlider'
import { Seg } from '../components/Controls'
import { Icon } from '../components/Icon'
import { ZipFinder } from '../components/ZipFinder'
import { useT } from '../i18n'
import { priceShort } from '../lib/format'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useFilters } from '../state/useFilters'

type Seg3 = 'zip' | 'budget' | 'beds'

/** The three settings that define a search, as one pill (Airbnb-style): ZIP, budget ceiling, bedrooms. */
export function SearchPill() {
  const t = useT()
  const [f, setFilters] = useFilters()
  const phone = useMediaQuery('(max-width: 767px)')
  const [open, setOpen] = useState<Seg3 | 'all' | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(null)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const budget = f.maxp === undefined ? t('search.budgetAny') : t('search.budget', { price: priceShort(f.maxp) })
  const beds = f.beds ? t('search.beds', { n: f.beds }) : t('search.bedsAny')

  const zipPanel: ReactNode = <ZipFinder autoFocus onDone={() => setOpen(null)} />
  const budgetPanel: ReactNode = <BudgetSlider value={f.maxp} onChange={(maxp) => setFilters({ maxp })} />
  const bedsPanel: ReactNode = (
    <div className="fp-field">
      <span className="fp-legend">{t('beds.group')}</span>
      <Seg label={t('beds.group')} value={f.beds} options={[[undefined, t('any.cap')], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+']]} onPick={(beds) => setFilters({ beds })} />
    </div>
  )

  if (phone) {
    return (
      <div className="pillwrap" ref={box}>
        <button type="button" className="pill pill-one" aria-expanded={open === 'all'} aria-controls="pill-panel" aria-label={`${t('search.aria')}: ${budget} · ${beds}`} onClick={() => setOpen(open ? null : 'all')}>
          <Icon name="search" />
          <span className="pill-text">{budget} · {beds}</span>
        </button>
        {open && (
          <div id="pill-panel" className="pop pop-wide">
            {zipPanel}
            {budgetPanel}
            {bedsPanel}
          </div>
        )}
      </div>
    )
  }

  const seg = (id: Seg3, icon: boolean, text: string) => (
    <button type="button" className="pill-seg" aria-expanded={open === id} aria-controls={`pill-${id}`} onClick={() => setOpen(open === id ? null : id)}>
      {icon && <Icon name="search" />}
      {text}
    </button>
  )

  return (
    <div className="pillwrap" ref={box}>
      <div className="pill" role="group" aria-label={t('search.aria')}>
        {seg('zip', true, t('search.zip'))}
        {seg('budget', false, budget)}
        {seg('beds', false, beds)}
      </div>
      {open === 'zip' && <div id="pill-zip" className="pop">{zipPanel}</div>}
      {open === 'budget' && <div id="pill-budget" className="pop">{budgetPanel}</div>}
      {open === 'beds' && <div id="pill-beds" className="pop">{bedsPanel}</div>}
    </div>
  )
}
