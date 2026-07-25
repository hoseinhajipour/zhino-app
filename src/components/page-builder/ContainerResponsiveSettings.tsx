import React, { useState } from 'react';
import {
  devicePropKey,
  type ColumnsDirection,
  type DeviceBand,
} from '../../lib/responsiveGrid';

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

const DIRECTION_OPTIONS = [
  { value: 'row' as const, label: 'افقی ←', hint: 'راست به چپ', icon: 'arrow_back' },
  { value: 'row-reverse' as const, label: 'افقی →', hint: 'چپ به راست', icon: 'arrow_forward' },
  { value: 'column' as const, label: 'بالا به پایین', hint: 'ستونی از بالا', icon: 'arrow_downward' },
  {
    value: 'column-reverse' as const,
    label: 'پایین به بالا',
    hint: 'ستونی از پایین',
    icon: 'arrow_upward',
  },
];

const DEVICE_TABS: { id: DeviceBand; label: string; icon: string }[] = [
  { id: 'mobile', label: 'موبایل', icon: 'smartphone' },
  { id: 'tablet', label: 'تبلت', icon: 'tablet_mac' },
  { id: 'desktop', label: 'دسکتاپ', icon: 'computer' },
];

const PADDING_PRESET_PX: Record<string, number> = { none: 0, sm: 12, md: 20, lg: 32 };

function readEffective(
  props: Record<string, unknown>,
  base: string,
  band: DeviceBand
): unknown {
  if (band === 'desktop') return props[base];
  const specific = props[devicePropKey(base, band)];
  if (specific !== undefined && specific !== null && specific !== '') return specific;
  return props[base];
}

function hasOverride(props: Record<string, unknown>, base: string, band: DeviceBand): boolean {
  if (band === 'desktop') return false;
  const v = props[devicePropKey(base, band)];
  return v !== undefined && v !== null && v !== '';
}

export function ContainerResponsiveSettings({
  props: p,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const [band, setBand] = useState<DeviceBand>('mobile');

  const setBandProp = (base: string, value: unknown) => {
    const key = devicePropKey(base, band);
    onChange({ ...p, [key]: value });
  };

  const setBandProps = (patch: Record<string, unknown>) => {
    const next: Record<string, unknown> = { ...p };
    for (const [base, value] of Object.entries(patch)) {
      next[devicePropKey(base, band)] = value;
    }
    onChange(next);
  };

  const clearBandOverrides = () => {
    if (band === 'desktop') return;
    const next = { ...p };
    for (const base of [
      'columnsDirection',
      'padding',
      'paddingX',
      'paddingY',
      'marginTop',
      'marginBottom',
    ]) {
      delete next[devicePropKey(base, band)];
    }
    onChange(next);
  };

  const direction = String(
    readEffective(p, 'columnsDirection', band) || 'row'
  ) as ColumnsDirection;
  const paddingPreset = String(readEffective(p, 'padding', band) || 'md');
  const paddingX = Number(readEffective(p, 'paddingX', band)) || 0;
  const paddingY = Number(readEffective(p, 'paddingY', band)) || 0;
  const marginTop = Number(readEffective(p, 'marginTop', band)) || 0;
  const marginBottom = Number(readEffective(p, 'marginBottom', band)) || 0;

  const bandHasOverride =
    band !== 'desktop' &&
    ['columnsDirection', 'padding', 'paddingX', 'paddingY', 'marginTop', 'marginBottom'].some(
      (base) => hasOverride(p, base, band)
    );

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 space-y-2">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">devices</span>
          ریسپانسیو کانتینر
        </p>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          برای هر دستگاه جهت نمایش، پدینگ و مارجین جداگانه تنظیم کنید. مقادیر موبایل و تبلت در صورت
          خالی بودن از دسکتاپ ارث می‌برند.
        </p>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          در پیش‌نمایش صفحه‌ساز از دکمه‌های موبایل / تبلت / دسکتاپ برای دیدن نتیجه استفاده کنید.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        {DEVICE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setBand(tab.id)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 ${
              band === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white/70 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {band !== 'desktop' && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-on-surface-variant font-bold">
            {bandHasOverride ? 'مقادیر اختصاصی این دستگاه' : 'در حال ارث‌بری از دسکتاپ'}
          </p>
          {bandHasOverride && (
            <button
              type="button"
              onClick={clearBandOverrides}
              className="text-[10px] font-bold text-rose-500 hover:underline"
            >
              بازنشانی
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-on-surface-variant block">
          جهت نمایش ستون‌ها
        </span>
        <div className="grid grid-cols-2 gap-2">
          {DIRECTION_OPTIONS.map((opt) => {
            const active = direction === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBandProp('columnsDirection', opt.value)}
                className={`text-right rounded-xl border p-2.5 transition-all ${
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-outline-variant/40 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">
                    {opt.icon}
                  </span>
                  <p className="text-[11px] font-black text-on-surface">{opt.label}</p>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">crop_free</span>
          پدینگ و مارجین
        </p>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">حاشیه داخلی</span>
          <select
            value={paddingPreset}
            onChange={(e) => {
              const next = e.target.value;
              if (next !== 'custom' && next in PADDING_PRESET_PX) {
                setBandProps({
                  padding: next,
                  paddingX: PADDING_PRESET_PX[next],
                  paddingY: PADDING_PRESET_PX[next],
                });
                return;
              }
              setBandProp('padding', next);
            }}
            className={fieldClass}
          >
            <option value="none">بدون</option>
            <option value="sm">کم</option>
            <option value="md">متوسط</option>
            <option value="lg">زیاد</option>
            <option value="custom">سفارشی</option>
          </select>
        </label>

        {paddingPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">عمودی</span>
              <input
                type="number"
                min={0}
                max={120}
                value={paddingY}
                onChange={(e) => setBandProp('paddingY', Number(e.target.value))}
                className={fieldClass}
                dir="ltr"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">افقی</span>
              <input
                type="number"
                min={0}
                max={120}
                value={paddingX}
                onChange={(e) => setBandProp('paddingX', Number(e.target.value))}
                className={fieldClass}
                dir="ltr"
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">مارجین بالا</span>
            <input
              type="number"
              min={0}
              max={160}
              value={marginTop}
              onChange={(e) => setBandProp('marginTop', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">مارجین پایین</span>
            <input
              type="number"
              min={0}
              max={160}
              value={marginBottom}
              onChange={(e) => setBandProp('marginBottom', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
