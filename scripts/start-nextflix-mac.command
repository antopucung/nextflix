#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Ensure Node and Yarn/NPM available
if ! command -v node >/dev/null 2>&1; then echo "Node.js not found"; exit 1; fi

# Install deps
if command -v yarn >/dev/null 2>&1; then
  yarn install --frozen-lockfile || yarn install
else
  npm install --no-audit --no-fund
fi

# Seed local content (idempotent)
node --experimental-fetch ./scripts/seedLocalContent.mjs || true

# Build
if command -v yarn >/dev/null 2>&1; then yarn build; else npm run build; fi

# Start server on fixed port
export PORT=3000
# Start in background and then open preview window
if command -v yarn >/dev/null 2>&1; then nohup yarn start >/tmp/nextflix.out 2>&1 & else nohup npm run start >/tmp/nextflix.out 2>&1 & fi
SERVER_PID=$!
echo "Nextflix started on http://localhost:$PORT (pid $SERVER_PID)"

# Open main app
sleep 2
open "http://localhost:3000/preview"

echo "Press Ctrl+C to exit. Logs in /tmp/nextflix.out"
wait $SERVER_PID 