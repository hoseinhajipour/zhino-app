import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { uploadsDir } from '../routes/uploads';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.ogg', '.mov', '.m4v']);

function extFromUrlOrType(url: string, contentType?: string | null): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if (ext && (IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext) || ext === '.bin')) return ext;
  } catch {
    // ignore
  }
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('gif')) return '.gif';
  if (ct.includes('svg')) return '.svg';
  if (ct.includes('avif')) return '.avif';
  if (ct.includes('mp4')) return '.mp4';
  if (ct.includes('webm')) return '.webm';
  if (ct.includes('ogg')) return '.ogg';
  if (ct.includes('quicktime')) return '.mov';
  return '.bin';
}

export function isDownloadableMediaUrl(url: string): boolean {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;
  if (url.startsWith('/uploads/') || url.startsWith('/staff/')) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  } catch {
    return false;
  }
  const lower = url.toLowerCase();
  const looksMedia =
    IMAGE_EXT.has(path.extname(new URL(url).pathname).toLowerCase()) ||
    VIDEO_EXT.has(path.extname(new URL(url).pathname).toLowerCase()) ||
    /\.(jpe?g|png|webp|gif|avif|svg|mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url) ||
    /\/wp-content\/uploads\//i.test(lower) ||
    /[?&](format|type)=(jpe?g|png|webp|gif|mp4)/i.test(lower);
  return looksMedia || /wp-content\/uploads/i.test(lower);
}

/** Download a remote image/video into local uploads and return public `/uploads/...` URL. */
export async function downloadRemoteToUploads(
  remoteUrl: string,
  cache?: Map<string, string>
): Promise<string | null> {
  const trimmed = remoteUrl.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return null;
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/staff/')) return trimmed;
  if (cache?.has(trimmed)) return cache.get(trimmed) || null;

  if (!isDownloadableMediaUrl(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const res = await fetch(trimmed, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'ZhinoImporter/1.0 (+https://zhino.local)',
        Accept: 'image/*,video/*,*/*',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type');
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > 50 * 1024 * 1024) return null;

    const ext = extFromUrlOrType(trimmed, contentType);
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const full = path.join(uploadsDir, filename);
    fs.writeFileSync(full, buf);
    const localUrl = `/uploads/${filename}`;
    cache?.set(trimmed, localUrl);
    return localUrl;
  } catch (err) {
    console.warn('downloadRemoteToUploads failed:', trimmed, err);
    return null;
  }
}

/** Collect media URLs from HTML (src, srcset, poster, and common WP classes). */
export function extractMediaUrlsFromHtml(html: string): string[] {
  if (!html) return [];
  const found = new Set<string>();

  const attrRe =
    /(?:src|href|poster|data-src|data-lazy-src|data-full-url)\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(html))) {
    found.add(m[1]);
  }

  const srcsetRe = /srcset\s*=\s*["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html))) {
    m[1].split(',').forEach((part) => {
      const url = part.trim().split(/\s+/)[0];
      if (url) found.add(url);
    });
  }

  const urlRe = /https?:\/\/[^\s"'<>]+?\.(?:jpe?g|png|webp|gif|avif|svg|mp4|webm|ogg|mov|m4v)(?:\?[^\s"'<>]*)?/gi;
  while ((m = urlRe.exec(html))) {
    found.add(m[0]);
  }

  return Array.from(found);
}

/** Download all remote media in HTML and rewrite URLs to local `/uploads/...`. */
export async function localizeHtmlMedia(
  html: string,
  cache?: Map<string, string>
): Promise<{ html: string; downloaded: number; failed: number }> {
  if (!html) return { html: '', downloaded: 0, failed: 0 };
  const urls = extractMediaUrlsFromHtml(html);
  let downloaded = 0;
  let failed = 0;
  let next = html;
  const map = cache || new Map<string, string>();

  for (const url of urls) {
    if (!/^https?:\/\//i.test(url)) continue;
    if (!isDownloadableMediaUrl(url) && !/wp-content\/uploads/i.test(url)) continue;
    const local = await downloadRemoteToUploads(url, map);
    if (local) {
      downloaded += 1;
      // Replace all occurrences of the exact URL
      next = next.split(url).join(local);
    } else {
      failed += 1;
    }
  }

  return { html: next, downloaded, failed };
}
