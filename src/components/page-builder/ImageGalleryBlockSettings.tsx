import React from 'react';
import { MediaField } from '../media/MediaField';
import { IMAGE_ASPECT_OPTIONS } from '../../lib/imageMediaBlock';

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
  subtitle?: string;
  linkUrl?: string;
};

function updateItem(items: GalleryItem[], index: number, patch: Partial<GalleryItem>): GalleryItem[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function ImageGalleryBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const items = (Array.isArray(props.items) ? props.items : []) as GalleryItem[];
  const clickBehavior = String(props.clickBehavior || 'lightbox');

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
          <span className="material-symbols-outlined text-primary text-base">grid_view</span>
          چیدمان گالری
        </p>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: 'columnsMobile', label: 'موبایل', def: 1 },
              { key: 'columnsTablet', label: 'تبلت', def: 2 },
              { key: 'columnsDesktop', label: 'دسکتاپ', def: 3 },
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
          <span className="text-[11px] font-bold text-on-surface-variant">نسبت تصویر</span>
          <select
            value={String(props.aspect || 'square')}
            onChange={(e) => set('aspect', e.target.value)}
            className={fieldClass}
          >
            {IMAGE_ASPECT_OPTIONS.filter((o) => o.value !== 'auto').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <option value="auto">خودکار</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">نحوه برش</span>
          <select
            value={String(props.objectFit || 'cover')}
            onChange={(e) => set('objectFit', e.target.value)}
            className={fieldClass}
          >
            <option value="cover">پوشش کامل</option>
            <option value="contain">کامل داخل قاب</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            گردی گوشه ({Number(props.borderRadius) ?? 16}px)
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={Number(props.borderRadius) ?? 16}
            onChange={(e) => set('borderRadius', Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">جایگاه کپشن</span>
          <select
            value={String(props.captionPosition || 'below')}
            onChange={(e) => set('captionPosition', e.target.value)}
            className={fieldClass}
          >
            <option value="below">زیر تصویر</option>
            <option value="overlay">روی تصویر</option>
            <option value="none">مخفی</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">با کلیک روی تصویر</span>
          <select
            value={clickBehavior}
            onChange={(e) => set('clickBehavior', e.target.value)}
            className={fieldClass}
          >
            <option value="lightbox">بزرگ‌نمایی گالری</option>
            <option value="link">لینک اختصاصی هر تصویر</option>
            <option value="none">بدون عمل</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black text-on-surface">تصاویر گالری</p>
          <button
            type="button"
            onClick={() =>
              set('items', [
                ...items,
                {
                  image: '',
                  alt: '',
                  caption: '',
                  subtitle: '',
                  linkUrl: '',
                },
              ])
            }
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            افزودن تصویر
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-[11px] text-on-surface-variant text-center py-4 border border-dashed border-outline-variant/40 rounded-xl">
            هنوز تصویری اضافه نشده است.
          </p>
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
              label="کپشن"
              value={item.caption || ''}
              onChange={(v) => set('items', updateItem(items, idx, { caption: v }))}
            />
            <TextInput
              label="زیرنویس"
              value={item.subtitle || ''}
              onChange={(v) => set('items', updateItem(items, idx, { subtitle: v }))}
            />
            {clickBehavior === 'link' && (
              <TextInput
                label="لینک این تصویر"
                value={item.linkUrl || ''}
                onChange={(v) => set('items', updateItem(items, idx, { linkUrl: v }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
