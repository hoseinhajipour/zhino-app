import React, { useMemo, useState } from 'react';
import type {
  Article,
  ArticleCategory,
  ArticleStatus,
  Doctor,
  ServiceBlock,
  ServiceItem,
} from '../../types';
import { saveArticle } from '../../lib/dbService';
import {
  buildArticlePageBuilder,
  getArticleInitialBlocks,
  slugifyArticleTitle,
} from '../../lib/articleDefaults';
import { CoverImageUploader } from '../CoverImageUploader';
import { ARTICLE_WIDGET_TYPES, PageBuilderEditor } from './PageBuilderEditor';

interface ArticleEditorPageProps {
  article: Article;
  isNew?: boolean;
  doctors: Doctor[];
  categories: ArticleCategory[];
  allServices: ServiceItem[];
  articles: Article[];
  onClose: () => void;
  onSaved: (article: Article) => void;
}

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

export const ArticleEditorPage: React.FC<ArticleEditorPageProps> = ({
  article,
  isNew = false,
  doctors,
  categories,
  allServices,
  articles,
  onClose,
  onSaved,
}) => {
  const [draft, setDraft] = useState<Article>(article);
  const [slugManual, setSlugManual] = useState(Boolean(article.slug));
  const initialBlocks = useMemo(() => getArticleInitialBlocks(article), [article]);

  const activeCategories = categories.filter((c) => c.active !== false);
  const patch = (partial: Partial<Article>) => setDraft((prev) => ({ ...prev, ...partial }));

  const handleTitleChange = (title: string) => {
    if (!slugManual) {
      patch({ title, slug: slugifyArticleTitle(title) });
    } else {
      patch({ title });
    }
  };

  const handleAutoSlug = () => {
    const next = slugifyArticleTitle(draft.title);
    patch({ slug: next });
    setSlugManual(false);
  };

  const handleSave = async (blocks: ServiceBlock[]) => {
    const title = draft.title.trim();
    const slug = (draft.slug.trim() || slugifyArticleTitle(title)).replace(/^\/+|\/+$/g, '');
    if (!title) throw new Error('عنوان مقاله الزامی است');
    if (!slug) throw new Error('Slug الزامی است');
    if (!draft.categoryId && !draft.category) throw new Error('دسته‌بندی را انتخاب کنید');
    if (!draft.summary.trim()) throw new Error('چکیده مقاله الزامی است');

    const selectedCat =
      categories.find((c) => c.id === draft.categoryId) ||
      categories.find((c) => c.name === draft.category);
    const author =
      doctors.find((d) => d.id === draft.authorId) || doctors[0];

    const saved: Article = {
      ...draft,
      title,
      slug,
      category: selectedCat?.name || draft.category,
      categoryId: selectedCat?.id || draft.categoryId,
      authorId: author?.id || draft.authorId,
      authorName: author?.name || draft.authorName || 'نویسنده کلینیک',
      authorAvatar: author?.avatar || draft.authorAvatar,
      summary: draft.summary.trim(),
      coverImage: draft.coverImage,
      status: draft.status,
      tags: draft.tags,
      readTime: draft.readTime || '۵ دقیقه',
      pageBuilder: buildArticlePageBuilder(blocks),
      // Keep legacy content for older renders until fully migrated
      content: draft.content || '',
      publishedAt: isNew ? 'امروز' : draft.publishedAt,
      views: isNew ? 0 : draft.views,
    };

    await saveArticle(saved);
    onSaved(saved);
  };

  const metaPanel = (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200/50 p-3">
        <p className="text-[11px] font-black text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">article</span>
          تنظیمات اختصاصی مقاله
        </p>
        <p className="text-[10px] text-teal-700/80 dark:text-teal-300/80 mt-1 leading-relaxed">
          تصویر شاخص، دسته‌بندی، وضعیت، چکیده، برچسب و آدرس صفحه را اینجا تنظیم کنید. محتوای اصلی با
          صفحه‌ساز ساخته می‌شود.
        </p>
      </div>

      <CoverImageUploader value={draft.coverImage} onChange={(url) => patch({ coverImage: url })} />

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">عنوان مقاله *</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="عنوان جذاب مقاله..."
          className={`${fieldClass} font-extrabold text-sm`}
        />
      </label>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant">Slug *</span>
          <button
            type="button"
            onClick={handleAutoSlug}
            className="text-[10px] font-black text-teal-700 hover:text-teal-600 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">auto_fix</span>
            ایجاد خودکار از عنوان
          </button>
        </div>
        <div className="flex items-center gap-2" dir="ltr">
          <span className="text-[11px] font-bold text-on-surface-variant shrink-0">/blog/</span>
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => {
              setSlugManual(true);
              patch({
                slug: e.target.value
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\u0600-\u06FFa-z0-9-]/gi, ''),
              });
            }}
            placeholder="article-slug"
            className={`${fieldClass} font-mono text-left`}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant">
          لینک عمومی: /blog/{draft.slug || '...'}
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">دسته‌بندی مطلب *</span>
        <select
          value={draft.categoryId || ''}
          onChange={(e) => {
            const id = e.target.value;
            const cat = categories.find((c) => c.id === id);
            patch({ categoryId: id, category: cat?.name || draft.category });
          }}
          className={fieldClass}
        >
          {activeCategories.length === 0 && !draft.categoryId && (
            <option value="">ابتدا یک دسته‌بندی فعال تعریف کنید</option>
          )}
          {draft.categoryId &&
            !activeCategories.some((c) => c.id === draft.categoryId) &&
            (() => {
              const current = categories.find((c) => c.id === draft.categoryId);
              return current ? (
                <option value={current.id}>
                  {current.name} (غیرفعال)
                </option>
              ) : (
                <option value={draft.categoryId}>{draft.category || draft.categoryId}</option>
              );
            })()}
          {activeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">وضعیت انتشار</span>
        <select
          value={draft.status}
          onChange={(e) => patch({ status: e.target.value as ArticleStatus })}
          className={fieldClass}
        >
          <option value="published">منتشر شده</option>
          <option value="draft">پیش‌نویس</option>
          <option value="archived">بایگانی</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">چکیده *</span>
        <textarea
          rows={3}
          value={draft.summary}
          onChange={(e) => patch({ summary: e.target.value })}
          placeholder="خلاصه کوتاه برای کارت بلاگ و سئو..."
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">برچسب‌ها</span>
        <input
          type="text"
          value={draft.tags.join(', ')}
          onChange={(e) =>
            patch({
              tags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="اضطراب, خودشناسی, ..."
          className={fieldClass}
        />
        <p className="text-[10px] text-on-surface-variant">با کاما جدا کنید</p>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">نویسنده</span>
        <select
          value={draft.authorId}
          onChange={(e) => {
            const author = doctors.find((d) => d.id === e.target.value);
            patch({
              authorId: e.target.value,
              authorName: author?.name || draft.authorName,
              authorAvatar: author?.avatar || '',
            });
          }}
          className={fieldClass}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">زمان مطالعه</span>
        <input
          type="text"
          value={draft.readTime}
          onChange={(e) => patch({ readTime: e.target.value })}
          placeholder="۵ دقیقه"
          className={fieldClass}
        />
      </label>
    </div>
  );

  return (
    <PageBuilderEditor
      title={draft.title || (isNew ? 'مقاله جدید' : 'ویرایش مقاله')}
      eyebrow="ویرایشگر مقاله · صفحه‌ساز"
      initialBlocks={initialBlocks}
      widgetTypes={ARTICLE_WIDGET_TYPES}
      allServices={allServices}
      doctors={doctors}
      articles={articles}
      contextId={draft.id}
      onClose={onClose}
      onSave={handleSave}
      metaPanel={metaPanel}
      metaPanelLabel="تنظیمات مقاله"
      saveLabel="ذخیره مقاله"
      defaultRightTab="meta"
    />
  );
};
