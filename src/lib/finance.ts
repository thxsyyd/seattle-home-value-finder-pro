export interface LoanInputs {
  price: number
  downPct: number
  ratePct: number
  years: number
  /** annual property tax as a % of price */
  taxPct: number
  /** annual homeowner's insurance as a % of price */
  insPct: number
  hoaMonthly: number
}

export const DEFAULT_LOAN = { downPct: 20, ratePct: 6.5, years: 30, taxPct: 0.9, insPct: 0.35, hoaMonthly: 0 }

/** Standard amortising payment (principal and interest) per month. */
export function monthlyPI(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12
  const r = annualRatePct / 100 / 12
  return r === 0 ? principal / n : (principal * r) / (1 - (1 + r) ** -n)
}

export interface Breakdown {
  loan: number
  pi: number
  tax: number
  ins: number
  pmi: number
  hoa: number
  total: number
}

/** Monthly housing cost. PMI is a flat 0.5%/yr of the loan when the down payment is under 20% (an estimate). */
export function breakdown(i: LoanInputs): Breakdown {
  const loan = i.price * (1 - i.downPct / 100)
  const pi = monthlyPI(loan, i.ratePct, i.years)
  const tax = (i.price * i.taxPct) / 100 / 12
  const ins = (i.price * i.insPct) / 100 / 12
  const pmi = i.downPct < 20 ? (loan * 0.005) / 12 : 0
  return { loan, pi, tax, ins, pmi, hoa: i.hoaMonthly, total: pi + tax + ins + pmi + i.hoaMonthly }
}

/**
 * Highest price whose monthly cost fits the common 28% (housing) / 36% (all debts) of gross income rules.
 * A planning heuristic, not a lending decision.
 */
export function maxAffordablePrice(income: number, debtsMonthly: number, base: Omit<LoanInputs, 'price'>): number {
  const monthly = income / 12
  const budget = Math.min(0.28 * monthly, 0.36 * monthly - debtsMonthly)
  if (budget <= 0) return 0
  let lo = 0
  let hi = 10_000_000
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2
    if (breakdown({ ...base, price: mid }).total <= budget) lo = mid
    else hi = mid
  }
  return Math.floor(lo / 1000) * 1000
}
