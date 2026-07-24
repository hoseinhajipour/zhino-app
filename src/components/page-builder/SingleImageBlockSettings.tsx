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

export function SingleImageBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const widthMode = String(props.widthMode || 'full');
  const clickBehavior = String(props.clickBehavior || 'lightbox');

  return (
    <div className="space-y-4">
      <MediaField
        label="تصویر"
        value={String(props.image || '')}
        onChange={(v) => set('image', v)}
        accept="image"
        aspect="video"
      />

      <TextInput label="متن جایگزین (Alt)" value={String(props.alt || '')} onChange={(v) => set('alt', v)} />
      <TextInput label="کپشن" value={String(props.caption || '')} onChange={(v) => set('caption', v)} />
      <TextInput
        label="زیرنویس"
        value={String(props.subtitle || '')}
        onChange={(v) => set('subtitle', v)}
        multiline
      />

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">aspect_ratio</span>
          ابعاد و قاب
        </p>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">عرض</span>
          <select
            value={widthMode}
            onChange={(e) => set('widthMode', e.target.value)}
            className={fieldClass}
          >
            <option value="full">تمام‌عرض</option>
            <option value="percent">درصدی</option>
            <option value="px">پیکسل ثابت</option>
          </select>
        </label>

        {widthMode === 'percent' && (
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">
              درصد ({Number(props.widthPercent) || 100}٪)
            </span>
            <input
              type="range"
              min={20}
              max={100}
              value={Number(props.widthPercent) || 100}
              onChange={(e) => set('widthPercent', Number(e.target.value))}
              className="w-full"
            />
          </label>
        )}

        {widthMode === 'px' && (
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">عرض (پیکسل)</span>
            <input
              type="number"
              min={120}
              max={2000}
              step={10}
              value={Number(props.widthPx) || 640}
              onChange={(e) => set('widthPx', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">نسبت تصویر</span>
          <select
            value={String(props.aspect || 'auto')}
            onChange={(e) => set('aspect', e.target.value)}
            className={fieldClass}
          >
            {IMAGE_ASPECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">نحوه برش</span>
          <select
            value={String(props.objectFit || 'cover')}
            onChange={(e) => set('objectFit', e.target.value)}
            className={fieldClass}
          >
            <option value="cover">پوشش کامل (Cover)</option>
            <option value="contain">کامل داخل قاب (Contain)</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            گردی گوشه ({Number(props.borderRadius) || 16}px)
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
          <span className="text-[11px] font-bold text-on-surface-variant">تراز</span>
          <select
            value={String(props.align || 'center')}
            onChange={(e) => set('align', e.target.value)}
            className={fieldClass}
          >
            <option value="start">راست</option>
            <option value="center">وسط</option>
            <option value="end">چپ</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={props.shadow !== false}
            onChange={(e) => set('shadow', e.target.checked)}
          />
          سایه نرم
        </label>
      </div>

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface">کپشن و تعامل</p>
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
          <span className="text-[11px] font-bold text-on-surface-variant">با کلیک</span>
          <select
            value={clickBehavior}
            onChange={(e) => set('clickBehavior', e.target.value)}
            className={fieldClass}
          >
            <option value="lightbox">بزرگ‌نمایی (لایت‌باکس)</option>
            <option value="link">باز کردن لینک</option>
            <option value="none">بدون عمل</option>
          </select>
        </label>

        {clickBehavior === 'link' && (
          <>
            <TextInput
              label="آدرس لینک"
              value={String(props.linkUrl || '')}
              onChange={(v) => set('linkUrl', v)}
            />
            <label className="flex items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={props.openInNewTab !== false}
                onChange={(e) => set('openInNewTab', e.target.checked)}
              />
              باز شدن در تب جدید
            </label>
          </>
        )}
      </div>
    </div>
  );
}
