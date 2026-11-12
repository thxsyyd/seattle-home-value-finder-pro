import { breakdown, type LoanInputs } from './finance'

/**
 * Rental-investment maths for one home.
 *
 * Every function here is pure: the same inputs always give the same numbers, and nothing reaches
 * the network. That is what makes a drill-down instant — once a rent estimate is in hand, the
 * whole panel is one function call, not a request.
 *
 * The definition worth remembering is net operating income (NOI): income minus the cost of *running*
 * the house. It deliberately excludes the mortgage, which is why the cap rate built on it compares
 * two homes bought with completely different loans.
 *
 * One judgement call: the reserve for capital items (roof, furnace) is counted as an operating cost
 * here, so the cap rate comes out lower than a formal appraisal, which puts that reserve below the
 * NOI line. Counting it keeps the cash-flow figure honest for a small landlord.
 */

export interface RoiAssumptions {
  /** Share of the year the home sits empty, as a % of gross rent. */
  vacancyPct: number
  /** Repairs, as a % of gross rent. */
  maintenancePct: number
  /** Reserve for roof, furnace and the like, as a % of gross rent. */
  capexPct: number
  /** Property management, as a % of the rent actually collected. */
  managementPct: number
  /** One-off costs paid at purchase, as a % of price. */
  closingPct: number
}

/** Common US residential rules of thumb. Assumptions, not measurements: all five are editable. */
export const DEFAULT_ROI: RoiAssumptions = {
  vacancyPct: 5,
  maintenancePct: 8,
  capexPct: 5,
  managementPct: 8,
  closingPct: 3,
}

export interface RoiInputs extends RoiAssumptions {
  /** Purchase price, in the same dollars as the rent. Must be above zero. */
  price: number
  /** Expected gross monthly rent, before any deduction. Zero is allowed and shows the cost side alone. */
  monthlyRent: number
  /** Loan terms and fixed carrying costs, shared with the mortgage calculator. */
  loan: Omit<LoanInputs, 'price'>
}

export interface RoiExpenses {
  tax: number
  insurance: number
  hoa: number
  maintenance: number
  capex: number
  management: number
}

export interface RoiResult {
  /** Twelve months of the asking rent, before vacancy. */
  grossAnnualRent: number
  vacancyLoss: number
  /** Rent actually collected over a year. */
  effectiveGrossIncome: number
  expenses: RoiExpenses
  /** A year of operating costs. Excludes the mortgage by definition. */
  operatingExpenses: number
  /** Effective gross income minus operating expenses. */
  noi: number
  /** A year of principal, interest and any mortgage insurance. */
  debtService: number
  /** Down payment plus closing costs. */
  cashInvested: number
  /** NOI as a % of price. Does not depend on how the purchase was financed. */
  capRatePct: number
  /** A year of cash flow as a % of the cash put in. */
  cashOnCashPct: number
  /** What is left each month once everything is paid. */
  monthlyCashFlow: number
  /** NOI over debt service; lenders usually want 1.2 or more. Infinity when there is no loan. */
  dscr: number
  /** The monthly rent that would make cash flow exactly zero. Infinity when no rent could cover the costs. */
  breakEvenRent: number
  /** Gross annual rent as a % of price, before any cost at all. */
  grossYieldPct: number
  /** Price over gross annual rent. */
  grossRentMultiplier: number
  /** The quick screen that monthly rent is at least 1% of the price. */
  meetsOnePercentRule: boolean
}

/**
 * The share of each gross rent dollar that survives to NOI. Vacancy and management compound,
 * because an agent only takes a cut of what is collected; repairs and the capital reserve are
 * budgeted against the full asking rent whether or not the home is let.
 */
function survivingShare(a: RoiAssumptions): number {
  return (1 - a.vacancyPct / 100) * (1 - a.managementPct / 100) - a.maintenancePct / 100 - a.capexPct / 100
}

export function roi(i: RoiInputs): RoiResult {
  const b = breakdown({ ...i.loan, price: i.price })

  const grossAnnualRent = i.monthlyRent * 12
  const vacancyLoss = grossAnnualRent * (i.vacancyPct / 100)
  const effectiveGrossIncome = grossAnnualRent - vacancyLoss

  const expenses: RoiExpenses = {
    tax: b.tax * 12,
    insurance: b.ins * 12,
    hoa: b.hoa * 12,
    maintenance: grossAnnualRent * (i.maintenancePct / 100),
    capex: grossAnnualRent * (i.capexPct / 100),
    management: effectiveGrossIncome * (i.managementPct / 100),
  }
  const operatingExpenses = expenses.tax + expenses.insurance + expenses.hoa + expenses.maintenance + expenses.capex + expenses.management
  const noi = effectiveGrossIncome - operatingExpenses

  // Mortgage insurance belongs to the loan, not to running the house, so it sits here and never in NOI.
  const debtService = (b.pi + b.pmi) * 12
  const cashInvested = i.price * (i.loan.downPct / 100 + i.closingPct / 100)
  const annualCashFlow = noi - debtService

  // Costs that do not move with the rent, which is what a break-even rent has to cover.
  const fixedCosts = expenses.tax + expenses.insurance + expenses.hoa
  const surviving = survivingShare(i)

  return {
    grossAnnualRent,
    vacancyLoss,
    effectiveGrossIncome,
    expenses,
    operatingExpenses,
    noi,
    debtService,
    cashInvested,
    capRatePct: (noi / i.price) * 100,
    cashOnCashPct: (annualCashFlow / cashInvested) * 100,
    monthlyCashFlow: annualCashFlow / 12,
    dscr: debtService > 0 ? noi / debtService : Infinity,
    breakEvenRent: surviving > 0 ? (fixedCosts + debtService) / (12 * surviving) : Infinity,
    grossYieldPct: (grossAnnualRent / i.price) * 100,
    grossRentMultiplier: i.price / grossAnnualRent,
    meetsOnePercentRule: i.monthlyRent >= i.price * 0.01,
  }
}
