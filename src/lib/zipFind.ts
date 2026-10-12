/** Resolve what a person typed into the ZIP finder to a ZIP code that has sales, or null. */
export function findZip(input: string, zips: readonly string[]): string | null {
  const digits = input.trim().replace(/\D/g, '')
  if (digits.length !== 5) return null
  return zips.includes(digits) ? digits : null
}
