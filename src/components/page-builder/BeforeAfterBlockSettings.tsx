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

export function BeforeAfterBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const widthMode = String(props.widthMode || 'full');
  const initialPosition = Math.min(90, Math.max(10, Number(props.initialPosition) || 50));

  return (
    <div className="space-y-4">
      <TextInput label="عنوان بخش" value={String(props.title || '')} onChange={(v) => set('title', v)} />
      <TextInput
        label="زیرعنوان"
        value={String(props.subtitle || '')}
        onChange={(v) => set('subtitle', v)}
        multiline
      />

      <div className="space-y-3 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">compare</span>
          تصاویر مقایسه
        </p>
        <MediaField
          label="تصویر قبل"
          value={String(props.beforeImage || '')}
          onChange={(v) => set('beforeImage', v)}
          accept="image"
          aspect="video"
        />
        <TextInput
          label="برچسب قبل"
          value={String(props.beforeLabel ?? 'قبل')}
          onChange={(v) => set('beforeLabel', v)}
        />
        <TextInput
          label="Alt تصویر قبل"
          value={String(props.beforeAlt || '')}
          onChange={(v) => set('beforeAlt', v)}
        />

        <MediaField
          label="تصویر بعد"
          value={String(props.afterImage || '')}
          onChange={(v) => set('afterImage', v)}
          accept="image"
          aspect="video"
        />
        <TextInput
          label="برچسب بعد"
          value={String(props.afterLabel ?? 'بعد')}
          onChange={(v) => set('afterLabel', v)}
        />
        <TextInput
          label="Alt تصویر بعد"
          value={String(props.afterAlt || '')}
          onChange={(v) => set('afterAlt', v)}
        />
      </div>

      <TextInput
        label="کپشن"
        value={String(props.caption || '')}
        onChange={(v) => set('caption', v)}
        multiline
      />

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          رفتار اسلایدر
        </p>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">جهت مقایسه</span>
          <select
            value={String(props.orientation || 'horizontal')}
            onChange={(e) => set('orientation', e.target.value)}
            className={fieldClass}
          >
            <option value="horizontal">افقی (چپ / راست)</option>
            <option value="vertical">عمودی (بالا / پایین)</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            موقعیت اولیه ({initialPosition}٪)
          </span>
          <input
            type="range"
            min={10}
            max={90}
            value={initialPosition}
            onChange={(e) => set('initialPosition', Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={props.showLabels !== false}
            onChange={(e) => set('showLabels', e.target.checked)}
          />
          نمایش برچسب قبل / بعد
        </label>
      </div>

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
              value={Number(props.widthPx) || 800}
              onChange={(e) => set('widthPx', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">نسبت تصویر</span>
          <select
            value={String(props.aspect || 'video')}
            onChange={(e) => set('aspect', e.target.value)}
            className={fieldClass}
          >
            {IMAGE_ASPECT_OPTIONS.filter((o) => o.value !== 'original' && o.value !== 'auto').map(
              (o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              )
            )}
            <option value="auto">خودکار (۱۶:۹)</option>
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
    </div>
  );
}
