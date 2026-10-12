import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { MortgageCalc } from '../components/MortgageCalc'
import { PageShell } from '../components/PageShell'
import { useIndex } from '../data/useIndex'
import { useT } from '../i18n'
import { applyFilters, parseFilters } from '../lib/filters'
import { DEFAULT_LOAN, maxAffordablePrice } from '../lib/finance'
import { money } from '../lib/format'

export function Afford() {
  const index = useIndex()
  const t = useT()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const rate = index.data?.priceIndex.mortgageRate
  const startPrice = Number(params.get('price')) || 600_000
  const [income, setIncome] = useState(150_000)
  const [debts, setDebts] = useState(400)
  const [down, setDown] = useState(DEFAULT_LOAN.downPct)

  const max = rate ? maxAffordablePrice(income, debts, { ...DEFAULT_LOAN, downPct: down, ratePct: rate.pct }) : 0

  // The price limit is in today's dollars, so the map switches to the Seattle index to compare like with like.
  const showHomes = () => {
    const f = parseFilters(params)
    const next = applyFilters(params, { ...f, maxp: max, adj: f.adj === 'none' ? 'metro' : f.adj })
    navigate({ pathname: '/', search: `?${next.toString()}` })
  }

  return (
    <PageShell title={t('afford.title')}>
      {rate ? (
        <>
          <p className="hint">
            {t('afford.rate', { rate: rate.pct, series: rate.series.replace(/ \(FRED.*/, ''), asOf: rate.asOf })}
          </p>
          <section aria-labelledby="afford-h">
            <h2 id="afford-h">{t('afford.fromIncome')}</h2>
            <div className="fields">
              <label className="field"><span>{t('afford.income')}</span><span className="field-input"><input type="number" min={0} step={5000} value={income} onChange={(e) => setIncome(Number(e.target.value))} /><span aria-hidden="true">$</span></span></label>
              <label className="field"><span>{t('afford.debts')}</span><span className="field-input"><input type="number" min={0} step={50} value={debts} onChange={(e) => setDebts(Number(e.target.value))} /><span aria-hidden="true">$</span></span></label>
              <label className="field"><span>{t('afford.down')}</span><span className="field-input"><input type="number" min={0} max={100} value={down} onChange={(e) => setDown(Number(e.target.value))} /><span aria-hidden="true">%</span></span></label>
            </div>
            <p className="calc-total" aria-live="polite">{money(max)}<span> {t('afford.max')}</span></p>
            <p className="hint">{t('afford.hint')}</p>
            <button type="button" className="primary" disabled={max <= 0} onClick={showHomes}>{t('afford.show')}</button>
          </section>
          <section aria-labelledby="calc-h">
            <h2 id="calc-h">{t('afford.specific')}</h2>
            <MortgageCalc price={startPrice} ratePct={rate.pct} />
          </section>
        </>
      ) : (
        <p>{t('loading')}</p>
      )}
    </PageShell>
  )
}
