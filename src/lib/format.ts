/** $840k, $1.2M */
export function priceShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

export const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`

/** Signed percent from a fraction: 0.123 -> "+12%", -0.5 -> "−50%". */
export function signedPct(f: number, digits = 0): string {
  const v = Math.abs(f * 100).toFixed(digits)
  if (Number(v) === 0) return '0%'
  return `${f < 0 ? '−' : '+'}${v}%`
}
