Param()
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# Ensure Node installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error 'Node.js not found'; exit 1 }

# Install deps
if (Get-Command yarn -ErrorAction SilentlyContinue) {
  yarn install --frozen-lockfile
} else {
  npm install --no-audit --no-fund
}

# Seed local content
try { node --experimental-fetch ./scripts/seedLocalContent.mjs } catch { }

# Build
if (Get-Command yarn -ErrorAction SilentlyContinue) { yarn build } else { npm run build }

# Start server fixed port
$env:PORT = '3000'
if (Get-Command yarn -ErrorAction SilentlyContinue) {
  Start-Process -FilePath 'yarn' -ArgumentList 'start' -WindowStyle Hidden
} else {
  Start-Process -FilePath 'npm' -ArgumentList 'run start' -WindowStyle Hidden
}
Start-Sleep -Seconds 2
Start-Process 'http://localhost:3000/preview' 