import React, { useMemo, useState } from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, ServiceBlock, SitePage } from '../../types';
import { saveSitePage } from '../../lib/dbService';
import {
  getDefaultBlocksForPage,
  getSitePagePath,
  isSystemSitePage,
  RESERVED_PAGE_SLUGS,
  slugifyPageTitle,
} from '../../lib/sitePageDefaults';
import { analyzePageSeo, buildSeoPayload } from '../../lib/seoAnalyzer';
import { MediaField } from '../media/MediaField';
import { SeoAnalyzerPanel } from '../admin/SeoAnalyzerPanel';
import { PageBuilderEditor, SITE_WIDGET_TYPES } from './PageBuilderEditor';

interface SitePageBuilderProps {
  page: SitePage;
  allServices: import('../../types').ServiceItem[];
  doctors: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  /** Other pages — used to validate unique slug */
  existingPages?: SitePage[];
  seoOptimizerEnabled?: boolean;
  onClose: () => void;
  onSaved: (updated: SitePage) => void;
}

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

function cleanSlugInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const SitePageBuilder: React.FC<SitePageBuilderProps> = ({
  page,
  allServices,
  doctors,
  articles,
  faqs,
  contact,
  existingPages = [],
  seoOptimizerEnabled = false,
  onClose,
  onSaved,
}) => {
  const system = isSystemSitePage(page);
  const [draft, setDraft] = useState<SitePage>(() => ({
    ...page,
    status: page.status === 'draft' ? 'draft' : 'published',
    coverImage: page.coverImage || '',
    excerpt: page.excerpt || '',
  }));
  const [slugManual, setSlugManual] = useState(Boolean(page.slug && page.slug !== '/'));
  const initialBlocks = useMemo(() => getDefaultBlocksForPage(page), [page]);
  const [liveBlocks, setLiveBlocks] = useState<ServiceBlock[]>(initialBlocks);

  const patch = (partial: Partial<SitePage>) => setDraft((prev) => ({ ...prev, ...partial }));

  const publicSlug = system
    ? draft.slug
    : draft.slug.replace(/^\/+/, '').replace(/^p\//, '');

  const handleTitleChange = (title: string) => {
    if (!system && !slugManual) {
      patch({ title, slug: slugifyPageTitle(title) });
    } else {
      patch({ title });
    }
  };

  const handleAutoSlug = () => {
    if (system) return;
    patch({ slug: slugifyPageTitle(draft.title) });
    setSlugManual(false);
  };

  const validateSlug = (slug: string): string | null => {
    if (system) return null;
    const clean = slug.replace(/^\/+/, '').replace(/^p\//, '').trim().toLowerCase();
    if (!clean) return 'نامک (slug) صفحه الزامی است.';
    if (RESERVED_PAGE_SLUGS.has(clean)) return 'این نامک رزرو شده و قابل استفاده نیست.';
    const clash = existingPages.find(
      (p) =>
        p.id !== draft.id &&
        (p.slug.replace(/^\/+/, '').replace(/^p\//, '').toLowerCase() === clean ||
          p.id.toLowerCase() === clean)
    );
    if (clash) return 'صفحه دیگری با این نامک وجود دارد.';
    return null;
  };

  const handleSave = async (blocks: ServiceBlock[]) => {
    const title = draft.title.trim();
    if (!title) throw new Error('عنوان صفحه الزامی است');

    let slug = draft.slug;
    if (!system) {
      slug = cleanSlugInput(draft.slug.replace(/^\/+/, '').replace(/^p\//, '')) || slugifyPageTitle(title);
      const err = validateSlug(slug);
      if (err) throw new Error(err);
    }

    const updated: SitePage = {
      ...draft,
      title,
      slug,
      coverImage: (draft.coverImage || '').trim(),
      excerpt: (draft.excerpt || '').trim(),
      layoutWidth: draft.layoutWidth === 'full' ? 'full' : 'contained',
      status: system ? 'published' : draft.status === 'draft' ? 'draft' : 'published',
      pageBuilder: { version: 1, blocks },
      updatedAt: new Date().toISOString(),
    };

    if (seoOptimizerEnabled) {
      const analysis = analyzePageSeo(updated, blocks);
      updated.seo = buildSeoPayload(draft.seo, analysis);
    }

    await saveSitePage(updated);
    onSaved(updated);
  };

  const previewPath = getSitePagePath({ id: draft.id, slug: system ? draft.slug : publicSlug });

  const metaPanel = (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3">
        <p className="text-[11px] font-black text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">tune</span>
          تنظیمات صفحه
        </p>
        <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
          عنوان، آدرس، عرض قالب، تصویر شاخص، چکیده و وضعیت انتشار را اینجا مدیریت کنید. چیدمان محتوا با
          ویجت‌ها ساخته می‌شود.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-on-surface-variant block">عرض قالب صفحه</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                value: 'contained' as const,
                label: 'کانتینری',
                hint: 'حداکثر ۱۴۰۰px · وسط‌چین',
                icon: 'width_normal',
              },
              {
                value: 'full' as const,
                label: 'تمام‌عرض',
                hint: 'لبه‌به‌لبه صفحه',
                icon: 'width_full',
              },
            ] as const
          ).map((opt) => {
            const active = (draft.layoutWidth || 'contained') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => patch({ layoutWidth: opt.value })}
                className={`text-right rounded-xl border p-3 transition-all ${
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-outline-variant/40 hover:border-primary/30'
                }`}
              >
                <span className="material-symbols-outlined text-lg text-primary">{opt.icon}</span>
                <p className="text-[11px] font-black text-on-surface mt-1">{opt.label}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <MediaField
        label="تصویر شاخص"
        value={draft.coverImage || ''}
        onChange={(url) => patch({ coverImage: url })}
        accept="image"
        aspect="video"
      />

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">عنوان صفحه *</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="عنوان صفحه..."
          className={`${fieldClass} font-extrabold text-sm`}
        />
      </label>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant">Slug *</span>
          {!system && (
            <button
              type="button"
              onClick={handleAutoSlug}
              className="text-[10px] font-black text-primary hover:opacity-80 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">auto_fix</span>
              ایجاد خودکار از عنوان
            </button>
          )}
        </div>
        {system ? (
          <p className="p-2.5 rounded-xl bg-surface-container-low text-sm font-mono border border-outline-variant/20" dir="ltr">
            {draft.slug}
          </p>
        ) : (
          <div className="flex items-center gap-2" dir="ltr">
            <span className="text-[11px] font-bold text-on-surface-variant shrink-0">/p/</span>
            <input
              type="text"
              value={publicSlug}
              onChange={(e) => {
                setSlugManual(true);
                patch({ slug: cleanSlugInput(e.target.value) });
              }}
              placeholder="page-slug"
              className={`${fieldClass} font-mono text-left`}
            />
          </div>
        )}
        <p className="text-[10px] text-on-surface-variant" dir="ltr">
          لینک عمومی: {previewPath}
        </p>
        {system && (
          <p className="text-[10px] text-amber-700 dark:text-amber-300">
            نامک صفحات سیستمی ثابت است و قابل تغییر نیست.
          </p>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">چکیده</span>
        <textarea
          rows={4}
          value={draft.excerpt || ''}
          onChange={(e) => patch({ excerpt: e.target.value })}
          placeholder="خلاصه کوتاه صفحه برای فهرست‌ها و سئو..."
          className={`${fieldClass} leading-relaxed`}
        />
      </label>

      {system ? (
        <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 px-3 py-2.5 text-[11px] text-on-surface-variant">
          وضعیت: <strong className="text-on-surface">منتشر شده</strong> (صفحه سیستمی)
        </div>
      ) : (
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">وضعیت انتشار</span>
          <select
            value={draft.status === 'draft' ? 'draft' : 'published'}
            onChange={(e) => patch({ status: e.target.value as 'published' | 'draft' })}
            className={`${fieldClass} font-bold`}
          >
            <option value="published">منتشر شده</option>
            <option value="draft">پیش‌نویس</option>
          </select>
        </label>
      )}

      {seoOptimizerEnabled && (
        <SeoAnalyzerPanel
          seo={draft.seo}
          onChange={(seo) => patch({ seo })}
          title={draft.title}
          slug={system ? draft.slug : publicSlug}
          excerpt={draft.excerpt}
          coverImage={draft.coverImage}
          blocks={liveBlocks}
        />
      )}
    </div>
  );

  return (
    <PageBuilderEditor
      title={draft.title || 'ویرایش صفحه'}
      eyebrow="صفحه‌ساز سایت"
      initialBlocks={initialBlocks}
      widgetTypes={SITE_WIDGET_TYPES}
      allServices={allServices}
      doctors={doctors}
      articles={articles}
      faqs={faqs}
      contact={contact}
      contextId={page.id}
      onClose={onClose}
      onSave={handleSave}
      onBlocksChange={setLiveBlocks}
      metaPanel={metaPanel}
      metaPanelLabel="تنظیمات صفحه"
      saveLabel="ذخیره صفحه"
      defaultRightTab="meta"
      previewHref={previewPath}
    />
  );
};
