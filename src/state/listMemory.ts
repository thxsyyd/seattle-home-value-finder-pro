/** What the results list should remember while a home is open: where it was scrolled and which card was opened. Outside React on purpose, like the hover store. */
export const listMemory: { scrollTop: number; opened: string | null } = { scrollTop: 0, opened: null }
