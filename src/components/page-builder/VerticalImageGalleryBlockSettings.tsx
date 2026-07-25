import React, { useState } from 'react';
import { MediaField } from '../media/MediaField';
import { MediaPicker } from '../media/MediaPicker';

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

function TextInput({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-on-surface-variant">{label}</span>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )}
    </label>
  );
}

type GalleryItem = {
  image?: string;
  alt?: string;
  caption?: string;
};

function updateItem(items: GalleryItem[], index: number, patch: Partial<GalleryItem>): GalleryItem[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function VerticalImageGalleryBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const items = (Array.isArray(props.items) ? props.items : []) as GalleryItem[];
  const clickBehavior = String(props.clickBehavior || 'lightbox');
  const columnAnimate = props.columnAnimate !== false;
  const [batchOpen, setBatchOpen] = useState(false);

  const appendUrls = (urls: string[]) => {
    const next = [
      ...items,
      ...urls.map((image) => ({ image, alt: '', caption: '' })),
    ];
    set('items', next);
  };

  return (
    <div className="space-y-4">
      <TextInput label="عنوان بخش (اختیاری)" value={String(props.title || '')} onChange={(v) => set('title', v)} />
      <TextInput
        label="توضیح بخش (اختیاری)"
        value={String(props.subtitle || '')}
        onChange={(v) => set('subtitle', v)}
        multiline
      />

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">view_column</span>
          چیدمان ستون‌ها
        </p>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: 'columnsMobile', label: 'موبایل', def: 1 },
              { key: 'columnsTablet', label: 'تبلت', def: 2 },
              { key: 'columnsDesktop', label: 'دسکتاپ', def: 2 },
            ] as const
          ).map((col) => (
            <label key={col.key} className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">{col.label}</span>
              <select
                value={Number(props[col.key] ?? col.def)}
                onChange={(e) => set(col.key, Number(e.target.value))}
                className={fieldClass}
              >
                <option value={1}>۱</option>
                <option value={2}>۲</option>
                <option value={3}>۳</option>
                <option value={4}>۴</option>
              </select>
            </label>
          ))}
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">فاصله بین تصاویر</span>
          <select
            value={String(props.gap || 'md')}
            onChange={(e) => set('gap', e.target.value)}
            className={fieldClass}
          >
            <option value="sm">کم</option>
            <option value="md">متوسط</option>
            <option value="lg">زیاد</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            گردی گوشه ({Number(props.borderRadius) ?? 20}px)
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={Number(props.borderRadius) ?? 20}
            onChange={(e) => set('borderRadius', Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={props.shadow !== false}
            onChange={(e) => set('shadow', e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="text-xs font-bold text-on-surface">سایه نرم روی تصاویر</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={columnAnimate}
            onChange={(e) => set('columnAnimate', e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="text-xs font-bold text-on-surface">انیمیت ستون‌ها (لوپ عمودی مخالف)</span>
        </label>

        {columnAnimate && (
          <>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              تصاویر هر ستون به‌صورت لوپ بی‌نهایت بالا یا پایین می‌روند؛ ستون‌های کناری جهت مخالف دارند.
            </p>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                سرعت لوپ ({Number(props.animateSpeed) || 28} ثانیه در هر دور)
              </span>
              <input
                type="range"
                min={8}
                max={60}
                step={1}
                value={Number(props.animateSpeed) || 28}
                onChange={(e) => set('animateSpeed', Number(e.target.value))}
                className="w-full"
              />
              <span className="text-[9px] text-on-surface-variant">عدد بزرگ‌تر = حرکت آرام‌تر</span>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                ارتفاع قاب ({Number(props.maxHeight) || 560}px)
              </span>
              <input
                type="range"
                min={280}
                max={900}
                step={20}
                value={Number(props.maxHeight) || 560}
                onChange={(e) => set('maxHeight', Number(e.target.value))}
                className="w-full"
              />
            </label>
          </>
        )}

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">با کلیک روی تصویر</span>
          <select
            value={clickBehavior}
            onChange={(e) => set('clickBehavior', e.target.value)}
            className={fieldClass}
          >
            <option value="lightbox">بزرگ‌نمایی</option>
            <option value="none">بدون عمل</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-black text-on-surface">تصاویر گالری</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBatchOpen(true)}
              className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">library_add</span>
              انتخاب گروهی
            </button>
            <button
              type="button"
              onClick={() => set('items', [...items, { image: '', alt: '', caption: '' }])}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              افزودن
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <button
            type="button"
            onClick={() => setBatchOpen(true)}
            className="w-full py-8 border-2 border-dashed border-teal-400/40 hover:border-teal-600 rounded-2xl bg-teal-50/30 text-teal-700 flex flex-col items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">photo_library</span>
            <span className="text-xs font-black">انتخاب گروهی تصاویر</span>
            <span className="text-[10px] text-on-surface-variant">چند تصویر را یک‌جا از کتابخانه انتخاب کنید</span>
          </button>
        )}

        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/40"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold">تصویر {idx + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={idx === 0}
                  className="text-[10px] font-bold text-on-surface-variant disabled:opacity-30"
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...items];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    set('items', next);
                  }}
                >
                  بالا
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  className="text-[10px] font-bold text-on-surface-variant disabled:opacity-30"
                  onClick={() => {
                    if (idx >= items.length - 1) return;
                    const next = [...items];
                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                    set('items', next);
                  }}
                >
                  پایین
                </button>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('items', items.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
            </div>

            <MediaField
              label="فایل تصویر"
              value={item.image || ''}
              onChange={(v) => set('items', updateItem(items, idx, { image: v }))}
              accept="image"
              aspect="square"
            />
            <TextInput
              label="Alt"
              value={item.alt || ''}
              onChange={(v) => set('items', updateItem(items, idx, { alt: v }))}
            />
            <TextInput
              label="کپشن (اختیاری)"
              value={item.caption || ''}
              onChange={(v) => set('items', updateItem(items, idx, { caption: v }))}
            />
          </div>
        ))}
      </div>

      <MediaPicker
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        multiple
        onSelectMany={appendUrls}
        accept="image"
        title="انتخاب گروهی تصاویر"
      />
    </div>
  );
}
