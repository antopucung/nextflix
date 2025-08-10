# Offline Content Setup

Place your media into `public/content/**` so the app runs fully offline. The app will auto-scan these folders on startup and API requests, no database required.

Folder structure

```
public/
  content/
    movies/
      dune/
        poster.jpg            # preferred names: poster|cover.(jpg|png|webp)
        banner.jpg            # preferred names: banner|backdrop.(jpg|png|webp)
        video.mp4             # preferred names: video|trailer|source.(mp4|webm|mov)
        meta.json             # optional metadata
      interstellar/
        cover.png
        backdrop.png
        trailer.webm
        meta.json
    ebooks/
      the-alchemist/
        cover.jpg             # cover image shown on cards
        banner.jpg            # optional banner
        book.pdf              # the PDF to open in the reader
        meta.json             # optional metadata
    milestones/
      1895-lumiere/
        banner.jpg
        meta.json
```

Optional `meta.json` schema

```
{
  "title": "Human readable title",
  "overview": "Short description",
  "rating": 4.5,
  "genre": [
    { "id": 1, "name": "Sci-Fi" },
    { "id": 2, "name": "Adventure" }
  ]
}
```

Conventions and fallbacks
- Titles default from the folder name (kebab/underscore converted to Title Case).
- If `banner` is missing, `poster/cover` is used for the card header.
- Movies: if no `video` is present, a sample trailer is used.
- Missing fields gracefully fallback; the UI will still render.

How it works
- Next.js serves anything under `public/` statically. We scan `public/content/**` with a lightweight filesystem reader (`utils/localContent.ts`).
- API routes prefer local content first, then fallback to mock/TMDB as needed:
  - `/api/popular?type=movie` → local movies → (fallback) TMDB → (fallback) mock
  - `/api/ebooks` → local ebooks → (fallback) mock
  - `/api/milestones` → local milestones → (fallback) mock
- Video player prefers `media.videoUrl` if available.

Deployment (museum kiosk)
- Copy the `content/` folder to `public/content/` on the device.
- Start the app normally; no internet or database required.

Tips for curators
- Keep folder names URL‑safe (lowercase letters, digits, `-` or `_`).
- Use optimized images (≤ 1920px wide) and H.264 MP4 where possible for compatibility.
- You can add/remove folders while the server is running; API requests will pick up changes on next fetch. 