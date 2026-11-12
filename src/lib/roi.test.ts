import { describe, expect, it } from 'vitest'
import { DEFAULT_LOAN, monthlyPI } from './finance'
import { DEFAULT_ROI, roi, type RoiInputs } from './roi'

/** A $500k home let at $3,000 a month on the default assumptions. */
const base: RoiInputs = {
  ...DEFAULT_ROI,
  price: 500_000,
  monthlyRent: 3_000,
  loan: { ...DEFAULT_LOAN },
}

describe('roi', () => {
  it('works a $500k home at $3,000 a month through line by line', () => {
    const r = roi(base)
    expect(r.grossAnnualRent).toBe(36_000)
    expect(r.vacancyLoss).toBe(1_800)
    expect(r.effectiveGrossIncome).toBe(34_200)

    expect(r.expenses.tax).toBe(4_500) // 0.9% of price
    expect(r.expenses.insurance).toBe(1_750) // 0.35% of price
    expect(r.expenses.hoa).toBe(0)
    expect(r.expenses.maintenance).toBe(2_880) // 8% of the asking rent
    expect(r.expenses.capex).toBe(1_800) // 5% of the asking rent
    expect(r.expenses.management).toBe(2_736) // 8% of the rent collected
    expect(r.operatingExpenses).toBe(13_666)

    expect(r.noi).toBe(20_534)
    expect(r.capRatePct).toBeCloseTo(4.1068, 4)
    expect(r.cashInvested).toBe(115_000) // 20% down plus 3% closing
    expect(r.grossYieldPct).toBeCloseTo(7.2, 6)
    expect(r.grossRentMultiplier).toBeCloseTo(13.889, 3)
    expect(r.meetsOnePercentRule).toBe(false) // $3,000 is well under 1% of $500k
  })

  it('counts only principal, interest and mortgage insurance as debt service', () => {
    const r = roi(base)
    expect(r.debtService).toBeCloseTo(monthlyPI(400_000, 6.5, 30) * 12, 6)
    // At this rent the mortgage is not covered, so the month runs at a loss.
    expect(r.monthlyCashFlow).toBeCloseTo(-817, -1)
    expect(r.cashOnCashPct).toBeLessThan(0)
    expect(r.dscr).toBeCloseTo(0.677, 3)
  })

  it('leaves NOI and the cap rate alone when only the loan changes', () => {
    const a = roi(base)
    const b = roi({ ...base, loan: { ...base.loan, ratePct: 12, downPct: 50, years: 15 } })
    expect(b.noi).toBe(a.noi)
    expect(b.capRatePct).toBe(a.capRatePct)
    // ...but everything downstream of the loan does move.
    expect(b.debtService).not.toBe(a.debtService)
    expect(b.cashInvested).not.toBe(a.cashInvested)
    expect(b.cashOnCashPct).not.toBe(a.cashOnCashPct)
  })

  it('break-even rent is exactly the rent at which cash flow reaches zero', () => {
    const { breakEvenRent } = roi(base)
    expect(breakEvenRent).toBeGreaterThan(base.monthlyRent)
    expect(roi({ ...base, monthlyRent: breakEvenRent }).monthlyCashFlow).toBeCloseTo(0, 6)
  })

  it('charges management on the rent collected and repairs on the rent asked', () => {
    const r = roi({ ...base, vacancyPct: 50 })
    expect(r.expenses.management).toBeCloseTo(r.effectiveGrossIncome * 0.08, 6)
    expect(r.expenses.maintenance).toBeCloseTo(r.grossAnnualRent * 0.08, 6)
    // Half a year empty halves the agent's cut but not the repair budget.
    expect(r.expenses.maintenance).toBeGreaterThan(r.expenses.management)
  })

  it('treats an all-cash purchase as infinitely covered', () => {
    const r = roi({ ...base, loan: { ...base.loan, downPct: 100 } })
    expect(r.debtService).toBe(0)
    expect(r.dscr).toBe(Infinity)
    expect(r.monthlyCashFlow).toBeCloseTo(r.noi / 12, 6)
    expect(r.cashInvested).toBe(515_000) // the whole price plus 3% closing
  })

  it('flags the 1% rule exactly at one percent of the price', () => {
    expect(roi({ ...base, monthlyRent: 5_000 }).meetsOnePercentRule).toBe(true)
    expect(roi({ ...base, monthlyRent: 4_999 }).meetsOnePercentRule).toBe(false)
  })

  it('with no rent, the loss for the year is the fixed costs plus the mortgage', () => {
    const r = roi({ ...base, monthlyRent: 0 })
    expect(r.effectiveGrossIncome).toBe(0)
    expect(r.noi).toBeCloseTo(-(r.expenses.tax + r.expenses.insurance + r.expenses.hoa), 6)
    expect(r.monthlyCashFlow * 12).toBeCloseTo(r.noi - r.debtService, 6)
    expect(r.grossRentMultiplier).toBe(Infinity)
  })

  it('reports an unreachable break-even when the costs swallow every rent dollar', () => {
    const r = roi({ ...base, vacancyPct: 60, managementPct: 50, maintenancePct: 30, capexPct: 20 })
    expect(r.breakEvenRent).toBe(Infinity)
  })
})
