import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { MortgageCalc } from '../components/MortgageCalc'
import { PageShell } from '../components/PageShell'
import { useIndex } from '../data/useIndex'
import { applyFilters, parseFilters } from '../lib/filters'
import { DEFAULT_LOAN, maxAffordablePrice } from '../lib/finance'
import { money } from '../lib/format'

export function Afford() {
  const index = useIndex()
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
    <PageShell title="What can I afford?">
      {rate ? (
        <>
          <p className="hint">
            Default interest rate: {rate.pct}%, the {rate.series.replace(/ \(FRED.*/, '')} average for {rate.asOf}. Change anything below.
          </p>
          <section aria-labelledby="afford-h">
            <h2 id="afford-h">Price range from your income</h2>
            <div className="fields">
              <label className="field"><span>Gross income per year</span><span className="field-input"><input type="number" min={0} step={5000} value={income} onChange={(e) => setIncome(Number(e.target.value))} /><span aria-hidden="true">$</span></span></label>
              <label className="field"><span>Other debt payments per month</span><span className="field-input"><input type="number" min={0} step={50} value={debts} onChange={(e) => setDebts(Number(e.target.value))} /><span aria-hidden="true">$</span></span></label>
              <label className="field"><span>Down payment</span><span className="field-input"><input type="number" min={0} max={100} value={down} onChange={(e) => setDown(Number(e.target.value))} /><span aria-hidden="true">%</span></span></label>
            </div>
            <p className="calc-total" aria-live="polite">{money(max)}<span> estimated maximum price</span></p>
            <p className="hint">Uses the common 28% (housing) and 36% (all debts) of gross income rules. A planning guide, not a loan offer.</p>
            <button type="button" className="primary" disabled={max <= 0} onClick={showHomes}>Show past sales up to this price (in today’s dollars)</button>
          </section>
          <section aria-labelledby="calc-h">
            <h2 id="calc-h">Monthly cost of a specific price</h2>
            <MortgageCalc price={startPrice} ratePct={rate.pct} />
          </section>
        </>
      ) : (
        <p>Loading…</p>
      )}
    </PageShell>
  )
}
