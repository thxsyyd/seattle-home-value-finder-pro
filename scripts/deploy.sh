#!/usr/bin/env bash
# Build, check, and upload dist/ to Cloudflare Pages (direct upload; nothing is connected to GitHub).
# One-time setup, done by you: create a free Cloudflare account and run `npx wrangler login`.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run lint
npm test
npm run build
npm run check-size

npx wrangler pages deploy dist --project-name "${PAGES_PROJECT:-seattle-home-value-finder}" --branch main
