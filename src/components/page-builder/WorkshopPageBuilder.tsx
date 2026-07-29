import React, { useEffect, useMemo, useState } from 'react';
import type {
  Article,
  ClinicContactInfo,
  Doctor,
  FAQItem,
  ServiceBlock,
  ServiceItem,
  Workshop,
} from '../../types';
import { saveWorkshop, subscribeWorkshops } from '../../lib/dbService';
import {
  createDefaultWorkshopBlocks,
  getWorkshopPath,
  slugifyWorkshopTitle,
} from '../../lib/workshopDefaults';
import { MediaField } from '../media/MediaField';
import { PageBuilderEditor, SITE_WIDGET_TYPES } from './PageBuilderEditor';

interface WorkshopPageBuilderProps {
  workshop: Workshop;
  allServices: ServiceItem[];
  doctors: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  existingWorkshops?: Workshop[];
  onClose: () => void;
  onSaved: (updated: Workshop) => void;
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

export const WorkshopPageBuilder: React.FC<WorkshopPageBuilderProps> = ({
  workshop,
  allServices,
  doctors,
  articles,
  faqs,
  contact,
  existingWorkshops = [],
  onClose,
  onSaved,
}) => {
  const [draft, setDraft] = useState<Workshop>(() => ({
    ...workshop,
    slug: workshop.slug || slugifyWorkshopTitle(workshop.title || workshop.id),
    posterUrl: workshop.posterUrl || '',
    description: workshop.description || '',
    active: workshop.active !== false,
  }));
  const [slugManual, setSlugManual] = useState(Boolean(workshop.slug));
  const [workshopsList, setWorkshopsList] = useState<Workshop[]>(existingWorkshops);
  const initialBlocks = useMemo(() => {
    if (workshop.pageBuilder?.blocks?.length) return workshop.pageBuilder.blocks;
    return createDefaultWorkshopBlocks(workshop);
  }, [workshop]);
  const [liveBlocks, setLiveBlocks] = useState<ServiceBlock[]>(initialBlocks);

  useEffect(() => subscribeWorkshops(setWorkshopsList), []);

  const patch = (partial: Partial<Workshop>) => setDraft((prev) => ({ ...prev, ...partial }));

  const handleTitleChange = (title: string) => {
    if (!slugManual) {
      patch({ title, slug: slugifyWorkshopTitle(title) });
    } else {
      patch({ title });
    }
  };

  const validateSlug = (slug: string): string | null => {
    const clean = cleanSlugInput(slug);
    if (!clean) return 'نامک (slug) کارگاه الزامی است.';
    const clash = workshopsList.find(
      (w) =>
        w.id !== draft.id &&
        ((w.slug || '').toLowerCase() === clean || w.id.toLowerCase() === clean)
    );
    if (clash) return 'کارگاه دیگری با این نامک وجود دارد.';
    return null;
  };

  const handleSave = async (blocks: ServiceBlock[]) => {
    const title = draft.title.trim();
    if (!title) throw new Error('عنوان کارگاه الزامی است');

    const slug = cleanSlugInput(draft.slug || '') || slugifyWorkshopTitle(title);
    const err = validateSlug(slug);
    if (err) throw new Error(err);

    const posterUrl = (draft.posterUrl || '').trim();
    const updated: Workshop = {
      ...draft,
      title,
      slug,
      description: (draft.description || '').trim(),
      posterUrl,
      active: draft.active !== false,
      sortOrder: Number(draft.sortOrder) || 0,
      pageBuilder: { version: 1, blocks },
    };
    delete (updated as { registrationPhone?: string }).registrationPhone;
    delete (updated as { registrationPhoneClean?: string }).registrationPhoneClean;

    await saveWorkshop(updated);
    onSaved(updated);
  };

  const previewPath = getWorkshopPath({ id: draft.id, slug: draft.slug });

  const metaPanel = (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3">
        <p className="text-[11px] font-black text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">event</span>
          تنظیمات کارگاه
        </p>
        <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
          عنوان، نامک، تصویر شاخص و وضعیت را اینجا تنظیم کنید. معرفی و جزئیات را با ویجت‌های
          صفحه‌ساز بسازید.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">عنوان کارگاه *</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="عنوان کارگاه..."
          className={`${fieldClass} font-extrabold text-sm`}
        />
      </label>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant">Slug *</span>
          <button
            type="button"
            onClick={() => {
              patch({ slug: slugifyWorkshopTitle(draft.title) });
              setSlugManual(false);
            }}
            className="text-[10px] font-black text-primary hover:opacity-80 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">auto_fix</span>
            ایجاد خودکار از عنوان
          </button>
        </div>
        <div className="flex items-center gap-2" dir="ltr">
          <span className="text-[11px] font-bold text-on-surface-variant shrink-0">/workshops/</span>
          <input
            type="text"
            value={draft.slug || ''}
            onChange={(e) => {
              setSlugManual(true);
              patch({ slug: cleanSlugInput(e.target.value) });
            }}
            placeholder="workshop-slug"
            className={`${fieldClass} font-mono text-left`}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant" dir="ltr">
          لینک عمومی: {previewPath}
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">خلاصه کوتاه (فهرست)</span>
        <textarea
          rows={3}
          value={draft.description || ''}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="خلاصه برای کارت فهرست کارگاه‌ها..."
          className={`${fieldClass} leading-relaxed`}
        />
      </label>

      <MediaField
        label="تصویر شاخص / پوستر"
        value={draft.posterUrl || ''}
        onChange={(url) => patch({ posterUrl: url })}
        accept="image"
        aspect="portrait"
        helperText="از کتابخانه انتخاب کنید یا مسیر /uploads/... را وارد کنید"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">ترتیب نمایش</span>
          <input
            type="number"
            value={draft.sortOrder ?? 1}
            onChange={(e) => patch({ sortOrder: Number(e.target.value) || 0 })}
            className={fieldClass}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer pt-6">
          <input
            type="checkbox"
            checked={draft.active !== false}
            onChange={(e) => patch({ active: e.target.checked })}
            className="w-4 h-4 accent-primary rounded"
          />
          فعال در سایت
        </label>
      </div>
    </div>
  );

  return (
    <PageBuilderEditor
      title={draft.title || 'ویرایش کارگاه'}
      eyebrow="صفحه‌ساز کارگاه"
      initialBlocks={initialBlocks}
      widgetTypes={SITE_WIDGET_TYPES}
      allServices={allServices}
      doctors={doctors}
      articles={articles}
      faqs={faqs}
      contact={contact}
      contextId={workshop.id}
      onClose={onClose}
      onSave={handleSave}
      onBlocksChange={setLiveBlocks}
      metaPanel={metaPanel}
      metaPanelLabel="تنظیمات کارگاه"
      saveLabel="ذخیره کارگاه"
      defaultRightTab="meta"
      previewHref={previewPath}
    />
  );
};
