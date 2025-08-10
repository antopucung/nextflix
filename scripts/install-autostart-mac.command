#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

LABEL='com.nextflix.app'
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE_PATH="$(command -v node || true)"
if [ -z "$NODE_PATH" ]; then echo "Node.js not found"; exit 1; fi

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>cd "$PWD" && ./scripts/start-nextflix-mac.command</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><false/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/nextflix.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/nextflix-error.log</string>
</dict>
</plist>
PLIST

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed LaunchAgent: $PLIST" 