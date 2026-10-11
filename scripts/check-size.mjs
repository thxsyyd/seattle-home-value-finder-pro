// Fails the build if the entry JS (gzipped) exceeds the budget.
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BUDGET_KB = 600
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const entries = [...html.matchAll(/<script[^>]+src="\/?([^"]+\.js)"/g)].map((m) => m[1])
if (entries.length === 0) {
  console.error('check-size: no entry script found in dist/index.html')
  process.exit(1)
}

let total = 0
for (const rel of entries) {
  const kb = gzipSync(readFileSync(join(dist, rel))).length / 1024
  console.log(`  ${rel}: ${kb.toFixed(1)} KB gzip`)
  total += kb
}
console.log(`entry JS total: ${total.toFixed(1)} KB gzip (budget ${BUDGET_KB} KB)`)

if (readdirSync(dist).includes('404.html')) {
  console.error('check-size: dist/404.html must not exist (Cloudflare Pages SPA fallback)')
  process.exit(1)
}
if (total > BUDGET_KB) process.exit(1)
