import React, { useEffect, useMemo, useState } from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, PageScreen, ServiceBlock, ServiceItem, SitePage } from '../types';
import { ArticleDetailPage } from './ArticleDetailPage';
import { BlockRenderer } from '../components/page-builder/BlockRenderer';
import { createDefaultSitePage } from '../lib/sitePageDefaults';
import { fetchArticleCategories, fetchSitePage } from '../lib/dbService';

interface BlogPageProps {
  articles: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  onOpenBooking: () => void;
  selectedArticleSlug?: string | null;
  onSelectArticle?: (article: Article) => void;
  onBackToBlog?: () => void;
  services?: ServiceItem[];
  doctors?: Doctor[];
  sitePage?: SitePage | null;
  bookingEnabled?: boolean;
  onNavigate?: (screen: PageScreen) => void;
}

function normalizeCategories(
  list: unknown,
  fallbackArticles: Article[]
): Array<{ id: string; name: string }> {
  if (Array.isArray(list) && list.length) {
    return list
      .map((item) => {
        if (typeof item === 'string') return { id: item, name: item };
        if (item && typeof item === 'object') {
          const row = item as { id?: string; name?: string };
          const name = String(row.name || '').trim();
          if (!name) return null;
          return { id: String(row.id || name), name };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;
  }
  return Array.from(new Set(fallbackArticles.map((a) => a.category).filter(Boolean))).map((name) => ({
    id: name,
    name,
  }));
}

export const BlogPage: React.FC<BlogPageProps> = ({
  articles,
  faqs = [],
  contact = null,
  onOpenBooking,
  selectedArticleSlug,
  onSelectArticle,
  onBackToBlog,
  services = [],
  doctors = [],
  sitePage,
  bookingEnabled = true,
  onNavigate,
}) => {
  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === 'published'),
    [articles]
  );

  const [resolvedPage, setResolvedPage] = useState<SitePage | null>(sitePage ?? null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (sitePage?.pageBuilder?.blocks?.length) {
      setResolvedPage(sitePage);
      return;
    }
    let cancelled = false;
    fetchSitePage('blog')
      .then((data) => {
        if (cancelled) return;
        setResolvedPage(data?.pageBuilder?.blocks?.length ? data : createDefaultSitePage('blog'));
      })
      .catch(() => {
        if (!cancelled) setResolvedPage(createDefaultSitePage('blog'));
      });
    return () => {
      cancelled = true;
    };
  }, [sitePage]);

  useEffect(() => {
    fetchArticleCategories()
      .then((list) => setCategories(normalizeCategories(list, publishedArticles)))
      .catch(() => setCategories(normalizeCategories(null, publishedArticles)));
  }, [publishedArticles]);

  const activeArticle = useMemo(() => {
    if (!selectedArticleSlug) return null;
    return (
      publishedArticles.find(
        (a) => a.slug === selectedArticleSlug || a.id === selectedArticleSlug
      ) || null
    );
  }, [publishedArticles, selectedArticleSlug]);

  if (selectedArticleSlug && activeArticle) {
    return (
      <ArticleDetailPage
        article={activeArticle}
        allArticles={publishedArticles}
        faqs={faqs}
        contact={contact}
        onBack={() => onBackToBlog?.()}
        onSelectArticle={(art) => onSelectArticle?.(art)}
        onOpenBooking={onOpenBooking}
      />
    );
  }

  if (selectedArticleSlug && !activeArticle) {
    return (
      <div className="max-w-lg mx-auto my-16 text-center p-8 space-y-4 bg-surface-container-low rounded-3xl border border-outline-variant/30">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">article</span>
        <h2 className="font-black text-lg text-on-surface">مقاله یافت نشد</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          این لینک معتبر نیست یا مقاله هنوز منتشر نشده است.
        </p>
        <button
          type="button"
          onClick={() => onBackToBlog?.()}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
        >
          بازگشت به فهرست مقالات
        </button>
      </div>
    );
  }

  const page = resolvedPage || createDefaultSitePage('blog');
  const rawBlocks: ServiceBlock[] = page.pageBuilder?.blocks?.length
    ? page.pageBuilder.blocks
    : createDefaultSitePage('blog').pageBuilder.blocks;

  // Builder blocks without articlesGrid — listing is rendered below reliably
  const shellBlocks = rawBlocks.filter((b) => b.type !== 'articlesGrid');
  const displayBlocks =
    shellBlocks.length > 0
      ? shellBlocks
      : createDefaultSitePage('blog').pageBuilder.blocks.filter((b) => b.type !== 'articlesGrid');

  const filteredArticles = publishedArticles.filter((art) => {
    const matchesCat =
      selectedCategory === 'all' ||
      art.category === selectedCategory ||
      art.categoryId === selectedCategory;
    const q = searchQuery.trim();
    const matchesSearch =
      !q ||
      art.title.includes(q) ||
      art.summary.includes(q) ||
      art.tags.some((t) => t.includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-12 pb-16 text-right max-w-[1200px] mx-auto px-4 md:px-6 animate-fade-in">
      <BlockRenderer
        blocks={displayBlocks}
        ctx={{
          serviceId: 'blog',
          allServices: services,
          doctors,
          articles,
          faqs,
          contact,
          bookingEnabled,
          onOpenBooking,
          onNavigate,
          onSelectArticle: (art) => onSelectArticle?.(art),
        }}
      />

      <section className="space-y-8">
        <h2 className="text-2xl font-black text-primary text-center">آخرین مقالات</h2>

        <div className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                همه ({publishedArticles.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مقاله یا موضوع..."
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => onSelectArticle?.(art)}
                className="bg-white dark:bg-surface-dim rounded-3xl overflow-hidden shadow-soft border border-outline-variant/30 flex flex-col justify-between group hover:shadow-xl transition-all cursor-pointer"
              >
                <div>
                  <div className="aspect-video relative overflow-hidden bg-surface-container">
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 right-3 bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      {art.category}
                    </span>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        زمان مطالعه: {art.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {art.views} بازدید
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 text-xs font-bold text-primary flex items-center gap-1">
                  <span>ادامه مطلب</span>
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-2">
                article_shortcut
              </span>
              <h3 className="text-lg font-bold text-on-surface">مقاله‌ای یافت نشد</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                فیلتر یا جستجوی دیگری را امتحان کنید.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
