import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const contentRoot = path.join(publicDir, 'content');
const mockPath = path.join(root, 'data', 'mock.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function download(url, destPath) {
  if (!url) return null;
  if (fs.existsSync(destPath)) return destPath;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const ab = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(ab));
    // Be polite to remote; small delay
    await sleep(50);
    return destPath;
  } catch (e) {
    console.warn('Download failed:', url, e.message);
    return null;
  }
}

function guessExtFromUrl(url, fallback = 'jpg') {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1] : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

async function seedMovies(movies) {
  const base = path.join(contentRoot, 'movies');
  ensureDir(base);
  for (const m of movies) {
    const dir = path.join(base, slugify(m.title || m.id));
    ensureDir(dir);
    const posterExt = guessExtFromUrl(m.poster);
    const bannerExt = guessExtFromUrl(m.banner);
    await download(m.poster, path.join(dir, `poster.${posterExt}`));
    await download(m.banner, path.join(dir, `banner.${bannerExt}`));
    writeJson(path.join(dir, 'meta.json'), {
      title: m.title,
      overview: m.overview,
      rating: m.rating,
      genre: m.genre
    });
  }
}

async function seedEbooks(ebooks) {
  const base = path.join(contentRoot, 'ebooks');
  ensureDir(base);
  for (const b of ebooks) {
    const dir = path.join(base, slugify(b.title || b.id));
    ensureDir(dir);
    const coverExt = guessExtFromUrl(b.cover);
    const bannerExt = guessExtFromUrl(b.banner);
    const pdfExt = guessExtFromUrl(b.pdfUrl, 'pdf');
    await download(b.cover, path.join(dir, `cover.${coverExt}`));
    await download(b.banner, path.join(dir, `banner.${bannerExt}`));
    await download(b.pdfUrl, path.join(dir, `book.${pdfExt}`));
    writeJson(path.join(dir, 'meta.json'), {
      title: b.title,
      overview: b.overview,
      rating: b.rating,
      genre: b.genre
    });
  }
}

async function seedMilestones(milestones) {
  const base = path.join(contentRoot, 'milestones');
  ensureDir(base);
  for (const s of milestones) {
    const dir = path.join(base, slugify(s.title || s.id));
    ensureDir(dir);
    const bannerExt = guessExtFromUrl(s.banner);
    await download(s.banner, path.join(dir, `banner.${bannerExt}`));
    writeJson(path.join(dir, 'meta.json'), {
      title: s.title,
      overview: s.overview
    });
  }
}

async function main() {
  console.log('Seeding local content from mock.json...');
  ensureDir(contentRoot);
  const mockRaw = fs.readFileSync(mockPath, 'utf8');
  const mock = JSON.parse(mockRaw);
  await seedMovies(mock.movie || []);
  await seedEbooks(mock.ebooks || []);
  await seedMilestones(mock.milestones || []);
  console.log('Done. Files saved under public/content');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 