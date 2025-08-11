## Arsip2 Blueprint

### Overview
Arsip2 adds a Windows Explorer-like gallery for the archive at `public/content/DataFinalArsip`, integrated into a new route `Arsip2` (`/ebooks2`). It provides:
- Centered, Apple-inspired gallery UI with folders and files
- Breadcrumb address bar with color-coded segments
- Folder icons with hue tint by modified date (no cover image)
- Click-through to open folders, images, and PDFs
- Global Reader overlay for PDFs and images with responsive zoom/pan/drag
- Drag-to-scroll behaviors both in the Reader and in the gallery grid

### Core Requirements Implemented
- Read local content from `public/content/DataFinalArsip`
- List directories/files, sort folders first, then files by name
- Navigate folders and return to root via breadcrumbs
- Preview images and PDFs with modern, responsive gestures
- Center gallery content and make the address line prominent

### Architecture
- API: `pages/api/arsip2.ts`
  - Returns JSON with the current directory, breadcrumb, and items (type, name, ext, size, mtimeMs, url)
  - Ensures path traversal safety (contained within `public/content/DataFinalArsip`)
  - Picks the first image in a folder for potential cover (not shown in UI as folder is icon-only)

- Frontend: `components/Explorer/index.tsx`
  - Breadcrumb header (color-coded, enlarged)
  - Centered grid gallery (cards for folders/files)
  - Grid-level drag-to-scroll (vertical swiping) that works over thumbnails
  - Click handling with suppression when a drag occurred
  - Opens PDF/image via `ReaderContext.open` to reuse the global Reader overlay

- Reader Overlay: `components/Reader/index.tsx`
  - Detects PDF vs image and renders appropriate viewer
  - PDF: zoom via wheel, pinch-to-zoom, double-click zoom, left-drag scroll
  - Image: wheel zoom, pinch-to-zoom, double-click zoom, drag to pan (when zoomed)

### UI/UX Decisions
- Gallery aesthetics:
  - Apple-like, glassy cards; consistent folder icon rendering with gentle hue differences by date
  - Centered layout with `max-width` to avoid edge-to-edge fatigue
  - Breadcrumbs are larger, semi-bold, hover-highlighted, color-coded per segment (root is highlighted)
  - Trailing slash on the current folder segment for location clarity

- Navigation:
  - Folders on top, files below, both sorted locale-aware and numeric-aware
  - Click folder to drill down; click breadcrumb segments to go back

- Interaction (gallery grid):
  - Left-click and drag anywhere (including thumbnails) to scroll vertically (page scroll)
  - Suppress accidental item click if a drag gesture occurred

- Interaction (Reader overlay):
  - PDFs: zoom (wheel on container), pinch-to-zoom, double-click zoom in, left-drag to scroll
  - Images: wheel zoom, pinch-to-zoom, double-click zoom toggle, drag to pan when zoomed in

### Problems, Obstacles, and Solutions
- Problem: Need a safe filesystem API for listing `DataFinalArsip`.
  - Solution: `arsip2` API ensures path sandboxing and computes relative/public URLs; sorts items and attaches metadata.

- Problem: HTML/CSS centering of the grid looked left-heavy.
  - Solution: Move to centered grid with `max-width`, `margin: 0 auto`, `justify-content: center`, and horizontal padding.

- Problem: Address hint not prominent enough.
  - Solution: Increase font size/weight; add color-coded segments and a trailing slash on the last segment.

- Problem: Folder covers inconsistent; avoid changing folder icon.
  - Solution: Always show a folder glyph; apply `hue-rotate` color tint based on `mtimeMs` for subtle variance.

- Problem: PDF zoom only via Ctrl+wheel; need more responsive zoom.
  - Solution: Add wheel-zoom on the container (prevent default scroll), pinch-to-zoom, and double-click zoom; maintain left-drag to scroll.

- Problem: Image viewer felt unresponsive.
  - Solution: Bind wheel zoom to the image host with `preventDefault`, pointer-capture for pan/pinch, and smooth transforms.

- Problem: Dragging the gallery only worked on empty areas, not thumbnails.
  - Solution: Implement grid-level drag-to-scroll using pointer events and click-suppression logic so drag gestures don’t trigger item clicks.

- Problem: Clicks blocked after drag.
  - Solution: Refine suppression with a movement threshold, short-lived suppression window, and no pointer capture at the grid level.

### Visual Notes
- Folder Icon: tab + body shapes with gradients, hue-rotated per folder modification date.
- Cards: subtle elevation and hover lift; thumbnails for images, uppercase file extensions for non-images.
- Breadcrumbs: `DataFinalArsip/Segment1/Segment2/` with per-segment hue and hover color.

