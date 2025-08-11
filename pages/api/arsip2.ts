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
  // sort folders first, then files; both by name ascending (locale-aware)
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
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