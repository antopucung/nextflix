import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export type ExplorerItem = {
  name: string;
  relPath: string; // relative to the DataFinalArsip root
  type: 'file' | 'dir';
  ext?: string;
  size?: number;
  mtimeMs?: number;
  url?: string; // for files
  coverUrl?: string; // for folders (first image inside)
};

const PUBLIC_ROOT = path.join(process.cwd(), 'public');
const DATA_ROOT_REL = path.join('content', 'DataFinalArsip');
const DATA_ROOT_ABS = path.join(PUBLIC_ROOT, DATA_ROOT_REL);

function isPathInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

const MONTHS_ID: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

function parseIndoDateKey(name: string): number | null {
  // Accept formats like: "29 Mei 1945" or "1 Juni 1945" (case-insensitive)
  const re = /^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/i;
  const m = name.match(re);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const monthName = m[2].toLowerCase();
  const month = MONTHS_ID[monthName];
  if (!month) return null;
  const year = m[3] ? parseInt(m[3], 10) : 1945;
  if (isNaN(d) || isNaN(month) || isNaN(year)) return null;
  // yyyyMMdd numeric key
  return year * 10000 + month * 100 + d;
}

function listDir(absDir: string, relDir: string): ExplorerItem[] {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const items: ExplorerItem[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // hide dotfiles
    const abs = path.join(absDir, entry.name);
    const rel = path.join(relDir, entry.name);
    const stat = fs.statSync(abs);
    if (entry.isDirectory()) {
      // try to find first image inside as cover
      let coverUrl: string | undefined;
      try {
        const inner = fs.readdirSync(abs, { withFileTypes: true });
        const img = inner.find(d => d.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(d.name));
        if (img) coverUrl = '/' + path.posix.join(DATA_ROOT_REL, rel.replace(/\\/g, '/'), img.name);
      } catch {}
      items.push({
        name: entry.name,
        relPath: rel.replace(/\\/g, '/'),
        type: 'dir',
        mtimeMs: stat.mtimeMs,
        coverUrl
      });
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).slice(1).toLowerCase();
      items.push({
        name: entry.name,
        relPath: rel.replace(/\\/g, '/'),
        type: 'file',
        ext,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        url: '/' + path.posix.join(DATA_ROOT_REL, rel.replace(/\\/g, '/'))
      });
    }
  }
  // sort folders first, then files; folders by date-name if detected, else by name; files by name
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    if (a.type === 'dir' && b.type === 'dir') {
      const ka = parseIndoDateKey(a.name);
      const kb = parseIndoDateKey(b.name);
      if (ka != null && kb != null) return ka - kb; // chronological ascending
      if (ka != null && kb == null) return -1; // date-like before plain
      if (kb != null && ka == null) return 1;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
  return items;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<{ type: 'Success'; cwd: string; breadcrumb: string[]; items: ExplorerItem[] } | { type: 'Error'; error: string }>) {
  try {
    const q = (req.query.path as string | undefined) || '';
    const safeRel = q.replace(/^\/+|\/+$/g, '');
    const abs = path.join(DATA_ROOT_ABS, safeRel);

    if (!isPathInside(DATA_ROOT_ABS, abs) && abs !== DATA_ROOT_ABS) {
      return res.status(400).json({ type: 'Error', error: 'Invalid path' });
    }
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ type: 'Error', error: 'Path not found' });
    }

    const stat = fs.statSync(abs);
    const dir = stat.isDirectory() ? abs : path.dirname(abs);
    const relDir = stat.isDirectory() ? safeRel : path.dirname(safeRel);

    const items = listDir(dir, relDir);
    const breadcrumb = relDir ? relDir.split(/[\\\/]+/).filter(Boolean) : [];

    return res.status(200).json({ type: 'Success', cwd: relDir.replace(/\\/g, '/'), breadcrumb, items });
  } catch (e: any) {
    return res.status(500).json({ type: 'Error', error: e?.message || 'Unknown error' });
  }
} 