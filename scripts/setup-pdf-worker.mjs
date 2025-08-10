import { promises as fs } from 'fs';
import path from 'path';

async function ensurePdfWorker() {
  const projectRoot = path.resolve(process.cwd());
  const publicDir = path.join(projectRoot, 'public');
  const target = path.join(publicDir, 'pdf.worker.min.js');
  const source = path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');

  try {
    await fs.access(source);
  } catch {
    console.warn('[setup-pdf-worker] pdfjs-dist not installed yet. Skipping.');
    return;
  }

  try {
    const stat = await fs.lstat(target).catch(() => null);
    if (stat && stat.isSymbolicLink()) {
      await fs.unlink(target);
    }
  } catch (e) {
    // ignore
  }

  try {
    await fs.mkdir(publicDir, { recursive: true });
    const data = await fs.readFile(source);
    await fs.writeFile(target, data);
    console.log('[setup-pdf-worker] Ensured public/pdf.worker.min.js is a regular file.');
  } catch (e) {
    console.warn('[setup-pdf-worker] Failed to write worker:', e.message);
  }
}

ensurePdfWorker(); 