// Development-only accessibility runner: open any page with ?a11y=1, then call `await window.__axe()` in the console.
import axe from 'axe-core'

declare global {
  interface Window {
    __axe?: () => Promise<unknown>
  }
}

window.__axe = async () => {
  const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })
  return res.violations.map((v) => ({
    id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
    sample: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), summary: n.failureSummary?.split('\n').slice(0, 3).join(' | ') })),
  }))
}