### API Response Example
```json
{
  "type": "Success",
  "cwd": "Pra-Sidang",
  "breadcrumb": ["Pra-Sidang"],
  "items": [
    { "type": "dir", "name": "Folder A", "relPath": "Pra-Sidang/Folder A", "mtimeMs": 1710000000000 },
    { "type": "file", "name": "scan1.jpg", "relPath": "Pra-Sidang/scan1.jpg", "ext": "jpg", "url": "/content/DataFinalArsip/Pra-Sidang/scan1.jpg", "mtimeMs": 1710000001000 }
  ]
}
```

### Known Limitations
- No server-side caching for API responses; large folders may be slower on first load.
- No lazy-loading/virtualization yet for extremely large image sets.
- Folder tint is heuristic (based on `mtimeMs`); can be customized (e.g., fixed per month).

### Future Enhancements
- Virtualized grid for very large folders
- Sort options (name, date, type) and toggles (folders-first)
- Keyboard navigation in gallery (arrows + Enter to open)
- Image thumbnails for non-image files (e.g., first PDF page) if needed
- Context menu: open in new tab, copy path/link
- Optional cover image support per folder (e.g., `cover.jpg` takes precedence)

### Files Touched
- Added: `pages/api/arsip2.ts`
- Added: `components/Explorer/index.tsx`
- Added: `styles/Explorer.module.scss`
- Updated: `pages/ebooks2.tsx` (use Explorer)
- Updated: `components/Navbar/index.tsx`, `components/Navbar/Menu.tsx` (add Arsip2)
- Updated: `components/Reader/index.tsx` and `styles/Reader.module.scss` (PDF/Image viewer interactions)

### Usage
- Start dev server and navigate to `/ebooks2`.
- Browse folders, click to open; use breadcrumbs to navigate up.
- Open images/PDFs to view in the Reader with zoom/pinch/drag.

---

## Porting Guide (Copy Arsip2 to Another Project)

### Prerequisites
- Next.js 11.x, React 17.x (align with this project) or adapt imports accordingly
- Dependencies in `package.json`:
  - `@react-pdf-viewer/core` and `@react-pdf-viewer/zoom`
  - `pdfjs-dist` (to provide `pdf.worker.min.js`)
  - `sass`
  - `axios`
- Ensure global Reader context/components exist or port them (see below)

### Required Files and Paths
Copy these files (preserve paths):
- API:
  - `pages/api/arsip2.ts`
- Explorer UI:
  - `components/Explorer/index.tsx`
  - `styles/Explorer.module.scss`
- Reader overlay (if not already present or to extend):
  - `components/Reader/index.tsx`
  - `components/Reader/PdfViewer.tsx`
  - `styles/Reader.module.scss`
  - `context/ReaderContext.tsx`
- Page route:
  - `pages/ebooks2.tsx`
- Navbar entries (desktop/mobile):
  - `components/Navbar/index.tsx` (insert Arsip2 link)
  - `components/Navbar/Menu.tsx` (insert Arsip2 link)
- Public worker:
  - Copy `node_modules/pdfjs-dist/build/pdf.worker.min.js` to `public/pdf.worker.min.js`

### Data Location
- Place content under: `public/content/DataFinalArsip` (folders, images, PDFs). The API reads from this path.

### Integration Steps
1) Install deps
```bash
npm i @react-pdf-viewer/core @react-pdf-viewer/zoom pdfjs-dist axios sass
# or yarn add ...
```

