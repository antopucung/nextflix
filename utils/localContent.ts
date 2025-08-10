import fs from 'fs';
import path from 'path';
import type { Media, Ebook } from '../types';

// Root folder for offline assets
// Place files under public/content/** so they are statically served by Next at /content/**
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const CONTENT_ROOT = path.join(PUBLIC_DIR, 'content');

function ensureDir(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

function listDirs(root: string): string[] {
  ensureDir(root);
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(root, d.name));
  } catch {
    return [];
  }
}

function findFirstFile(dir: string, stems: string[], exts: string[]): string | null {
  for (const stem of stems) {
    for (const ext of exts) {
      const p = path.join(dir, `${stem}.${ext}`);
      if (fs.existsSync(p)) return p;
    }
  }
  // fallback to any file with allowed extensions
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const found = files.find((f) => exts.some((e) => f.toLowerCase().endsWith(`.${e}`)));
  return found ? path.join(dir, found) : null;
}

function toPublicUrl(absPath: string | null): string {
  if (!absPath) return '';
  const rel = absPath.replace(PUBLIC_DIR, '').split(path.sep).join('/');
  return rel.startsWith('/') ? rel : `/${rel}`;
}

function titleFromSlug(dirPath: string): string {
  const slug = path.basename(dirPath);
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());
}

function readJson<T = any>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as T;
    }
  } catch {}
  return null;
}

export function getLocalMovies(): Media[] {
  const root = path.join(CONTENT_ROOT, 'movies');
  const dirs = listDirs(root);
  const items: Media[] = [];
  dirs.forEach((dir, index) => {
    const meta = readJson<any>(path.join(dir, 'meta.json')) || {};
    const poster = findFirstFile(dir, ['poster', 'cover'], ['jpg', 'jpeg', 'png', 'webp']);
    const banner = findFirstFile(dir, ['banner', 'backdrop'], ['jpg', 'jpeg', 'png', 'webp']) || poster;
    const video = findFirstFile(dir, ['video', 'trailer', 'source'], ['mp4', 'webm', 'mov']);
    const id = meta.id ?? index + 1;
    const base: Media = {
      id,
      title: meta.title || titleFromSlug(dir),
      overview: meta.overview || '',
      poster: toPublicUrl(poster),
      banner: toPublicUrl(banner),
      rating: Number(meta.rating ?? 4.0),
      genre: (meta.genre || []).map((g: any, i: number) => ({ id: g.id ?? i + 1, name: g.name ?? String(g) }))
    } as Media;
    (base as any).videoUrl = toPublicUrl(video);
    items.push(base);
  });
  return items;
}

export function getLocalEbooks(): Ebook[] {
  const root = path.join(CONTENT_ROOT, 'ebooks');
  const dirs = listDirs(root);
  const items: Ebook[] = [];
  dirs.forEach((dir, index) => {
    const meta = readJson<any>(path.join(dir, 'meta.json')) || {};
    const cover = findFirstFile(dir, ['cover', 'poster'], ['jpg', 'jpeg', 'png', 'webp']);
    const banner = findFirstFile(dir, ['banner', 'backdrop'], ['jpg', 'jpeg', 'png', 'webp']) || cover;
    const pdf = findFirstFile(dir, ['book', 'document', 'pdf'], ['pdf']);
    const id = meta.id ?? index + 1;
    const item: Ebook = {
      id,
      title: meta.title || titleFromSlug(dir),
      overview: meta.overview || '',
      cover: toPublicUrl(cover),
      banner: toPublicUrl(banner),
      rating: Number(meta.rating ?? 4.0),
      genre: (meta.genre || []).map((g: any, i: number) => ({ id: g.id ?? i + 1, name: g.name ?? String(g) })),
      pdfUrl: toPublicUrl(pdf || '')
    };
    items.push(item);
  });
  return items;
}

export type LocalMilestone = { id: number; title: string; overview: string; banner: string };
export function getLocalMilestones(): LocalMilestone[] {
  const root = path.join(CONTENT_ROOT, 'milestones');
  const dirs = listDirs(root);
  const items: LocalMilestone[] = [];
  dirs.forEach((dir, index) => {
    const meta = readJson<any>(path.join(dir, 'meta.json')) || {};
    const banner = findFirstFile(dir, ['banner', 'image', 'cover'], ['jpg', 'jpeg', 'png', 'webp']);
    const id = meta.id ?? index + 1;
    items.push({
      id,
      title: meta.title || titleFromSlug(dir),
      overview: meta.overview || '',
      banner: toPublicUrl(banner || '')
    });
  });
  return items;
}

export function getContentRoot(): string {
  return CONTENT_ROOT;
}

export type LocalHeroSlide = { id: number; img: string; title: string; synopsis: string };
export function getLocalHeroSlides(): LocalHeroSlide[] {
  const dir = path.join(CONTENT_ROOT, 'hero');
  ensureDir(dir);
  const files = fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const slides: LocalHeroSlide[] = files.map((file, idx) => {
    const base = file.replace(/\.[^.]+$/, '');
    const meta = readJson<any>(path.join(dir, `${base}.json`)) || {};
    return {
      id: meta.id ?? idx + 1,
      img: `/content/hero/${file}`,
      title: meta.title || titleFromSlug(base),
      synopsis: meta.synopsis || ''
    };
  });
  return slides;
} 