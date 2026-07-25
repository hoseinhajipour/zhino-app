import React, { useMemo, useState } from 'react';
import type {
  ClinicContactInfo,
  Doctor,
  FAQItem,
  ServiceBlock,
  ServiceItem,
  ServicePageBuilder as ServicePageDoc,
} from '../../types';
import { getPageBuilderForService } from '../../lib/landingToBlocks';
import { saveService } from '../../lib/dbService';
import { slugifyPageTitle } from '../../lib/sitePageDefaults';
import { MediaField } from '../media/MediaField';
import { PageBuilderEditor, SERVICE_WIDGET_TYPES } from './PageBuilderEditor';

interface ServicePageBuilderProps {
  service: ServiceItem;
  allServices: ServiceItem[];
  doctors: Doctor[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  onClose: () => void;
  onSaved: (updated: ServiceItem) => void;
}

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

const ICON_PRESETS = [
  'psychology',
  'family_restroom',
  'child_care',
  'groups',
  'quiz',
  'medical_services',
  'spa',
  'self_improvement',
];

export const ServicePageBuilder: React.FC<ServicePageBuilderProps> = ({
  service,
  allServices,
  doctors,
  faqs,
  contact,
  onClose,
  onSaved,
}) => {
  const initial = useMemo(() => getPageBuilderForService(service), [service]);
  const [draft, setDraft] = useState<ServiceItem>(service);
  const [slugManual, setSlugManual] = useState(Boolean(service.slug));

  const patch = (partial: Partial<ServiceItem>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const handleTitleChange = (title: string) => {
    if (!slugManual) {
      patch({ title, slug: slugifyPageTitle(title) });
    } else {
      patch({ title });
    }
  };

  const handleAutoSlug = () => {
    patch({ slug: slugifyPageTitle(draft.title) });
    setSlugManual(false);
  };

  const handleSave = async (blocks: ServiceBlock[]) => {
    const title = draft.title.trim();
    if (!title) throw new Error('عنوان خدمت الزامی است');
    const pageBuilder: ServicePageDoc = { version: 1, blocks };
    const slug = (draft.slug?.trim() || slugifyPageTitle(title)).replace(/^\/+|\/+$/g, '');
    const updated: ServiceItem = {
      ...draft,
      title,
      slug,
      pageBuilder,
    };
    await saveService(updated);
    onSaved(updated);
  };

  const metaPanel = (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200/50 p-3">
        <p className="text-[11px] font-black text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">tune</span>
          تنظیمات خدمت
        </p>
        <p className="text-[10px] text-teal-700/80 dark:text-teal-300/80 mt-1 leading-relaxed">
          عنوان، نامک، چکیده، آیکون، تصویر شاخص، قیمت و مدت زمان جلسه را اینجا تنظیم کنید. محتوای
          اصلی صفحه با ویجت‌های صفحه‌ساز ساخته می‌شود.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">عنوان خدمت *</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="عنوان خدمت..."
          className={`${fieldClass} font-extrabold text-sm`}
        />
      </label>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant">نامک (Slug)</span>
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
          <span className="text-[11px] font-bold text-on-surface-variant shrink-0">/service/</span>
          <input
            type="text"
            value={draft.slug || ''}
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
            placeholder="service-slug"
            className={`${fieldClass} font-mono text-left`}
          />
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">چکیده</span>
        <textarea
          rows={3}
          value={draft.excerpt || ''}
          onChange={(e) => patch({ excerpt: e.target.value })}
          placeholder="خلاصه کوتاه برای کارت خدمت و سئو..."
          className={fieldClass}
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-on-surface-variant">آیکون (Material Symbol)</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft.icon || ''}
            onChange={(e) => patch({ icon: e.target.value })}
            placeholder="psychology"
            className={`${fieldClass} font-mono text-left`}
            dir="ltr"
          />
          <div className="w-9 h-9 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">{draft.icon || 'psychology'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ICON_PRESETS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => patch({ icon: ic })}
              className={`p-1.5 rounded-lg border flex items-center justify-center ${
                draft.icon === ic
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/40'
              }`}
              title={ic}
            >
              <span className="material-symbols-outlined text-sm">{ic}</span>
            </button>
          ))}
        </div>
      </div>

      <MediaField
        label="تصویر شاخص"
        value={draft.image || ''}
        onChange={(url) => patch({ image: url })}
        accept="image"
        aspect="video"
        helperText="از کتابخانه رسانه انتخاب کنید یا فایل جدید آپلود کنید"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">قیمت</span>
          <input
            type="text"
            value={draft.fee || ''}
            onChange={(e) => patch({ fee: e.target.value })}
            placeholder="۸۵۰,۰۰۰ تومان"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">مدت زمان هر جلسه</span>
          <input
            type="text"
            value={draft.duration || ''}
            onChange={(e) => patch({ duration: e.target.value })}
            placeholder="۴۵ دقیقه"
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );

  return (
    <PageBuilderEditor
      title={draft.title}
      eyebrow="صفحه‌ساز خدمت"
      initialBlocks={initial.blocks}
      widgetTypes={SERVICE_WIDGET_TYPES}
      allServices={allServices}
      doctors={doctors}
      faqs={faqs}
      contact={contact}
      contextId={service.id}
      onClose={onClose}
      onSave={handleSave}
      metaPanel={metaPanel}
      metaPanelLabel="تنظیمات خدمت"
      saveLabel="ذخیره صفحه"
      defaultRightTab="meta"
      previewHref={`/service/${encodeURIComponent(service.id)}`}
    />
  );
};
