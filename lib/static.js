import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

/** Returns { body, type } for a file inside public/, or null (missing or outside public/). */
export async function readPublic(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  const full = normalize(join(PUBLIC_DIR, decoded));
  if (!full.startsWith(PUBLIC_DIR) || full.endsWith(sep)) return null;
  try {
    return { body: await readFile(full), type: TYPES[extname(full)] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}
