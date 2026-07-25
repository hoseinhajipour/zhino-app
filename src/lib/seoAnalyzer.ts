import type { Article, ContentSeoSettings, ServiceBlock, SitePage } from '../types';
import type { ContainerColumn } from './containerColumn';

export type SeoCheckStatus = 'ok' | 'warn' | 'fail';

export interface SeoCheck {
  id: string;
  label: string;
  status: SeoCheckStatus;
  /** Points awarded (0 … max) */
  score: number;
  max: number;
  hint?: string;
}

export interface SeoAnalysisResult {
  /** 0–100 */
  score: number;
  /** Zero-padded three-digit display e.g. "085" */
  scoreLabel: string;
  grade: 'bad' | 'ok' | 'good';
  checks: SeoCheck[];
}

export interface SeoAnalyzeInput {
  title: string;
  slug: string;
  /** Fallback body text when blocks are empty */
  content?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  blocks?: ServiceBlock[];
  seo?: ContentSeoSettings | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function collectFromProps(props: Record<string, unknown>, out: string[]) {
  const keys = [
    'title',
    'subtitle',
    'heading',
    'headline',
    'text',
    'body',
    'description',
    'html',
    'content',
    'label',
    'caption',
    'quote',
    'name',
    'buttonText',
    'ctaText',
    'eyebrow',
  ];
  for (const k of keys) {
    const v = asString(props[k]).trim();
    if (v) out.push(v);
  }
  if (Array.isArray(props.items)) {
    for (const item of props.items) {
      if (item && typeof item === 'object') {
        collectFromProps(item as Record<string, unknown>, out);
      } else if (typeof item === 'string') {
        out.push(item);
      }
    }
  }
  if (Array.isArray(props.features)) {
    for (const item of props.features) {
      if (item && typeof item === 'object') collectFromProps(item as Record<string, unknown>, out);
    }
  }
}

function walkBlocks(blocks: ServiceBlock[] | undefined, out: string[]) {
  if (!blocks?.length) return;
  for (const b of blocks) {
    collectFromProps(b.props || {}, out);
    if (b.type === 'container') {
      const columns = (Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[];
      for (const col of columns) {
        walkBlocks(col.blocks || [], out);
      }
    }
  }
}

function extractBodyText(input: SeoAnalyzeInput): string {
  const parts: string[] = [];
  walkBlocks(input.blocks, parts);
  if (input.content?.trim()) parts.push(input.content);
  return stripHtml(parts.join(' '));
}

function hasHeading(blocks: ServiceBlock[] | undefined, levels: string[]): boolean {
  if (!blocks?.length) return false;
  for (const b of blocks) {
    const html = asString(b.props.html);
    if (html) {
      for (const lvl of levels) {
        if (new RegExp(`<${lvl}\\b`, 'i').test(html)) return true;
      }
    }
    const title = asString(b.props.title) || asString(b.props.heading) || asString(b.props.headline);
    if (title && (b.type === 'hero' || b.type === 'pageHero' || b.type === 'heroHeader' || b.type === 'cta')) {
      if (levels.includes('h1') || levels.includes('h2')) return true;
    }
    if (b.type === 'container') {
      const columns = (Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[];
      for (const col of columns) {
        if (hasHeading(col.blocks || [], levels)) return true;
      }
    }
  }
  return false;
}

function normalizeKeyword(kw: string): string {
  return kw.trim().toLowerCase().replace(/\s+/g, ' ');
}

function includesKeyword(haystack: string, keyword: string): boolean {
  if (!keyword) return false;
  return haystack.toLowerCase().includes(keyword);
}

function countOccurrences(haystack: string, keyword: string): number {
  if (!keyword) return 0;
  const h = haystack.toLowerCase();
  const k = keyword.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = h.indexOf(k, idx)) !== -1) {
    count += 1;
    idx += k.length || 1;
  }
  return count;
}

function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function check(
  id: string,
  label: string,
  status: SeoCheckStatus,
  score: number,
  max: number,
  hint?: string
): SeoCheck {
  return { id, label, status, score, max, hint };
}

/**
 * Rank Math–style on-page SEO checks → score 0–100.
 */
export function analyzeSeo(input: SeoAnalyzeInput): SeoAnalysisResult {
  const focus = normalizeKeyword(input.seo?.focusKeyword || '');
  const seoTitle = (input.seo?.seoTitle || input.title || '').trim();
  const seoDesc = (input.seo?.seoDescription || input.excerpt || '').trim();
  const slug = (input.slug || '').replace(/^\/+/, '').toLowerCase();
  const body = extractBodyText(input);
  const words = wordCount(body);
  const titleLen = seoTitle.length;
  const descLen = seoDesc.length;
  const hasCover = Boolean(input.coverImage?.trim());
  const tags = input.tags || [];

  const checks: SeoCheck[] = [];

  // 1. Focus keyword set (10)
  if (focus) {
    checks.push(check('focus', 'کلمهٔ کلیدی کانونی تنظیم شده', 'ok', 10, 10));
  } else {
    checks.push(
      check('focus', 'کلمهٔ کلیدی کانونی تنظیم شده', 'fail', 0, 10, 'یک عبارت اصلی برای تمرکز سئو وارد کنید.')
    );
  }

  // 2. Keyword in SEO title (10)
  if (!focus) {
    checks.push(check('kw-title', 'کلمهٔ کلیدی در عنوان سئو', 'fail', 0, 10, 'ابتدا کلمهٔ کلیدی را تنظیم کنید.'));
  } else if (includesKeyword(seoTitle, focus)) {
    checks.push(check('kw-title', 'کلمهٔ کلیدی در عنوان سئو', 'ok', 10, 10));
  } else {
    checks.push(
      check('kw-title', 'کلمهٔ کلیدی در عنوان سئو', 'fail', 0, 10, 'عنوان سئو باید شامل کلمهٔ کلیدی کانونی باشد.')
    );
  }

  // 3. Title length (10) — Persian titles often shorter; allow 25–70
  if (!seoTitle) {
    checks.push(check('title-len', 'طول عنوان سئو مناسب است', 'fail', 0, 10, 'عنوان سئو خالی است.'));
  } else if (titleLen >= 25 && titleLen <= 70) {
    checks.push(check('title-len', 'طول عنوان سئو مناسب است', 'ok', 10, 10));
  } else if (titleLen >= 15 && titleLen <= 90) {
    checks.push(
      check(
        'title-len',
        'طول عنوان سئو مناسب است',
        'warn',
        5,
        10,
        `طول فعلی ${titleLen} کاراکتر — هدف حدود ۲۵ تا ۷۰.`
      )
    );
  } else {
    checks.push(
      check(
        'title-len',
        'طول عنوان سئو مناسب است',
        'fail',
        0,
        10,
        `طول فعلی ${titleLen} کاراکتر — خیلی کوتاه یا خیلی بلند.`
      )
    );
  }

  // 4. Keyword in meta description (10)
  if (!focus) {
    checks.push(check('kw-desc', 'کلمهٔ کلیدی در توضیحات متا', 'fail', 0, 10));
  } else if (includesKeyword(seoDesc, focus)) {
    checks.push(check('kw-desc', 'کلمهٔ کلیدی در توضیحات متا', 'ok', 10, 10));
  } else {
    checks.push(
      check(
        'kw-desc',
        'کلمهٔ کلیدی در توضیحات متا',
        'fail',
        0,
        10,
        'چکیده / توضیحات متا باید کلمهٔ کلیدی را داشته باشد.'
      )
    );
  }

  // 5. Meta description length (10)
  if (!seoDesc) {
    checks.push(check('desc-len', 'طول توضیحات متا مناسب است', 'fail', 0, 10, 'چکیده یا توضیحات سئو را بنویسید.'));
  } else if (descLen >= 110 && descLen <= 160) {
    checks.push(check('desc-len', 'طول توضیحات متا مناسب است', 'ok', 10, 10));
  } else if (descLen >= 70 && descLen <= 200) {
    checks.push(
      check(
        'desc-len',
        'طول توضیحات متا مناسب است',
        'warn',
        5,
        10,
        `طول فعلی ${descLen} — هدف حدود ۱۱۰ تا ۱۶۰ کاراکتر.`
      )
    );
  } else {
    checks.push(
      check('desc-len', 'طول توضیحات متا مناسب است', 'fail', 0, 10, `طول فعلی ${descLen} کاراکتر.`)
    );
  }

  // 6. Keyword in content (10)
  if (!focus) {
    checks.push(check('kw-body', 'کلمهٔ کلیدی در متن محتوا', 'fail', 0, 10));
  } else if (includesKeyword(body, focus)) {
    checks.push(check('kw-body', 'کلمهٔ کلیدی در متن محتوا', 'ok', 10, 10));
  } else {
    checks.push(
      check('kw-body', 'کلمهٔ کلیدی در متن محتوا', 'fail', 0, 10, 'حداقل یک‌بار کلمهٔ کلیدی را در متن بیاورید.')
    );
  }

  // 7. Content length (10)
  if (words >= 300) {
    checks.push(check('length', 'حجم محتوا کافی است', 'ok', 10, 10));
  } else if (words >= 150) {
    checks.push(
      check('length', 'حجم محتوا کافی است', 'warn', 5, 10, `${words} کلمه — بهتر است حداقل ۳۰۰ کلمه باشد.`)
    );
  } else {
    checks.push(
      check('length', 'حجم محتوا کافی است', 'fail', 0, 10, `${words} کلمه — محتوا خیلی کوتاه است.`)
    );
  }

  // 8. Keyword density (5)
  if (!focus || words === 0) {
    checks.push(check('density', 'تراکم کلمهٔ کلیدی مناسب است', 'fail', 0, 5));
  } else {
    const occ = countOccurrences(body, focus);
    const density = (occ * focus.split(/\s+/).length) / words;
    if (density >= 0.005 && density <= 0.03) {
      checks.push(check('density', 'تراکم کلمهٔ کلیدی مناسب است', 'ok', 5, 5));
    } else if (density > 0 && density < 0.05) {
      checks.push(
        check(
          'density',
          'تراکم کلمهٔ کلیدی مناسب است',
          'warn',
          2,
          5,
          `تراکم تقریبی ${(density * 100).toFixed(1)}٪ — هدف حدود ۰٫۵ تا ۳٪.`
        )
      );
    } else {
      checks.push(
        check(
          'density',
          'تراکم کلمهٔ کلیدی مناسب است',
          'fail',
          0,
          5,
          occ === 0 ? 'کلمهٔ کلیدی در متن نیست.' : 'تراکم بیش از حد یا خیلی کم است.'
        )
      );
    }
  }

  // 9. Keyword in URL / slug (5)
  if (!focus) {
    checks.push(check('kw-slug', 'کلمهٔ کلیدی در آدرس (Slug)', 'fail', 0, 5));
  } else {
    const slugHay = slug.replace(/-/g, ' ');
    const focusSlug = focus.replace(/\s+/g, ' ');
    if (includesKeyword(slugHay, focusSlug) || includesKeyword(slug, focus.replace(/\s+/g, '-'))) {
      checks.push(check('kw-slug', 'کلمهٔ کلیدی در آدرس (Slug)', 'ok', 5, 5));
    } else {
      checks.push(
        check('kw-slug', 'کلمهٔ کلیدی در آدرس (Slug)', 'warn', 0, 5, 'نامک را با کلمهٔ کلیدی هماهنگ کنید.')
      );
    }
  }

  // 10. Cover image (5)
  if (hasCover) {
    checks.push(check('cover', 'تصویر شاخص دارد', 'ok', 5, 5));
  } else {
    checks.push(check('cover', 'تصویر شاخص دارد', 'fail', 0, 5, 'یک تصویر شاخص برای اشتراک و سئو اضافه کنید.'));
  }

  // 11. Structure: H1 / hero title (5)
  const hasH1 =
    Boolean(seoTitle) || hasHeading(input.blocks, ['h1']) || Boolean(input.title?.trim());
  if (hasH1) {
    checks.push(check('h1', 'عنوان اصلی / ساختار H1', 'ok', 5, 5));
  } else {
    checks.push(check('h1', 'عنوان اصلی / ساختار H1', 'fail', 0, 5));
  }

  // 12. Subheadings H2 (5)
  if (hasHeading(input.blocks, ['h2', 'h3'])) {
    checks.push(check('h2', 'زیرعنوان‌ها (H2/H3) در محتوا', 'ok', 5, 5));
  } else {
    checks.push(
      check('h2', 'زیرعنوان‌ها (H2/H3) در محتوا', 'warn', 2, 5, 'با تیترهای میانی خوانایی و سئو بهتر می‌شود.')
    );
  }

  // 13. Keyword near start of content (5)
  if (!focus || !body) {
    checks.push(check('kw-start', 'کلمهٔ کلیدی در ابتدای محتوا', 'fail', 0, 5));
  } else if (includesKeyword(body.slice(0, Math.min(150, body.length)), focus)) {
    checks.push(check('kw-start', 'کلمهٔ کلیدی در ابتدای محتوا', 'ok', 5, 5));
  } else {
    checks.push(
      check(
        'kw-start',
        'کلمهٔ کلیدی در ابتدای محتوا',
        'warn',
        2,
        5,
        'سعی کنید کلمهٔ کلیدی را در ۱۰۰–۱۵۰ کاراکتر اول بیاورید.'
      )
    );
  }

  // 14. Tags (bonus-ish but part of 100 — redistribute: we have 10+10+10+10+10+10+10+5+5+5+5+5+5 = 100)
  // Already at 100. Skip tags as separate points; mention in density area if useful.
  void tags;

  const score = Math.min(
    100,
    Math.max(
      0,
      checks.reduce((sum, c) => sum + c.score, 0)
    )
  );
  const grade: SeoAnalysisResult['grade'] = score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad';

  return {
    score,
    scoreLabel: String(score).padStart(3, '0'),
    grade,
    checks,
  };
}

export function buildSeoPayload(
  seo: ContentSeoSettings | null | undefined,
  analysis: SeoAnalysisResult
): ContentSeoSettings {
  return {
    focusKeyword: (seo?.focusKeyword || '').trim(),
    seoTitle: (seo?.seoTitle || '').trim() || undefined,
    seoDescription: (seo?.seoDescription || '').trim() || undefined,
    score: analysis.score,
  };
}

export function analyzeArticleSeo(article: Article, blocks?: ServiceBlock[]): SeoAnalysisResult {
  return analyzeSeo({
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.summary,
    coverImage: article.coverImage,
    tags: article.tags,
    blocks: blocks ?? article.pageBuilder?.blocks,
    seo: article.seo,
  });
}

export function analyzePageSeo(page: SitePage, blocks?: ServiceBlock[]): SeoAnalysisResult {
  return analyzeSeo({
    title: page.title,
    slug: page.slug,
    excerpt: page.excerpt,
    coverImage: page.coverImage,
    blocks: blocks ?? page.pageBuilder?.blocks,
    seo: page.seo,
  });
}
