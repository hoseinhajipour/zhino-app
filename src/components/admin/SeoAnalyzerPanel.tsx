import React, { useMemo } from 'react';
import type { ContentSeoSettings, ServiceBlock } from '../../types';
import { analyzeSeo, type SeoAnalyzeInput, type SeoCheckStatus } from '../../lib/seoAnalyzer';
import { SeoScoreGauge } from './SeoScoreBadge';

interface SeoAnalyzerPanelProps {
  seo?: ContentSeoSettings | null;
  onChange: (seo: ContentSeoSettings) => void;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  content?: string;
  blocks?: ServiceBlock[];
}

const STATUS_ICON: Record<SeoCheckStatus, { icon: string; cls: string }> = {
  ok: { icon: 'check_circle', cls: 'text-emerald-600' },
  warn: { icon: 'warning', cls: 'text-amber-600' },
  fail: { icon: 'cancel', cls: 'text-rose-600' },
};

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

export const SeoAnalyzerPanel: React.FC<SeoAnalyzerPanelProps> = ({
  seo,
  onChange,
  title,
  slug,
  excerpt,
  coverImage,
  tags,
  content,
  blocks,
}) => {
  const input: SeoAnalyzeInput = useMemo(
    () => ({
      title,
      slug,
      excerpt,
      coverImage,
      tags,
      content,
      blocks,
      seo: seo || undefined,
    }),
    [title, slug, excerpt, coverImage, tags, content, blocks, seo]
  );

  const result = useMemo(() => analyzeSeo(input), [input]);

  const patch = (partial: Partial<ContentSeoSettings>) => {
    onChange({
      focusKeyword: seo?.focusKeyword || '',
      seoTitle: seo?.seoTitle,
      seoDescription: seo?.seoDescription,
      score: result.score,
      ...partial,
    });
  };

  const effectiveTitle = (seo?.seoTitle || title || '').trim();
  const effectiveDesc = (seo?.seoDescription || excerpt || '').trim();

  return (
    <div className="space-y-4 text-right border-t border-outline-variant/30 pt-4 mt-2">
      <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800 p-3">
        <p className="text-[11px] font-black text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">troubleshoot</span>
          بهینه‌ساز سئو
        </p>
        <p className="text-[10px] text-violet-800/80 dark:text-violet-300/80 mt-1 leading-relaxed">
          کلمهٔ کلیدی کانونی را وارد کنید؛ امتیاز سه‌رقمی و چک‌لیست مانند Rank Math به‌صورت زنده
          به‌روز می‌شود.
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-slate-950 p-4">
        <SeoScoreGauge result={result} />
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">کلمهٔ کلیدی کانونی *</span>
        <input
          type="text"
          value={seo?.focusKeyword || ''}
          onChange={(e) => patch({ focusKeyword: e.target.value, score: result.score })}
          placeholder="مثال: اضطراب اجتماعی"
          className={`${fieldClass} font-bold`}
        />
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant">عنوان سئو</span>
          <span className="text-[10px] tabular-nums text-on-surface-variant">
            {(seo?.seoTitle || '').length || title.length}/70
          </span>
        </div>
        <input
          type="text"
          value={seo?.seoTitle || ''}
          onChange={(e) => patch({ seoTitle: e.target.value })}
          placeholder={title || 'پیش‌فرض: عنوان محتوا'}
          className={fieldClass}
        />
        <p className="text-[10px] text-on-surface-variant">خالی = همان عنوان صفحه/مقاله</p>
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant">توضیحات متا (سئو)</span>
          <span className="text-[10px] tabular-nums text-on-surface-variant">
            {(seo?.seoDescription || '').length || (excerpt || '').length}/160
          </span>
        </div>
        <textarea
          rows={3}
          value={seo?.seoDescription || ''}
          onChange={(e) => patch({ seoDescription: e.target.value })}
          placeholder={excerpt || 'پیش‌فرض: چکیده محتوا'}
          className={`${fieldClass} leading-relaxed`}
        />
      </label>

      {/* SERP preview */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3 space-y-1">
        <p className="text-[10px] font-bold text-on-surface-variant mb-1.5">پیش‌نمایش نتایج جستجو</p>
        <p className="text-sm text-blue-700 dark:text-blue-400 font-bold line-clamp-1 leading-snug">
          {effectiveTitle || 'عنوان صفحه'}
        </p>
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono truncate" dir="ltr">
          {typeof window !== 'undefined' ? window.location.origin : ''}
          {slug ? (slug.startsWith('/') ? slug : `/${slug}`) : '/…'}
        </p>
        <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
          {effectiveDesc || 'توضیحات متا اینجا نمایش داده می‌شود…'}
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-black text-on-surface">چک‌لیست بهینه‌سازی</p>
        <ul className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
          {result.checks.map((c) => {
            const st = STATUS_ICON[c.status];
            return (
              <li
                key={c.id}
                className="flex items-start gap-2 rounded-xl px-2.5 py-2 bg-surface-container-low/80 border border-outline-variant/20"
              >
                <span className={`material-symbols-outlined text-base shrink-0 ${st.cls}`}>
                  {st.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-on-surface leading-snug">{c.label}</p>
                    <span className="text-[10px] tabular-nums text-on-surface-variant shrink-0">
                      {c.score}/{c.max}
                    </span>
                  </div>
                  {c.hint && (
                    <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">{c.hint}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
