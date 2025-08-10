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

## Managing Content (All Categories)
- General rules
  - Each item lives in its own folder under the category directory using a URL-safe slug (e.g., `public/content/movies/inception`).
  - Images can be `.jpg` or `.png` and should be reasonably sized for kiosk displays.
  - Update or remove items by editing or deleting their folders; the app reads from disk on each request, so no rebuild is required. Just refresh the page.

### Movies
Folder: `public/content/movies/<slug>/`
- Required: `banner.jpg|png`, `poster.jpg|png`, `meta.json`
- Optional: `video.mp4`
- Example `meta.json`:
```json
{
  "id": 1001,
  "title": "Inception",
  "overview": "A thief who steals corporate secrets through dream-sharing.",
  "genre": ["Sci-Fi", "Thriller"],
  "rating": 4.7,
  "year": 2010
}
```
- Notes:
  - If `video.mp4` exists it’s preferred for Play; otherwise the player falls back to a sample URL if provided.

### Ebooks
Folder: `public/content/ebooks/<slug>/`
- Required: `cover.jpg|png`, `file.pdf`, `meta.json`
- Example `meta.json`:
```json
{
  "id": 2001,
  "title": "Cinematography Basics",
  "overview": "An introduction to cinematography and visual storytelling.",
  "authors": ["Jane Doe"],
  "year": 2021
}
```
- Notes:
  - Clicking the Book icon opens `file.pdf` in the built-in reader overlay.

### Milestones
Folder: `public/content/milestones/<slug>/`
- Required: `banner.jpg|png`, `meta.json`
- Example `meta.json`:
```json
{
  "id": 3001,
  "title": "1895: First Film Screening",
  "overview": "Lumière brothers present the first public film screening in Paris.",
  "year": 1895
}
```
- Notes:
  - These power the Milestones page carousel and the milestones-mode second monitor.

### Hero (Homepage/Preview Slides)
Folder: `public/content/hero/`
- Option A (static images): `slide-1.jpg`, `slide-2.jpg`, `slide-3.jpg`
- Option B (JSON-based): add JSON files describing slides, or rely on gallery candidates (screensaver cycles through registered items).
- Example slide object used internally:
```json
{ "id": 1, "img": "/content/hero/slide-1.jpg", "title": "Welcome", "synopsis": "…" }
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

## Setup Notes (Other PCs)
- Install Node via nvm and use the pinned version:
  ```bash
  nvm use
  ```
  If not installed, install Node 16–20. The project has `.nvmrc` and `engines` to guide this.
- Copy `.env.example` to `.env` and fill values if you use API routes:
  ```bash
  cp .env.example .env
  # edit TMDB_KEY if you plan to use /api routes that fetch from TMDB
  ```
- After `npm install` or `yarn`, a postinstall script ensures `public/pdf.worker.min.js` is copied from `pdfjs-dist`. This avoids symlink issues on Windows.