2) Provide PDF worker
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
```

3) Add API route
- Copy `pages/api/arsip2.ts` as-is. It sandboxes to `public/content/DataFinalArsip` and sorts results.
- If your content path differs, update `DATA_ROOT_REL` inside the file.

4) Add Explorer UI
- Copy `components/Explorer/index.tsx` and `styles/Explorer.module.scss`.
- Ensure `styles/_variables.scss` and `styles/_mixins.scss` exist or adjust imports in `Explorer.module.scss`.
- The grid uses drag-to-scroll and click suppression; no additional config needed.

5) Wire page route
- Copy `pages/ebooks2.tsx` (wraps Explorer in existing `Layout`, `Modal`).
- If your layout differs, embed `<Explorer />` into your layout.

6) Navigation
- Insert "Arsip2" link into `components/Navbar/index.tsx` and `components/Navbar/Menu.tsx` between Arsip and Lini Masa.
- Add active state for `/ebooks2` in Navbar (see code in this repo).

7) Reader overlay
- Ensure `ReaderContext`/`Reader` exist and are mounted globally (e.g., in `_app.tsx`).
- If porting Reader:
  - `components/Reader/index.tsx` supports both PDFs and images with wheel/pinch/double-click zoom, and drag-to-scroll/pan.
  - `components/Reader/PdfViewer.tsx` uses `@react-pdf-viewer/core` with `<Worker workerUrl="/pdf.worker.min.js" />`.
  - Update import paths and ensure styles are included.

8) Styles
- Explorer styles import `_variables.scss` and `_mixins.scss`. Provide equivalents or inline variables.
- Safari prefixes are included (e.g., `-webkit-user-select`, `-webkit-backdrop-filter`).

9) Verify
- Start dev server, open `/ebooks2`.
- Confirm breadcrumbs, centered grid, folder tints, click navigation, image/PDF opening in Reader.

### API Contract (Detailed)
- Endpoint: `GET /api/arsip2?path=<relativePath>`
- Path base: `public/content/DataFinalArsip`
- Request:
  - `path` (optional): relative directory path under the base, no leading/trailing slashes
- Response: success
```ts
{
  type: 'Success';
  cwd: string;            // current directory relative path ('' for root)
  breadcrumb: string[];   // segments of cwd
  items: Array<{
    name: string;
    relPath: string;      // path relative to base
    type: 'file' | 'dir';
    ext?: string;         // files only
    size?: number;        // files only
    mtimeMs?: number;     // last modified timestamp
    url?: string;         // files only, public URL
    coverUrl?: string;    // folder first image (not used in UI)
  }>
}
```
- Response: error
```ts
{ type: 'Error'; error: string }
```
- Security: rejects attempts to escape base path; ignores dotfiles.

### Behavior Details
- Sorting: Folders first, then files; name ascending, locale-aware, numeric-aware.
- Folder tint: `hue-rotate(Math.floor((mtimeMs / oneDay) % 360))` with slight saturation bump.
- Grid drag: Pointer events on grid container; vertical deltas adjust `document.scrollingElement.scrollTop`; clicks suppressed only if a true drag is detected.
- PDF zoom:
  - Wheel zoom on container (prevents default scroll)
  - Pinch-to-zoom via two pointers within PDF area
  - Double-click to zoom in
  - Left-drag to scroll vertically
- Image zoom:
  - Wheel zoom bound to image host
  - Pinch-to-zoom, double-click toggle
  - Drag to pan when zoom > 1

### Testing Checklist
- API
  - Root `GET /api/arsip2` returns items from `DataFinalArsip`
  - Nested folder `GET /api/arsip2?path=Pra-Sidang` returns expected items
- Gallery
  - Grid centered; responsive across widths
  - Breadcrumbs render colored segments with trailing slash on last
  - Clicking folders navigates; clicking files opens appropriate viewer
  - Dragging over thumbnails scrolls the page; click not triggered after drag
- Reader
  - PDFs: wheel zoom, pinch zoom, double-click zoom, drag-to-scroll
  - Images: wheel zoom, pinch zoom, double-click, drag pan (zoomed)
- Navbar
  - "Arsip2" link appears between "Arsip" and "Lini Masa" and highlights on `/ebooks2`

### Troubleshooting
- 500 Sass error: `Undefined mixin` on `fluid-type`
  - Ensure `styles/_mixins.scss` is imported at the top of `Explorer.module.scss`.
- PDF not zooming with wheel
  - Verify `onWheel` attached to PDF container and `preventDefault()` is applied.
  - Ensure `pdf.worker.min.js` exists at `/public/pdf.worker.min.js`.
- Images not opening in Reader
  - Check `ReaderContext` is mounted globally in `_app.tsx` and Explorer calls `openReader` with image URL.
- Clicks not working after swiping grid
  - Movement threshold may be too low; adjust in Explorer (`> 6px`) to avoid false drags.
- Grid not centered
  - Verify `.grid` has `max-width`, `margin: 0 auto`, and `justify-content: center`.

### Customization
- Base content path: edit `DATA_ROOT_REL` in `pages/api/arsip2.ts`
- Breadcrumb style: adjust font-size/weights and hues in `Explorer.module.scss`
- Folder tint formula: modify `folderHueStyle` in Explorer
- Zoom bounds: image and PDF zoom ranges set to `[1, 6]`; adjust as needed
- Drag thresholds: change pixel thresholds for drag detection in Explorer

### Accessibility
- Breadcrumbs: increase contrast and provide `aria-label` if needed
- Cards: add `role="button"` and keyboard handlers for Enter/Space to open
- Reader: keep keyboard scrolling for PDFs; consider adding close on Escape

### Performance Notes
- Consider virtualized grids (e.g., `react-window`) for very large folders
- Cache API responses per-folder (memory or SWR) to reduce re-fetches

### Change Log (Key Edits for Arsip2)
- New: `pages/api/arsip2.ts` (directory listing API)
- New: `components/Explorer/index.tsx` + `styles/Explorer.module.scss` (gallery)
- New: `pages/ebooks2.tsx` (route)
- Updated: `components/Navbar/index.tsx`, `components/Navbar/Menu.tsx` (Arsip2 nav)
- Updated: `components/Reader/index.tsx` (PDF/image gestures) + `components/Reader/PdfViewer.tsx` + `styles/Reader.module.scss`
- Copied: `public/pdf.worker.min.js` from `pdfjs-dist` 