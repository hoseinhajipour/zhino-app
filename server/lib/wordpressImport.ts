import crypto from 'crypto';
import { upsertEntity } from '../db';
import { downloadRemoteToUploads, localizeHtmlMedia } from './mediaDownload';

export type WpImportOptions = {
  importPosts: boolean;
  importPages: boolean;
  downloadMedia: boolean;
  /** draft | published | keep */
  statusMode: 'draft' | 'published' | 'keep';
};

export type WpImportResult = {
  posts: number;
  pages: number;
  mediaDownloaded: number;
  mediaFailed: number;
  skipped: number;
  warnings: string[];
};

type NormalizedWpItem = {
  type: 'post' | 'page';
  title: string;
  slug: string;
  contentHtml: string;
  excerpt: string;
  status: string;
  date: string;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  authorName?: string;
};

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || `item-${Date.now().toString(36)}`;
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object' && 'rendered' in (v as object)) {
      const r = (v as { rendered?: unknown }).rendered;
      if (typeof r === 'string' && r.trim()) return r.trim();
    }
  }
  return '';
}

function estimateReadTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} دقیقه`;
}

function mapStatus(wpStatus: string, mode: WpImportOptions['statusMode']): 'published' | 'draft' {
  if (mode === 'published') return 'published';
  if (mode === 'draft') return 'draft';
  const s = (wpStatus || '').toLowerCase();
  if (s === 'publish' || s === 'published') return 'published';
  return 'draft';
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

function parseWxr(xml: string): NormalizedWpItem[] {
  const items: NormalizedWpItem[] = [];
  const attachmentById = new Map<string, string>();

  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  const blocks: string[] = [];
  while ((match = itemRe.exec(xml))) {
    blocks.push(match[1]);
  }

  const getFrom = (block: string, tag: string) => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = block.match(re);
    return m ? decodeEntities(m[1].trim()) : '';
  };

  // First pass: attachment URLs
  for (const block of blocks) {
    const postType = getFrom(block, 'wp:post_type').toLowerCase();
    if (postType !== 'attachment') continue;
    const id = getFrom(block, 'wp:post_id');
    const url = getFrom(block, 'wp:attachment_url') || getFrom(block, 'guid');
    if (id && url) attachmentById.set(id, url);
  }

  for (const block of blocks) {
    const postType = getFrom(block, 'wp:post_type').toLowerCase();
    if (postType !== 'post' && postType !== 'page') continue;

    const cats: string[] = [];
    const tags: string[] = [];
    const catRe =
      /<category[^>]*domain=["']([^"']+)["'][^>]*nicename=["']([^"']+)["'][^>]*>([\s\S]*?)<\/category>/gi;
    let cm: RegExpExecArray | null;
    while ((cm = catRe.exec(block))) {
      const domain = cm[1];
      const label = decodeEntities(cm[3].trim());
      if (domain === 'post_tag') tags.push(label || cm[2]);
      else if (domain === 'category') cats.push(label || cm[2]);
    }

    let featured = '';
    const thumbMeta =
      /<wp:meta_key>(?:<!\[CDATA\[)?_thumbnail_id(?:\]\]>)?<\/wp:meta_key>\s*<wp:meta_value>(?:<!\[CDATA\[)?(\d+)(?:\]\]>)?<\/wp:meta_value>/i.exec(
        block
      );
    if (thumbMeta?.[1] && attachmentById.has(thumbMeta[1])) {
      featured = attachmentById.get(thumbMeta[1]) || '';
    }

    items.push({
      type: postType as 'post' | 'page',
      title: getFrom(block, 'title') || 'بدون عنوان',
      slug: getFrom(block, 'wp:post_name') || slugify(getFrom(block, 'title') || 'item'),
      contentHtml: getFrom(block, 'content:encoded') || getFrom(block, 'description') || '',
      excerpt: getFrom(block, 'excerpt:encoded') || '',
      status: getFrom(block, 'wp:status') || 'publish',
      date: getFrom(block, 'wp:post_date') || getFrom(block, 'pubDate') || new Date().toISOString(),
      featuredImage: featured || undefined,
      categories: cats,
      tags,
      authorName: getFrom(block, 'dc:creator') || undefined,
    });
  }
  return items;
}

function normalizeJsonItem(raw: Record<string, unknown>, forcedType?: 'post' | 'page'): NormalizedWpItem | null {
  const typeRaw = String(
    forcedType || raw.type || raw.post_type || raw.postType || 'post'
  ).toLowerCase();
  const type: 'post' | 'page' =
    typeRaw === 'page' || typeRaw === 'pages' ? 'page' : 'post';

  const title = pickString(raw.title, raw.post_title, raw.name);
  if (!title && !pickString(raw.content, raw.content_html, raw.post_content)) return null;

  const contentHtml = pickString(
    raw.content,
    (raw.content as { rendered?: string })?.rendered,
    raw.content_html,
    raw.post_content,
    raw.html,
    raw.body
  );
  const excerpt = pickString(
    raw.excerpt,
    (raw.excerpt as { rendered?: string })?.rendered,
    raw.post_excerpt,
    raw.summary
  );
  const slug = pickString(raw.slug, raw.post_name, raw.post_name) || slugify(title || 'item');
  const status = pickString(raw.status, raw.post_status) || 'publish';
  const date = pickString(raw.date, raw.date_gmt, raw.post_date, raw.publishedAt) || new Date().toISOString();
  const featuredImage = pickString(
    raw.featured_image,
    raw.featuredImage,
    raw.featured_media_url,
    raw.featuredMediaUrl,
    raw.coverImage,
    raw.jetpack_featured_media_url,
    typeof raw.featured_media === 'object'
      ? pickString((raw.featured_media as { source_url?: string })?.source_url)
      : ''
  );

  const categories: string[] = [];
  const tags: string[] = [];
  const catField = raw.categories || raw.category;
  if (Array.isArray(catField)) {
    catField.forEach((c) => {
      if (typeof c === 'string') categories.push(c);
      else if (c && typeof c === 'object') {
        const name = pickString((c as { name?: string }).name, (c as { title?: string }).title);
        if (name) categories.push(name);
      }
    });
  } else if (typeof catField === 'string' && catField) {
    categories.push(catField);
  }
  const tagField = raw.tags;
  if (Array.isArray(tagField)) {
    tagField.forEach((t) => {
      if (typeof t === 'string') tags.push(t);
      else if (t && typeof t === 'object') {
        const name = pickString((t as { name?: string }).name);
        if (name) tags.push(name);
      }
    });
  }

  return {
    type,
    title: title || 'بدون عنوان',
    slug,
    contentHtml,
    excerpt,
    status,
    date,
    featuredImage: featuredImage || undefined,
    categories,
    tags,
    authorName: pickString(raw.author_name, raw.authorName, (raw.author as { name?: string })?.name) || undefined,
  };
}

function parseWpJson(data: unknown): NormalizedWpItem[] {
  const items: NormalizedWpItem[] = [];

  const pushArr = (arr: unknown[], forced?: 'post' | 'page') => {
    arr.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const n = normalizeJsonItem(row as Record<string, unknown>, forced);
      if (n) items.push(n);
    });
  };

  if (Array.isArray(data)) {
    pushArr(data);
    return items;
  }

  if (!data || typeof data !== 'object') return items;
  const root = data as Record<string, unknown>;

  // Common shapes
  if (Array.isArray(root.posts)) pushArr(root.posts, 'post');
  if (Array.isArray(root.pages)) pushArr(root.pages, 'page');
  if (Array.isArray(root.data)) pushArr(root.data);
  if (Array.isArray(root.items)) pushArr(root.items);

  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    const d = root.data as Record<string, unknown>;
    if (Array.isArray(d.posts)) pushArr(d.posts, 'post');
    if (Array.isArray(d.pages)) pushArr(d.pages, 'page');
  }

  // Single post/page document
  if (items.length === 0 && (root.title || root.content || root.post_content)) {
    const n = normalizeJsonItem(root);
    if (n) items.push(n);
  }

  return items;
}

export function detectWordpressPayload(raw: string): 'wxr' | 'json' | 'unknown' {
  const trimmed = raw.trim();
  if (!trimmed) return 'unknown';
  if (trimmed.startsWith('<') || /<rss[\s>]|<channel>|wp:post_type/i.test(trimmed.slice(0, 2000))) {
    return 'wxr';
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'unknown';
}

export function parseWordpressExport(raw: string): NormalizedWpItem[] {
  const kind = detectWordpressPayload(raw);
  if (kind === 'wxr') return parseWxr(raw);
  if (kind === 'json') {
    try {
      return parseWpJson(JSON.parse(raw));
    } catch {
      throw new Error('فایل JSON وردپرس نامعتبر است.');
    }
  }
  throw new Error('فرمت فایل پشتیبانی نمی‌شود. JSON یا خروجی استاندارد وردپرس (WXR/XML) بفرستید.');
}

function toRichTextPageBuilder(html: string) {
  return {
    version: 1 as const,
    blocks: [
      {
        id: uid('rt'),
        type: 'richText' as const,
        props: { html },
      },
    ],
  };
}

export async function importWordpressContent(
  raw: string,
  options: WpImportOptions
): Promise<WpImportResult> {
  const parsed = parseWordpressExport(raw);
  const cache = new Map<string, string>();
  const result: WpImportResult = {
    posts: 0,
    pages: 0,
    mediaDownloaded: 0,
    mediaFailed: 0,
    skipped: 0,
    warnings: [],
  };

  for (const item of parsed) {
    if (item.type === 'post' && !options.importPosts) {
      result.skipped += 1;
      continue;
    }
    if (item.type === 'page' && !options.importPages) {
      result.skipped += 1;
      continue;
    }

    let html = item.contentHtml || '';
    let cover = item.featuredImage || '';

    if (options.downloadMedia) {
      const localized = await localizeHtmlMedia(html, cache);
      html = localized.html;
      result.mediaDownloaded += localized.downloaded;
      result.mediaFailed += localized.failed;

      if (cover && /^https?:\/\//i.test(cover)) {
        const localCover = await downloadRemoteToUploads(cover, cache);
        if (localCover) {
          cover = localCover;
          result.mediaDownloaded += 1;
        } else {
          result.mediaFailed += 1;
        }
      }
    }

    const status = mapStatus(item.status, options.statusMode);

    if (item.type === 'post') {
      const id = uid('art');
      const categoryName = item.categories[0] || 'عمومی';
      await upsertEntity('articles', id, {
        id,
        title: item.title,
        slug: item.slug,
        authorId: 'imported-wp',
        authorName: item.authorName || 'وردپرس',
        category: categoryName,
        summary: item.excerpt.replace(/<[^>]+>/g, '').slice(0, 280) || item.title,
        content: html,
        coverImage: cover || '',
        publishedAt: item.date,
        readTime: estimateReadTime(html),
        views: 0,
        status,
        tags: item.tags.length ? item.tags : item.categories,
        pageBuilder: toRichTextPageBuilder(html),
      });
      result.posts += 1;
    } else {
      const id = uid('page');
      await upsertEntity('pages', id, {
        id,
        slug: item.slug,
        title: item.title,
        status,
        isSystem: false,
        coverImage: cover || '',
        excerpt: item.excerpt.replace(/<[^>]+>/g, '').slice(0, 280),
        layoutWidth: 'contained',
        updatedAt: new Date().toISOString(),
        pageBuilder: toRichTextPageBuilder(html),
      });
      result.pages += 1;
    }
  }

  if (!parsed.length) {
    result.warnings.push('هیچ پست یا صفحه‌ای در فایل پیدا نشد.');
  }

  return result;
}
