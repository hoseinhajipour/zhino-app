import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Article, ServiceItem, SitePage } from '../types';

type SearchResult =
  | { kind: 'service'; item: ServiceItem }
  | { kind: 'article'; item: Article }
  | { kind: 'page'; item: SitePage };

interface SiteSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: string) => void;
}

const normalize = (value: string) => value.toLocaleLowerCase('fa-IR').trim();

const includesQuery = (value: string | undefined, query: string) => normalize(value || '').includes(query);

const pageTarget = (page: SitePage) =>
  page.isSystem || ['home', 'about', 'contact', 'blog'].includes(page.id)
    ? page.id
    : `/p/${page.slug || page.id}`;

const resultDescription = (result: SearchResult) => {
  switch (result.kind) {
    case 'service':
      return result.item.excerpt || result.item.description;
    case 'article':
      return result.item.summary;
    case 'page':
      return result.item.excerpt || result.item.slug;
  }
};

export const SiteSearchModal: React.FC<SiteSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!isOpen || trimmedQuery.length < 2) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const [serviceData, articleData, pageData] = await Promise.all([
          fetch('/api/services', { signal: controller.signal }).then((res) => {
            if (!res.ok) throw new Error();
            return res.json() as Promise<ServiceItem[]>;
          }),
          fetch('/api/articles', { signal: controller.signal }).then((res) => {
            if (!res.ok) throw new Error();
            return res.json() as Promise<Article[]>;
          }),
          fetch('/api/pages', { signal: controller.signal }).then((res) => {
            if (!res.ok) throw new Error();
            return res.json() as Promise<SitePage[]>;
          }),
        ]);
        setServices(serviceData);
        setArticles(articleData);
        setPages(pageData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('دریافت نتایج جستجو با خطا مواجه شد. دوباره تلاش کنید.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(query);
    if (q.length < 2) return [];

    const serviceResults = services
      .filter(
        (item) =>
          item.active !== false &&
          [item.title, item.description, item.excerpt, item.badge].some((value) => includesQuery(value, q))
      )
      .map((item) => ({ kind: 'service' as const, item }));
    const articleResults = articles
      .filter(
        (item) =>
          item.status === 'published' &&
          [item.title, item.summary, item.category, item.tags.join(' ')].some((value) => includesQuery(value, q))
      )
      .map((item) => ({ kind: 'article' as const, item }));
    const pageResults = pages
      .filter(
        (item) =>
          item.status !== 'draft' &&
          [item.title, item.excerpt, item.slug].some((value) => includesQuery(value, q))
      )
      .map((item) => ({ kind: 'page' as const, item }));

    return [...serviceResults, ...articleResults, ...pageResults].slice(0, 18);
  }, [articles, pages, query, services]);

  if (!isOpen) return null;

  const selectResult = (result: SearchResult) => {
    const target =
      result.kind === 'service'
        ? `/service/${result.item.id}`
        : result.kind === 'article'
          ? `/blog/${result.item.slug || result.item.id}`
          : pageTarget(result.item);
    onNavigate(target);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/55 p-4 pt-[max(5rem,12vh)] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="جستجوی سایت"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:bg-surface-dim">
        <div className="flex items-center gap-3 border-b border-outline-variant/30 px-4 py-3.5">
          <span className="material-symbols-outlined text-2xl text-primary">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در خدمات، مقالات و صفحات..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-on-surface outline-none placeholder:text-on-surface-variant/70"
          />
          {loading && (
            <span className="material-symbols-outlined animate-spin text-xl text-primary" aria-label="در حال جستجو">
              progress_activity
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="بستن جستجو"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="max-h-[min(60vh,480px)] overflow-y-auto p-3 text-right">
          {query.trim().length < 2 ? (
            <div className="px-4 py-10 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-primary/50">manage_search</span>
              <p className="text-sm font-bold text-on-surface">چه چیزی را جستجو می‌کنید؟</p>
              <p className="mt-1 text-xs text-on-surface-variant">حداقل دو حرف وارد کنید.</p>
            </div>
          ) : loading && !results.length ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
              <span className="text-xs font-bold">در حال جستجو...</span>
            </div>
          ) : error ? (
            <div className="px-4 py-10 text-center">
              <span className="material-symbols-outlined text-3xl text-rose-500">error</span>
              <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>
            </div>
          ) : results.length ? (
            <div className="space-y-1">
              {results.map((result) => {
                const item = result.item;
                const kindLabel =
                  result.kind === 'service' ? 'خدمت' : result.kind === 'article' ? 'مقاله' : 'صفحه';
                const icon = result.kind === 'service' ? 'medical_services' : result.kind === 'article' ? 'article' : 'web';
                const description = resultDescription(result);
                return (
                  <button
                    key={`${result.kind}-${item.id}`}
                    type="button"
                    onClick={() => selectResult(result)}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition-colors hover:bg-primary/7"
                  >
                    <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-lg text-primary">
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-0.5 flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-on-surface">{item.title}</span>
                        <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                          {kindLabel}
                        </span>
                      </span>
                      {description && (
                        <span className="block truncate text-xs text-on-surface-variant">{description}</span>
                      )}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:-translate-x-1 group-hover:text-primary">
                      arrow_back
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">search_off</span>
              <p className="mt-2 text-sm font-bold text-on-surface">نتیجه‌ای پیدا نشد</p>
              <p className="mt-1 text-xs text-on-surface-variant">عبارت دیگری را امتحان کنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
