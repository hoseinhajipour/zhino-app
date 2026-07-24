import type { Article, ArticleCategory, Doctor, PageBuilderDoc, ServiceBlock } from '../types';
import { createEmptyBlock } from './landingToBlocks';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200';

export function slugifyArticleTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `article-${Date.now().toString(36)}`;
}

function legacyContentToHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

export function getArticleInitialBlocks(article: Article): ServiceBlock[] {
  if (article.pageBuilder?.blocks?.length) {
    return article.pageBuilder.blocks;
  }
  if (article.content?.trim()) {
    const block = createEmptyBlock('richText');
    return [
      {
        ...block,
        props: { html: legacyContentToHtml(article.content) },
      },
    ];
  }
  return [createEmptyBlock('richText')];
}

export function createBlankArticle(
  doctors: Doctor[],
  categories: ArticleCategory[]
): Article {
  const preferred =
    categories.find((c) => c.active !== false && c.name === 'سلامت روان و اضطراب') ||
    categories.find((c) => c.active !== false) ||
    categories[0];
  const author = doctors[0];

  return {
    id: `art-${Date.now()}`,
    title: '',
    slug: '',
    authorId: author?.id || '',
    authorName: author?.name || 'نویسنده کلینیک',
    authorAvatar: author?.avatar || '',
    category: preferred?.name || '',
    categoryId: preferred?.id,
    summary: '',
    content: '',
    coverImage: DEFAULT_COVER,
    publishedAt: 'امروز',
    readTime: '۵ دقیقه',
    views: 0,
    status: 'draft',
    tags: [],
    pageBuilder: { version: 1, blocks: [createEmptyBlock('richText')] },
  };
}

export function buildArticlePageBuilder(blocks: ServiceBlock[]): PageBuilderDoc {
  return { version: 1, blocks };
}
