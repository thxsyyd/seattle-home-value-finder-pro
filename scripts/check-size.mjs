// Fails the build if the entry JS or the total JS (gzipped) exceeds its budget, or if dist/404.html exists.
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENTRY_BUDGET_KB = 600
const TOTAL_BUDGET_KB = 1000
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const gz = (file) => gzipSync(readFileSync(join(dist, file))).length / 1024

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const entries = [...html.matchAll(/<script[^>]+src="\/?([^"]+\.js)"/g)].map((m) => m[1])
if (entries.length === 0) {
  console.error('check-size: no entry script found in dist/index.html')
  process.exit(1)
}

const entry = entries.reduce((sum, rel) => sum + gz(rel), 0)
const all = readdirSync(join(dist, 'assets')).filter((f) => /\.m?js$/.test(f))
let total = 0
for (const f of all) {
  const kb = gz(join('assets', f))
  total += kb
  console.log(`  ${f}: ${kb.toFixed(1)} KB gzip`)
}
console.log(`entry JS: ${entry.toFixed(1)} KB gzip (budget ${ENTRY_BUDGET_KB}); all JS incl. lazy map + worker: ${total.toFixed(1)} KB gzip (budget ${TOTAL_BUDGET_KB})`)

let bad = false
if (readdirSync(dist).includes('404.html')) {
  console.error('check-size: dist/404.html must not exist (Cloudflare Pages SPA fallback)')
  bad = true
}
if (entry > ENTRY_BUDGET_KB || total > TOTAL_BUDGET_KB) bad = true
process.exit(bad ? 1 : 0)
