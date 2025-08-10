# Nextflix (Offline-First Museum Display)

A Netflix-like offline-first app built with Next.js 11, React 17, and SCSS modules. Fully local-friendly: reads content from `public/content/*` without a database and supports a second-monitor, headerless preview for exhibition setups.

## Features
- Movies, Ebooks (PDF reader), Milestones (timeline) pages
- Hero screensaver with two-layer crossfade, hover/selection mirroring
- Row carousels with drag-to-scroll and snap
- Second monitor preview window (borderless/fullscreen-like), route & state synced
- Offline-first data from `public/content` with `meta.json`
- Cross-platform one-click start + autostart scripts

## Quick Start
Requirements: Node.js 16–20, Yarn or NPM

```bash
# Install deps
npm install

# (Optional) Seed local content into public/content from mock data
npm run seed:local

# Build and start on http://localhost:3000
npm run build && npm start
```

## One-Click Start (Recommended)
- macOS: double-click `scripts/start-nextflix-mac.command` or run:
  ```bash
  npm run start:mac
  ```
- Windows: double-click `scripts/start-nextflix-win.bat` or run:
  ```bash
  npm run start:win
  ```
This will install dependencies, seed content, build, start on port 3000, and open the preview window.

## Auto-Start on Login
- macOS:
  ```bash
  npm run autostart:mac
  ```
  Installs a LaunchAgent that runs the start script at login.

- Windows (PowerShell):
  ```powershell
  npm run autostart:win
  ```
  Adds a Startup shortcut to the start script.

## Content Structure (Offline)
Place media and metadata here:
```
public/content/
  movies/<slug>/
    poster.jpg|png
    banner.jpg|png
    video.mp4   # optional
    meta.json   # { "id": number, "title": string, "overview": string, ... }
  ebooks/<slug>/
    cover.jpg|png
    file.pdf
    meta.json
  milestones/<slug>/
    banner.jpg|png
    meta.json
  hero/
    slide-1.jpg
    slide-2.jpg
    slide-3.jpg
    # or slides described by meta.json
```

## Second Monitor Preview
- Open from the header monitor icon (top-right)
- On `/milestones`, preview launches in milestones mode (headerless)
- Mirrors hero/milestones state and route in real time

## Scripts
- `npm run seed:local` – seed `public/content` from mock data
- `npm run build` / `npm start` – build & serve on port 3000
- `npm run start:mac` / `npm run start:win` – one-click startup
- `npm run autostart:mac` / `npm run autostart:win` – install autostart

## Tech
- Next.js 11, React 17
- SCSS Modules with design tokens
- Framer Motion for transitions
- BroadcastChannel for multi-window sync (with localStorage fallback)

## License
MIT


