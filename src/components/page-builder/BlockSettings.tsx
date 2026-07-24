import React, { useMemo, useState } from 'react';
import type { ServiceBlock, ServiceBlockType } from '../../types';
import { BLOCK_LABELS } from '../../lib/landingToBlocks';
import { filterMaterialIcons } from '../../lib/materialIcons';
import { MediaField } from '../media/MediaField';
import { DividerBlockSettings } from './DividerBlockSettings';
import { SpacerBlockSettings } from './SpacerBlockSettings';
import { SingleImageBlockSettings } from './SingleImageBlockSettings';
import { ImageGalleryBlockSettings } from './ImageGalleryBlockSettings';

interface BlockSettingsProps {
  block: ServiceBlock;
  onChange: (props: Record<string, unknown>) => void;
  /** Add a nestable widget into a container column */
  onAddNestedBlock?: (columnIndex: number, type: ServiceBlockType) => void;
  onRemoveNestedBlock?: (columnIndex: number, blockId: string) => void;
  onSelectNestedBlock?: (blockId: string) => void;
}

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

function ResponsiveColumnsFields({
  props,
  onChange,
  defaults,
  desktopLabel = 'دسکتاپ',
  onDesktopChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
  defaults: { mobile: number; tablet: number; desktop: number };
  desktopLabel?: string;
  /** When desktop count changes (e.g. container content slots). */
  onDesktopChange?: (desktop: number, nextProps: Record<string, unknown>) => void;
}) {
  const mobile = Number(props.columnsMobile ?? defaults.mobile);
  const tablet = Number(props.columnsTablet ?? defaults.tablet);
  const desktop = Number(props.columnsDesktop ?? props.columnCount ?? defaults.desktop);

  const options = (
    <>
      <option value={1}>۱ ستون</option>
      <option value={2}>۲ ستون</option>
      <option value={3}>۳ ستون</option>
      <option value={4}>۴ ستون</option>
    </>
  );

  return (
    <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
      <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
        <span className="material-symbols-outlined text-primary text-base">devices</span>
        ستون‌ها در هر دستگاه
      </p>
      <p className="text-[10px] text-on-surface-variant leading-relaxed">
        در پیش‌نمایش صفحه‌ساز، دکمه موبایل/تبلت/دسکتاپ همان تعداد ستون همان دستگاه را نشان می‌دهد (نه عرض
        کانواس). در سایت واقعی بر اساس عرض پنجره: موبایل تا ۷۶۷px · تبلت از ۷۶۸px · دسکتاپ از ۱۰۲۴px
      </p>
      <div className="grid grid-cols-3 gap-2">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-0.5">
            <span className="material-symbols-outlined text-sm">smartphone</span>
            موبایل
          </span>
          <select
            value={mobile}
            onChange={(e) => onChange({ ...props, columnsMobile: Number(e.target.value) })}
            className={fieldClass}
          >
            {options}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-0.5">
            <span className="material-symbols-outlined text-sm">tablet_mac</span>
            تبلت
          </span>
          <select
            value={tablet}
            onChange={(e) => onChange({ ...props, columnsTablet: Number(e.target.value) })}
            className={fieldClass}
          >
            {options}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-0.5">
            <span className="material-symbols-outlined text-sm">computer</span>
            {desktopLabel}
          </span>
          <select
            value={desktop}
            onChange={(e) => {
              const next = Number(e.target.value);
              const nextProps = {
                ...props,
                columnsDesktop: next,
                columnCount: next,
              };
              if (onDesktopChange) onDesktopChange(next, nextProps);
              else onChange(nextProps);
            }}
            className={fieldClass}
          >
            {options}
          </select>
        </label>
      </div>
    </div>
  );
}

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
          rows={3}
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

function updateItemArray<T extends Record<string, unknown>>(
  items: T[],
  index: number,
  patch: Partial<T>
): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function IconBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const [query, setQuery] = useState('');
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const current = String(props.icon || 'psychology');
  const icons = useMemo(() => filterMaterialIcons(query, 60), [query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
        <span
          className="material-symbols-outlined text-primary"
          style={{
            fontSize: 40,
            fontVariationSettings:
              props.filled === true ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" : undefined,
          }}
        >
          {current}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-on-surface truncate">{current}</p>
          <p className="text-[10px] text-on-surface-variant">پیش‌نمایش آیکون انتخاب‌شده</p>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">نام آیکون (Material Symbol)</span>
        <input
          type="text"
          value={current}
          onChange={(e) => set('icon', e.target.value.trim().replace(/\s+/g, '_'))}
          placeholder="psychology"
          className={fieldClass}
          dir="ltr"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">جستجو در آیکون‌های سایت</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً map یا heart"
          className={fieldClass}
          dir="ltr"
        />
      </label>

      <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
        {icons.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => set('icon', name)}
            className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
              current === name
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{name}</span>
          </button>
        ))}
      </div>

      <TextInput label="برچسب (اختیاری)" value={String(props.label || '')} onChange={(v) => set('label', v)} />

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">اندازه ({Number(props.size) || 48}px)</span>
        <input
          type="range"
          min={16}
          max={120}
          value={Number(props.size) || 48}
          onChange={(e) => set('size', Number(e.target.value))}
          className="w-full"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">رنگ</span>
        <select
          value={String(props.color || 'primary')}
          onChange={(e) => set('color', e.target.value)}
          className={fieldClass}
        >
          <option value="primary">اصلی</option>
          <option value="onSurface">متن</option>
          <option value="muted">کم‌رنگ</option>
          <option value="emerald">سبز</option>
          <option value="rose">صورتی</option>
          <option value="amber">کهربایی</option>
        </select>
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
          checked={props.filled === true}
          onChange={(e) => set('filled', e.target.checked)}
        />
        آیکون توپُر (Filled)
      </label>

      <TextInput
        label="لینک (اختیاری)"
        value={String(props.linkTarget || '')}
        onChange={(v) => set('linkTarget', v)}
      />
    </div>
  );
}

function ItemIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const icons = useMemo(() => filterMaterialIcons(query, 48), [query]);
  const current = value || 'check_circle';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-10 h-10 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-center text-primary hover:border-primary/40 transition-colors"
          title="انتخاب آیکون"
        >
          <span className="material-symbols-outlined text-[22px]">{current}</span>
        </button>
        <input
          type="text"
          value={current}
          onChange={(e) => onChange(e.target.value.trim().replace(/\s+/g, '_'))}
          placeholder="check_circle"
          className={`${fieldClass} flex-1`}
          dir="ltr"
        />
      </div>
      {open && (
        <div className="space-y-1.5 p-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی آیکون..."
            className={fieldClass}
            dir="ltr"
          />
          <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto">
            {icons.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                  current === name
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconListBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const items = (
    Array.isArray(props.items) ? props.items : []
  ) as Array<{ icon?: string; text?: string; link?: string }>;

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">
          اندازه آیکون ({Number(props.iconSize) || 28}px)
        </span>
        <input
          type="range"
          min={18}
          max={48}
          value={Number(props.iconSize) || 28}
          onChange={(e) => set('iconSize', Number(e.target.value))}
          className="w-full"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">رنگ آیکون</span>
        <select
          value={String(props.color || 'primary')}
          onChange={(e) => set('color', e.target.value)}
          className={fieldClass}
        >
          <option value="primary">اصلی</option>
          <option value="onSurface">متن</option>
          <option value="muted">کم‌رنگ</option>
          <option value="emerald">سبز</option>
          <option value="rose">صورتی / ارغوانی</option>
          <option value="amber">کهربایی</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">فاصله بین آیتم‌ها</span>
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

      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.filled === true}
          onChange={(e) => set('filled', e.target.checked)}
        />
        آیکون توپُر (Filled)
      </label>

      <div className="space-y-2 pt-1">
        <p className="text-[11px] font-black text-on-surface">آیتم‌های لیست</p>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/50"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold">آیتم {idx + 1}</span>
              <button
                type="button"
                className="text-rose-500 text-[10px] font-bold"
                onClick={() => set('items', items.filter((_, i) => i !== idx))}
              >
                حذف
              </button>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">آیکون</span>
              <ItemIconPicker
                value={String(item.icon || 'check_circle')}
                onChange={(icon) => set('items', updateItemArray(items, idx, { icon }))}
              />
            </div>
            <TextInput
              label="متن"
              value={String(item.text || '')}
              onChange={(v) => set('items', updateItemArray(items, idx, { text: v }))}
              multiline
            />
            <TextInput
              label="لینک (اختیاری)"
              value={String(item.link || '')}
              onChange={(v) => set('items', updateItemArray(items, idx, { link: v }))}
            />
          </div>
        ))}
        <button
          type="button"
          className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold hover:bg-primary/5"
          onClick={() =>
            set('items', [
              ...items,
              { icon: 'check_circle', text: 'متن آیتم جدید', link: '' },
            ])
          }
        >
          + افزودن آیتم
        </button>
      </div>
    </div>
  );
}

function ButtonBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const action = String(props.action || 'link');
  const showIcon = props.showIcon !== false;

  return (
    <div className="space-y-3">
      <TextInput
        label="متن دکمه"
        value={String(props.label || '')}
        onChange={(v) => set('label', v)}
      />

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">عملکرد</span>
        <select
          value={action}
          onChange={(e) => set('action', e.target.value)}
          className={fieldClass}
        >
          <option value="link">لینک</option>
          <option value="booking">باز کردن رزرو نوبت</option>
          <option value="none">بدون عمل</option>
        </select>
      </label>

      {action === 'link' && (
        <TextInput
          label="آدرس لینک"
          value={String(props.link || '')}
          onChange={(v) => set('link', v)}
        />
      )}

      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={showIcon}
          onChange={(e) => set('showIcon', e.target.checked)}
        />
        نمایش آیکون
      </label>

      {showIcon && (
        <>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant">آیکون</span>
            <ItemIconPicker
              value={String(props.icon || 'calendar_month')}
              onChange={(icon) => set('icon', icon)}
            />
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">موقعیت آیکون</span>
            <select
              value={String(props.iconPosition || 'start')}
              onChange={(e) => set('iconPosition', e.target.value)}
              className={fieldClass}
            >
              <option value="start">ابتدا (سمت راست در RTL)</option>
              <option value="end">انتها (سمت چپ در RTL)</option>
            </select>
          </label>
        </>
      )}

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">رنگ</span>
        <select
          value={String(props.color || 'primary')}
          onChange={(e) => set('color', e.target.value)}
          className={fieldClass}
        >
          <option value="primary">اصلی</option>
          <option value="secondary">ثانویه</option>
          <option value="emerald">سبز</option>
          <option value="rose">صورتی</option>
          <option value="amber">کهربایی</option>
          <option value="slate">تیره</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">سبک</span>
        <select
          value={String(props.variant || 'solid')}
          onChange={(e) => set('variant', e.target.value)}
          className={fieldClass}
        >
          <option value="solid">توپُر</option>
          <option value="outline">حاشیه‌دار</option>
          <option value="soft">نرم</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">اندازه</span>
        <select
          value={String(props.size || 'md')}
          onChange={(e) => set('size', e.target.value)}
          className={fieldClass}
        >
          <option value="sm">کوچک</option>
          <option value="md">متوسط</option>
          <option value="lg">بزرگ</option>
        </select>
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
          checked={props.fullWidth === true}
          onChange={(e) => set('fullWidth', e.target.checked)}
        />
        تمام‌عرض
      </label>
    </div>
  );
}

function HeroHeaderBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const slides = (
    Array.isArray(props.slides) ? props.slides : []
  ) as Array<{
    image?: string;
    badge?: string;
    title?: string;
    description?: string;
    rating?: string;
    floatingBadge?: string;
    floatingIcon?: string;
  }>;
  const departments = (
    Array.isArray(props.departments) ? props.departments : []
  ) as Array<{ icon?: string; label?: string; link?: string }>;
  const stats = (
    Array.isArray(props.stats) ? props.stats : []
  ) as Array<{ icon?: string; value?: string; label?: string }>;
  const ctaAction = String(props.ctaAction || 'booking');

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-2">
        محتوا و متن
      </p>
      <TextInput label="نشان بالا" value={String(props.badge || '')} onChange={(v) => set('badge', v)} />
      <TextInput
        label="متن وضعیت"
        value={String(props.statusText || '')}
        onChange={(v) => set('statusText', v)}
      />
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showStatus !== false}
          onChange={(e) => set('showStatus', e.target.checked)}
        />
        نمایش وضعیت (نقطه سبز)
      </label>
      <TextInput label="عنوان" value={String(props.title || '')} onChange={(v) => set('title', v)} multiline />
      <TextInput
        label="قسمت هایلایت عنوان (عین همان متن داخل عنوان)"
        value={String(props.titleHighlight || '')}
        onChange={(v) => set('titleHighlight', v)}
      />
      <TextInput
        label="توضیحات"
        value={String(props.subtitle || '')}
        onChange={(v) => set('subtitle', v)}
        multiline
      />

      <p className="text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-2 pt-1">
        ظاهر و چیدمان
      </p>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">رنگ تاکیدی</span>
        <select
          value={String(props.accentColor || 'primary')}
          onChange={(e) => set('accentColor', e.target.value)}
          className={fieldClass}
        >
          <option value="primary">اصلی</option>
          <option value="rose">صورتی</option>
          <option value="fuchsia">ارغوانی</option>
          <option value="violet">بنفش</option>
          <option value="emerald">سبز</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">اندازه عنوان</span>
        <select
          value={String(props.titleSize || 'lg')}
          onChange={(e) => set('titleSize', e.target.value)}
          className={fieldClass}
        >
          <option value="md">متوسط</option>
          <option value="lg">بزرگ</option>
          <option value="xl">خیلی بزرگ</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">تراز متن</span>
        <select
          value={String(props.contentAlign || 'start')}
          onChange={(e) => set('contentAlign', e.target.value)}
          className={fieldClass}
        >
          <option value="start">راست</option>
          <option value="center">وسط</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">چینش ستون‌ها</span>
        <select
          value={String(props.mediaSide || 'end')}
          onChange={(e) => set('mediaSide', e.target.value)}
          className={fieldClass}
        >
          <option value="end">متن راست · تصویر چپ</option>
          <option value="start">تصویر راست · متن چپ</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">فاصله عمودی بخش</span>
        <select
          value={String(props.sectionPadding || 'md')}
          onChange={(e) => set('sectionPadding', e.target.value)}
          className={fieldClass}
        >
          <option value="sm">کم</option>
          <option value="md">متوسط</option>
          <option value="lg">زیاد</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">
          گردی تصویر ({Number(props.mediaRadius) || 32}px)
        </span>
        <input
          type="range"
          min={12}
          max={48}
          value={Number(props.mediaRadius) || 32}
          onChange={(e) => set('mediaRadius', Number(e.target.value))}
          className="w-full"
        />
      </label>

      <p className="text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-2 pt-1">
        دکمه اصلی (CTA)
      </p>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showCta !== false}
          onChange={(e) => set('showCta', e.target.checked)}
        />
        نمایش دکمه
      </label>
      <TextInput
        label="متن دکمه"
        value={String(props.ctaLabel || '')}
        onChange={(v) => set('ctaLabel', v)}
      />
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-on-surface-variant">آیکون دکمه</span>
        <ItemIconPicker
          value={String(props.ctaIcon || 'psychology')}
          onChange={(icon) => set('ctaIcon', icon)}
        />
      </div>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">عملکرد</span>
        <select
          value={ctaAction}
          onChange={(e) => set('ctaAction', e.target.value)}
          className={fieldClass}
        >
          <option value="booking">رزرو نوبت</option>
          <option value="guide">راهنمای انتخاب درمانگر</option>
          <option value="link">لینک سفارشی</option>
          <option value="navigate">مسیر داخلی (مثل services)</option>
          <option value="none">بدون عمل</option>
        </select>
      </label>
      {(ctaAction === 'link' || ctaAction === 'navigate') && (
        <TextInput
          label={ctaAction === 'navigate' ? 'مسیر (مثل team)' : 'آدرس لینک'}
          value={String(props.ctaLink || '')}
          onChange={(v) => set('ctaLink', v)}
        />
      )}
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">سبک دکمه</span>
        <select
          value={String(props.ctaVariant || 'outline')}
          onChange={(e) => set('ctaVariant', e.target.value)}
          className={fieldClass}
        >
          <option value="outline">حاشیه‌دار</option>
          <option value="solid">توپُر</option>
          <option value="soft">نرم</option>
        </select>
      </label>

      <p className="text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-2 pt-1">
        دپارتمان‌ها
      </p>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showDepartments !== false}
          onChange={(e) => set('showDepartments', e.target.checked)}
        />
        نمایش دپارتمان‌ها
      </label>
      <TextInput
        label="عنوان دپارتمان‌ها"
        value={String(props.departmentsTitle || '')}
        onChange={(v) => set('departmentsTitle', v)}
      />
      {departments.map((dep, idx) => (
        <div
          key={idx}
          className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/50"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold">دپارتمان {idx + 1}</span>
            <button
              type="button"
              className="text-rose-500 text-[10px] font-bold"
              onClick={() => set('departments', departments.filter((_, i) => i !== idx))}
            >
              حذف
            </button>
          </div>
          <ItemIconPicker
            value={String(dep.icon || 'circle')}
            onChange={(icon) => set('departments', updateItemArray(departments, idx, { icon }))}
          />
          <TextInput
            label="عنوان"
            value={String(dep.label || '')}
            onChange={(v) => set('departments', updateItemArray(departments, idx, { label: v }))}
          />
          <TextInput
            label="لینک (اختیاری)"
            value={String(dep.link || '')}
            onChange={(v) => set('departments', updateItemArray(departments, idx, { link: v }))}
          />
        </div>
      ))}
      <button
        type="button"
        className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold hover:bg-primary/5"
        onClick={() =>
          set('departments', [...departments, { icon: 'add_circle', label: 'دپارتمان جدید', link: '' }])
        }
      >
        + افزودن دپارتمان
      </button>

      <p className="text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-2 pt-1">
        کروسل تصویر
      </p>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showCarousel !== false}
          onChange={(e) => set('showCarousel', e.target.checked)}
        />
        نمایش کروسل
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.carouselAutoplay !== false}
          onChange={(e) => set('carouselAutoplay', e.target.checked)}
        />
        پخش خودکار
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showCarouselArrows !== false}
          onChange={(e) => set('showCarouselArrows', e.target.checked)}
        />
        فلش‌ها
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showCarouselDots !== false}
          onChange={(e) => set('showCarouselDots', e.target.checked)}
        />
        نقاط صفحه‌بندی
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showRatingBadge !== false}
          onChange={(e) => set('showRatingBadge', e.target.checked)}
        />
        نشان امتیاز
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showFloatingBadge !== false}
          onChange={(e) => set('showFloatingBadge', e.target.checked)}
        />
        نشان شناور پایین تصویر
      </label>
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/50"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold">اسلاید {idx + 1}</span>
            <button
              type="button"
              className="text-rose-500 text-[10px] font-bold"
              onClick={() => set('slides', slides.filter((_, i) => i !== idx))}
            >
              حذف
            </button>
          </div>
          <MediaField
            label="تصویر"
            value={String(slide.image || '')}
            onChange={(v) => set('slides', updateItemArray(slides, idx, { image: v }))}
            accept="image"
            aspect="video"
          />
          <TextInput
            label="برچسب روی تصویر"
            value={String(slide.badge || '')}
            onChange={(v) => set('slides', updateItemArray(slides, idx, { badge: v }))}
          />
          <TextInput
            label="عنوان اسلاید"
            value={String(slide.title || '')}
            onChange={(v) => set('slides', updateItemArray(slides, idx, { title: v }))}
          />
          <TextInput
            label="توضیح اسلاید"
            value={String(slide.description || '')}
            onChange={(v) => set('slides', updateItemArray(slides, idx, { description: v }))}
            multiline
          />
          <TextInput
            label="امتیاز (مثل ۴.۹ از ۵.۰)"
            value={String(slide.rating || '')}
            onChange={(v) => set('slides', updateItemArray(slides, idx, { rating: v }))}
          />
          <TextInput
            label="متن نشان شناور"
            value={String(slide.floatingBadge || '')}
            onChange={(v) => set('slides', updateItemArray(slides, idx, { floatingBadge: v }))}
          />
          <ItemIconPicker
            value={String(slide.floatingIcon || 'calendar_month')}
            onChange={(icon) => set('slides', updateItemArray(slides, idx, { floatingIcon: icon }))}
          />
        </div>
      ))}
      <button
        type="button"
        className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold hover:bg-primary/5"
        onClick={() =>
          set('slides', [
            ...slides,
            {
              image: '',
              badge: 'اتاق جدید',
              title: 'عنوان اسلاید',
              description: 'توضیح کوتاه',
              rating: '۵.۰ از ۵.۰',
              floatingBadge: 'نوبت‌دهی آنلاین',
              floatingIcon: 'calendar_month',
            },
          ])
        }
      >
        + افزودن اسلاید کروسل
      </button>

      <p className="text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-2 pt-1">
        آمار پایین
      </p>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showStats !== false}
          onChange={(e) => set('showStats', e.target.checked)}
        />
        نمایش آمار
      </label>
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/50"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold">آمار {idx + 1}</span>
            <button
              type="button"
              className="text-rose-500 text-[10px] font-bold"
              onClick={() => set('stats', stats.filter((_, i) => i !== idx))}
            >
              حذف
            </button>
          </div>
          <ItemIconPicker
            value={String(stat.icon || 'analytics')}
            onChange={(icon) => set('stats', updateItemArray(stats, idx, { icon }))}
          />
          <TextInput
            label="مقدار"
            value={String(stat.value || '')}
            onChange={(v) => set('stats', updateItemArray(stats, idx, { value: v }))}
          />
          <TextInput
            label="برچسب"
            value={String(stat.label || '')}
            onChange={(v) => set('stats', updateItemArray(stats, idx, { label: v }))}
          />
        </div>
      ))}
      <button
        type="button"
        className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold hover:bg-primary/5"
        onClick={() =>
          set('stats', [...stats, { icon: 'analytics', value: '۰', label: 'برچسب آمار' }])
        }
      >
        + افزودن آمار
      </button>
    </div>
  );
}

export const BlockSettings: React.FC<BlockSettingsProps> = ({
  block,
  onChange,
  onAddNestedBlock,
  onRemoveNestedBlock,
  onSelectNestedBlock,
}) => {
  const p = block.props;
  const set = (key: string, value: unknown) => onChange({ ...p, [key]: value });

  switch (block.type as ServiceBlockType) {
    case 'hero':
      return (
        <div className="space-y-3">
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <TextInput label="نشان (Badge)" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput
            label="نرخ رضایت"
            value={String(p.satisfactionRate || '')}
            onChange={(v) => set('satisfactionRate', v)}
          />
          <TextInput label="مدت جلسه" value={String(p.duration || '')} onChange={(v) => set('duration', v)} />
          <TextInput label="فرمت برگزاری" value={String(p.format || '')} onChange={(v) => set('format', v)} />
          <TextInput
            label="یادداشت هزینه"
            value={String(p.sessionFeeNote || '')}
            onChange={(v) => set('sessionFeeNote', v)}
          />
          <MediaField
            label="تصویر هیرو"
            value={String(p.heroImage || '')}
            onChange={(v) => set('heroImage', v)}
            accept="image"
            aspect="video"
          />
        </div>
      );

    case 'pageHero':
      return (
        <div className="space-y-3">
          <TextInput label="نشان" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">حالت تصویر</span>
            <select
              value={String(p.imageMode || (p.heroImage ? 'side' : 'none'))}
              onChange={(e) => set('imageMode', e.target.value)}
              className={fieldClass}
            >
              <option value="none">بدون تصویر</option>
              <option value="side">تصویر کنار متن</option>
              <option value="background">تصویر پس‌زمینه</option>
            </select>
          </label>
          {String(p.imageMode || (p.heroImage ? 'side' : 'none')) !== 'none' && (
            <>
              <MediaField
                label="تصویر هیرو"
                value={String(p.heroImage || '')}
                onChange={(v) => {
                  onChange({
                    ...p,
                    heroImage: v,
                    imageMode:
                      p.imageMode && p.imageMode !== 'none' ? p.imageMode : 'side',
                  });
                }}
                accept="image"
                aspect="video"
              />
              <TextInput
                label="متن جایگزین تصویر (Alt)"
                value={String(p.imageAlt || '')}
                onChange={(v) => set('imageAlt', v)}
              />
            </>
          )}
          {String(p.imageMode || '') === 'background' && (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                تیرگی لایه روی تصویر ({Number(p.overlayOpacity ?? 45)}٪)
              </span>
              <input
                type="range"
                min={10}
                max={85}
                value={Number(p.overlayOpacity ?? 45)}
                onChange={(e) => set('overlayOpacity', Number(e.target.value))}
                className="w-full"
              />
            </label>
          )}
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showBooking !== false}
              onChange={(e) => set('showBooking', e.target.checked)}
            />
            نمایش دکمه رزرو نوبت
          </label>
          <TextInput
            label="متن دکمه اصلی"
            value={String(p.primaryCtaLabel || '')}
            onChange={(v) => set('primaryCtaLabel', v)}
          />
          <TextInput
            label="متن دکمه ثانویه (اختیاری)"
            value={String(p.secondaryCtaLabel || '')}
            onChange={(v) => set('secondaryCtaLabel', v)}
          />
          <TextInput
            label="مسیر دکمه ثانویه (مثل services)"
            value={String(p.secondaryCtaScreen || '')}
            onChange={(v) => set('secondaryCtaScreen', v)}
          />
        </div>
      );

    case 'heroHeader':
      return <HeroHeaderBlockSettings props={p} onChange={onChange} />;

    case 'highlights': {
      const items = (Array.isArray(p.items) ? p.items : []) as {
        icon: string;
        label: string;
        value: string;
      }[];
      return (
        <div className="space-y-3">
          <ResponsiveColumnsFields
            props={p}
            onChange={onChange}
            defaults={{ mobile: 1, tablet: 2, desktop: 4 }}
          />
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/50">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold">آیتم {idx + 1}</span>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('items', items.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <TextInput
                label="آیکون"
                value={item.icon}
                onChange={(v) => set('items', updateItemArray(items, idx, { icon: v }))}
              />
              <TextInput
                label="برچسب"
                value={item.label}
                onChange={(v) => set('items', updateItemArray(items, idx, { label: v }))}
              />
              <TextInput
                label="مقدار"
                value={item.value}
                onChange={(v) => set('items', updateItemArray(items, idx, { value: v }))}
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() => set('items', [...items, { icon: 'star', label: 'برچسب', value: 'مقدار' }])}
          >
            + افزودن آیتم
          </button>
        </div>
      );
    }

    case 'symptoms':
    case 'features': {
      const items = (Array.isArray(p.items) ? p.items : []) as {
        icon: string;
        title: string;
        desc: string;
      }[];
      return (
        <div className="space-y-3">
          <TextInput label="عنوان بخش" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          {block.type === 'symptoms' && (
            <TextInput
              label="زیرعنوان"
              value={String(p.subtitle || '')}
              onChange={(v) => set('subtitle', v)}
              multiline
            />
          )}
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold">کارت {idx + 1}</span>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('items', items.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <TextInput
                label="آیکون"
                value={item.icon}
                onChange={(v) => set('items', updateItemArray(items, idx, { icon: v }))}
              />
              <TextInput
                label="عنوان"
                value={item.title}
                onChange={(v) => set('items', updateItemArray(items, idx, { title: v }))}
              />
              <TextInput
                label="توضیح"
                value={item.desc}
                onChange={(v) => set('items', updateItemArray(items, idx, { desc: v }))}
                multiline
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() =>
              set('items', [...items, { icon: 'psychology', title: 'عنوان', desc: 'توضیح' }])
            }
          >
            + افزودن کارت
          </button>
        </div>
      );
    }

    case 'process': {
      const steps = (Array.isArray(p.steps) ? p.steps : []) as {
        number: string;
        title: string;
        desc: string;
      }[];
      return (
        <div className="space-y-3">
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput label="برچسب بالا" value={String(p.eyebrow || '')} onChange={(v) => set('eyebrow', v)} />
          {steps.map((step, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold">گام {idx + 1}</span>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('steps', steps.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <TextInput
                label="شماره"
                value={step.number}
                onChange={(v) => set('steps', updateItemArray(steps, idx, { number: v }))}
              />
              <TextInput
                label="عنوان"
                value={step.title}
                onChange={(v) => set('steps', updateItemArray(steps, idx, { title: v }))}
              />
              <TextInput
                label="توضیح"
                value={step.desc}
                onChange={(v) => set('steps', updateItemArray(steps, idx, { desc: v }))}
                multiline
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() =>
              set('steps', [
                ...steps,
                { number: String(steps.length + 1).padStart(2, '۰'), title: 'گام', desc: 'توضیح' },
              ])
            }
          >
            + افزودن گام
          </button>
        </div>
      );
    }

    case 'doctors':
      return (
        <div className="space-y-3">
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <ResponsiveColumnsFields
            props={p}
            onChange={onChange}
            defaults={{ mobile: 1, tablet: 2, desktop: 3 }}
          />
          <TextInput
            label="فیلتر تخصص‌ها (با کاما)"
            value={(Array.isArray(p.specialtiesFilter) ? p.specialtiesFilter : []).join(',')}
            onChange={(v) =>
              set(
                'specialtiesFilter',
                v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
          <TextInput
            label="حداکثر تعداد نمایش"
            value={String(p.maxCount ?? 3)}
            onChange={(v) => set('maxCount', Number(v) || 3)}
          />
        </div>
      );

    case 'staffCarousel':
      return (
        <div className="space-y-3">
          <TextInput label="نشان (Badge)" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <ResponsiveColumnsFields
            props={p}
            onChange={onChange}
            defaults={{ mobile: 1, tablet: 2, desktop: 4 }}
            desktopLabel="کارت در دسکتاپ"
          />
          <TextInput
            label="فیلتر تخصص‌ها (با کاما)"
            value={(Array.isArray(p.specialtiesFilter) ? p.specialtiesFilter : []).join(',')}
            onChange={(v) =>
              set(
                'specialtiesFilter',
                v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
          <TextInput
            label="حداکثر تعداد (۰ = همه)"
            value={String(p.maxCount ?? 0)}
            onChange={(v) => set('maxCount', Number(v) || 0)}
          />
          <TextInput
            label="متن دکمه مشاهده همه"
            value={String(p.viewAllLabel || 'مشاهده همه')}
            onChange={(v) => set('viewAllLabel', v)}
          />
          <TextInput
            label="متن دکمه رزرو"
            value={String(p.bookingLabel || 'رزرو نوبت')}
            onChange={(v) => set('bookingLabel', v)}
          />
          <TextInput
            label="متن دکمه پروفایل"
            value={String(p.profileLabel || 'پروفایل درمانگر')}
            onChange={(v) => set('profileLabel', v)}
          />
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showViewAll !== false}
              onChange={(e) => set('showViewAll', e.target.checked)}
            />
            نمایش دکمه «مشاهده همه»
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showArrows !== false}
              onChange={(e) => set('showArrows', e.target.checked)}
            />
            فلش‌های ناوبری
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showDots !== false}
              onChange={(e) => set('showDots', e.target.checked)}
            />
            نقاط صفحه‌بندی
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.onlyActive !== false}
              onChange={(e) => set('onlyActive', e.target.checked)}
            />
            فقط پرسنل فعال
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.autoplay === true}
              onChange={(e) => set('autoplay', e.target.checked)}
            />
            پخش خودکار
          </label>
          {p.autoplay === true && (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                فاصله پخش ({Number(p.intervalMs) || 5000}ms)
              </span>
              <input
                type="range"
                min={2500}
                max={10000}
                step={500}
                value={Number(p.intervalMs) || 5000}
                onChange={(e) => set('intervalMs', Number(e.target.value))}
                className="w-full"
              />
            </label>
          )}
        </div>
      );

    case 'testimonials': {
      const items = (Array.isArray(p.items) ? p.items : []) as {
        name: string;
        role: string;
        comment: string;
        rating: number;
      }[];
      return (
        <div className="space-y-3">
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput label="زیرعنوان" value={String(p.subtitle || '')} onChange={(v) => set('subtitle', v)} />
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold">نظر {idx + 1}</span>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('items', items.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <TextInput
                label="نام"
                value={item.name}
                onChange={(v) => set('items', updateItemArray(items, idx, { name: v }))}
              />
              <TextInput
                label="نقش"
                value={item.role}
                onChange={(v) => set('items', updateItemArray(items, idx, { role: v }))}
              />
              <TextInput
                label="نظر"
                value={item.comment}
                onChange={(v) => set('items', updateItemArray(items, idx, { comment: v }))}
                multiline
              />
              <TextInput
                label="امتیاز (۱–۵)"
                value={String(item.rating || 5)}
                onChange={(v) =>
                  set('items', updateItemArray(items, idx, { rating: Number(v) || 5 }))
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() =>
              set('items', [...items, { name: 'مراجع', role: 'مراجع', comment: '...', rating: 5 }])
            }
          >
            + افزودن نظر
          </button>
        </div>
      );
    }

    case 'faqs': {
      const items = (Array.isArray(p.items) ? p.items : []) as { question: string; answer: string }[];
      return (
        <div className="space-y-3">
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput label="زیرعنوان" value={String(p.subtitle || '')} onChange={(v) => set('subtitle', v)} />
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold">سوال {idx + 1}</span>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('items', items.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <TextInput
                label="سوال"
                value={item.question}
                onChange={(v) => set('items', updateItemArray(items, idx, { question: v }))}
              />
              <TextInput
                label="پاسخ"
                value={item.answer}
                onChange={(v) => set('items', updateItemArray(items, idx, { answer: v }))}
                multiline
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() => set('items', [...items, { question: 'سوال؟', answer: 'پاسخ' }])}
          >
            + افزودن سوال
          </button>
        </div>
      );
    }

    case 'latestFaqs':
      return (
        <div className="space-y-3">
          <TextInput label="نشان" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <TextInput
            label="حداکثر تعداد"
            value={String(p.maxCount ?? 6)}
            onChange={(v) => set('maxCount', Number(v) || 6)}
          />
          <TextInput
            label="فیلتر دسته (با کاما: adult,child,marriage,...)"
            value={(Array.isArray(p.categoryFilter) ? p.categoryFilter : []).join(',')}
            onChange={(v) =>
              set(
                'categoryFilter',
                v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">سبک کارت</span>
            <select
              value={String(p.accentStyle || 'soft')}
              onChange={(e) => set('accentStyle', e.target.value)}
              className={fieldClass}
            >
              <option value="soft">نرم (سایه ملایم)</option>
              <option value="bordered">حاشیه‌دار رنگی</option>
            </select>
          </label>
          <TextInput
            label="متن دکمه مشاهده همه"
            value={String(p.viewAllLabel || 'مشاهده همه سوالات')}
            onChange={(v) => set('viewAllLabel', v)}
          />
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showCategory !== false}
              onChange={(e) => set('showCategory', e.target.checked)}
            />
            نمایش دسته
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showLikes !== false}
              onChange={(e) => set('showLikes', e.target.checked)}
            />
            نمایش تعداد لایک
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showViewAll !== false}
              onChange={(e) => set('showViewAll', e.target.checked)}
            />
            دکمه مشاهده همه
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.openFirst !== false}
              onChange={(e) => set('openFirst', e.target.checked)}
            />
            اولین آیتم باز باشد
          </label>
          <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
            این ویجت سوالات تأییدشدهٔ دیتابیس را نشان می‌دهد؛ محتوا از تب «سوالات متداول» مدیریت می‌شود.
          </p>
        </div>
      );

    case 'contactInfo':
      return (
        <div className="space-y-3">
          <TextInput label="نشان" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">چیدمان</span>
            <select
              value={String(p.layout || 'cards')}
              onChange={(e) => set('layout', e.target.value)}
              className={fieldClass}
            >
              <option value="cards">کارت‌های شبکه‌ای</option>
              <option value="stacked">ستونی / پشت‌سرهم</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showPhones !== false}
              onChange={(e) => set('showPhones', e.target.checked)}
            />
            نمایش تلفن‌ها
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showSocials !== false}
              onChange={(e) => set('showSocials', e.target.checked)}
            />
            نمایش پیام‌رسان‌ها و ایمیل
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showAddresses !== false}
              onChange={(e) => set('showAddresses', e.target.checked)}
            />
            نمایش آدرس‌ها
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showMap !== false}
              onChange={(e) => set('showMap', e.target.checked)}
            />
            نمایش نقشه گوگل
          </label>
          <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
            محتوا از تب ادمین «اطلاعات تماس» خوانده می‌شود.
          </p>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-3">
          <TextInput label="نشان" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="توضیح"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <TextInput
            label="متن دکمه تماس"
            value={String(p.phoneLabel || '')}
            onChange={(v) => set('phoneLabel', v)}
          />
          <TextInput
            label="لینک تماس"
            value={String(p.phoneHref || '')}
            onChange={(v) => set('phoneHref', v)}
          />
        </div>
      );

    case 'richText':
      return (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">محتوای HTML</span>
            <textarea
              rows={10}
              value={String(p.html || '')}
              onChange={(e) => set('html', e.target.value)}
              className={`${fieldClass} font-mono`}
            />
          </label>
        </div>
      );

    case 'htmlCode':
      return (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">کد HTML</span>
            <textarea
              rows={14}
              value={String(p.html || '')}
              onChange={(e) => set('html', e.target.value)}
              dir="ltr"
              spellCheck={false}
              placeholder="<!-- HTML, iframe, embed, ... -->"
              className={`${fieldClass} font-mono text-[11px] leading-relaxed min-h-[220px]`}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">عرض محتوا</span>
            <select
              value={String(p.maxWidth || 'full')}
              onChange={(e) => set('maxWidth', e.target.value)}
              className={fieldClass}
            >
              <option value="full">تمام عرض</option>
              <option value="lg">بزرگ</option>
              <option value="md">متوسط</option>
              <option value="sm">کوچک</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.padded !== false}
              onChange={(e) => set('padded', e.target.checked)}
            />
            قاب و حاشیه دور محتوا
          </label>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            مناسب برای iframe، فرم‌های خارجی، اسکریپت‌های embed و HTML سفارشی. اسکریپت‌های inline ممکن است در مرورگر محدود شوند.
          </p>
        </div>
      );

    case 'otherServices':
      return (
        <TextInput label="عنوان بخش" value={String(p.title || '')} onChange={(v) => set('title', v)} />
      );

    case 'servicesGrid':
      return (
        <div className="space-y-3">
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <ResponsiveColumnsFields
            props={p}
            onChange={onChange}
            defaults={{ mobile: 1, tablet: 2, desktop: 3 }}
          />
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            کارت‌ها به‌صورت خودکار از فهرست خدمات فعال ساخته می‌شوند.
          </p>
        </div>
      );

    case 'contactCards':
      return (
        <div className="space-y-3">
          <TextInput label="آدرس" value={String(p.address || '')} onChange={(v) => set('address', v)} multiline />
          <TextInput
            label="یادداشت آدرس"
            value={String(p.addressNote || '')}
            onChange={(v) => set('addressNote', v)}
          />
          <TextInput label="تلفن ۱" value={String(p.phone1 || '')} onChange={(v) => set('phone1', v)} />
          <TextInput label="تلفن ۲" value={String(p.phone2 || '')} onChange={(v) => set('phone2', v)} />
          <TextInput label="ساعات کاری" value={String(p.hours || '')} onChange={(v) => set('hours', v)} />
          <TextInput label="ایمیل" value={String(p.email || '')} onChange={(v) => set('email', v)} />
        </div>
      );

    case 'contactForm':
      return (
        <div className="space-y-3">
          <TextInput label="عنوان فرم" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
        </div>
      );

    case 'articlesGrid':
      return (
        <div className="space-y-3">
          <TextInput label="عنوان بخش" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />

          <div className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 space-y-3">
            <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">filter_alt</span>
              کوئری پیش‌فرض
            </p>
            <TextInput
              label="فیلتر دسته (نام یا شناسه — خالی = همه)"
              value={String(p.categoryFilter || '')}
              onChange={(v) => set('categoryFilter', v)}
            />
            <TextInput
              label="فیلتر عنوان (شامل این متن)"
              value={String(p.titleQuery || '')}
              onChange={(v) => set('titleQuery', v)}
            />
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">ترتیب نمایش</span>
              <select
                value={String(p.sortBy || 'newest')}
                onChange={(e) => set('sortBy', e.target.value)}
                className={fieldClass}
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="title_asc">عنوان (الف → ی)</option>
                <option value="title_desc">عنوان (ی → الف)</option>
                <option value="views">بیشترین بازدید</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">نوع چیدمان</span>
              <select
                value={String(p.layout || 'grid')}
                onChange={(e) => set('layout', e.target.value)}
                className={fieldClass}
              >
                <option value="grid">شبکه کارت</option>
                <option value="list">لیست افقی</option>
                <option value="compact">کارت فشرده</option>
              </select>
            </label>
            <TextInput
              label={
                p.showPagination
                  ? 'تعداد در هر صفحه'
                  : 'حداکثر آیتم (۰ = همه)'
              }
              value={String(p.maxCount ?? 6)}
              onChange={(v) => set('maxCount', Math.max(0, Number(v) || 0))}
            />
            <label className="flex items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={p.showPagination === true}
                onChange={(e) => set('showPagination', e.target.checked)}
              />
              نمایش صفحه‌بندی
            </label>
          </div>

          {String(p.layout || 'grid') !== 'list' && (
            <ResponsiveColumnsFields
              props={p}
              onChange={onChange}
              defaults={{ mobile: 1, tablet: 2, desktop: 3 }}
            />
          )}

          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showSearch === true}
              onChange={(e) => set('showSearch', e.target.checked)}
            />
            نمایش جستجوی زنده برای کاربر
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showCategories === true}
              onChange={(e) => set('showCategories', e.target.checked)}
            />
            نمایش فیلتر دسته‌ها برای کاربر
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showExcerpt !== false}
              onChange={(e) => set('showExcerpt', e.target.checked)}
            />
            نمایش چکیده
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showCategoryBadge !== false}
              onChange={(e) => set('showCategoryBadge', e.target.checked)}
            />
            نمایش نشان دسته
          </label>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            فقط مقالات با وضعیت «منتشر شده» نمایش داده می‌شوند. کوئری پیش‌فرض قبل از فیلترهای زنده کاربر اعمال می‌شود.
          </p>
        </div>
      );

    case 'imageCarousel': {
      const slides = (Array.isArray(p.slides) ? p.slides : []) as {
        image: string;
        caption?: string;
      }[];
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.autoplay !== false}
              onChange={(e) => set('autoplay', e.target.checked)}
            />
            پخش خودکار
          </label>
          <TextInput
            label="فاصله تعویض (میلی‌ثانیه)"
            value={String(p.intervalMs ?? 4500)}
            onChange={(v) => set('intervalMs', Number(v) || 4500)}
          />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">نسبت تصویر</span>
            <select
              value={String(p.aspect || 'video')}
              onChange={(e) => set('aspect', e.target.value)}
              className={fieldClass}
            >
              <option value="video">۱۶:۹</option>
              <option value="wide">۲۱:۹ عریض</option>
              <option value="square">۱:۱ مربع</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showArrows !== false}
              onChange={(e) => set('showArrows', e.target.checked)}
            />
            فلش‌های قبلی/بعدی
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.showDots !== false}
              onChange={(e) => set('showDots', e.target.checked)}
            />
            نقاط اسلاید
          </label>
          {slides.map((slide, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/40">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold">اسلاید {idx + 1}</span>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold"
                  onClick={() => set('slides', slides.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <MediaField
                label="تصویر"
                value={slide.image || ''}
                onChange={(v) => set('slides', updateItemArray(slides, idx, { image: v }))}
                accept="image"
                aspect="video"
              />
              <TextInput
                label="عنوان روی تصویر"
                value={slide.caption || ''}
                onChange={(v) => set('slides', updateItemArray(slides, idx, { caption: v }))}
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() => set('slides', [...slides, { image: '', caption: '' }])}
          >
            + افزودن اسلاید
          </button>
        </div>
      );
    }

    case 'videoPlayer':
      return (
        <div className="space-y-3">
          <TextInput label="عنوان (اختیاری)" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">نوع منبع</span>
            <select
              value={String(p.sourceType || 'upload')}
              onChange={(e) => set('sourceType', e.target.value)}
              className={fieldClass}
            >
              <option value="upload">فایل آپلود / لینک مستقیم</option>
              <option value="embed">یوتیوب / آپارات</option>
            </select>
          </label>
          {String(p.sourceType || 'upload') === 'upload' ? (
            <MediaField
              label="ویدئو"
              value={String(p.videoUrl || '')}
              onChange={(v) => set('videoUrl', v)}
              accept="video"
              aspect="video"
            />
          ) : (
            <TextInput
              label="لینک یوتیوب یا آپارات"
              value={String(p.videoUrl || '')}
              onChange={(v) => set('videoUrl', v)}
            />
          )}
          <MediaField
            label="کاور (Poster)"
            value={String(p.posterImage || '')}
            onChange={(v) => set('posterImage', v)}
            accept="image"
            aspect="video"
          />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">نسبت تصویر</span>
            <select
              value={String(p.aspect || 'video')}
              onChange={(e) => set('aspect', e.target.value)}
              className={fieldClass}
            >
              <option value="video">۱۶:۹</option>
              <option value="wide">۲۱:۹</option>
              <option value="square">۱:۱</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.controls !== false}
              onChange={(e) => set('controls', e.target.checked)}
            />
            نمایش کنترل‌ها
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.autoplay === true}
              onChange={(e) => set('autoplay', e.target.checked)}
            />
            پخش خودکار
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={p.muted !== false}
              onChange={(e) => set('muted', e.target.checked)}
            />
            بی‌صدا
          </label>
        </div>
      );

    case 'icon':
      return <IconBlockSettings props={p} onChange={onChange} />;

    case 'iconList':
      return <IconListBlockSettings props={p} onChange={onChange} />;

    case 'button':
      return <ButtonBlockSettings props={p} onChange={onChange} />;

    case 'divider':
      return <DividerBlockSettings props={p} onChange={onChange} />;

    case 'spacer':
      return <SpacerBlockSettings props={p} onChange={onChange} />;

    case 'singleImage':
      return <SingleImageBlockSettings props={p} onChange={onChange} />;

    case 'imageGallery':
      return <ImageGalleryBlockSettings props={p} onChange={onChange} />;

    case 'googleMap':
      return (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">روش تعیین موقعیت</span>
            <select
              value={String(p.mode || 'coords')}
              onChange={(e) => set('mode', e.target.value)}
              className={fieldClass}
            >
              <option value="coords">مختصات (عرض و طول جغرافیایی)</option>
              <option value="address">آدرس متنی</option>
            </select>
          </label>
          {String(p.mode || 'coords') === 'address' ? (
            <TextInput
              label="آدرس"
              value={String(p.address || '')}
              onChange={(v) => set('address', v)}
              multiline
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">عرض جغرافیایی (lat)</span>
                <input
                  type="number"
                  step="any"
                  value={Number(p.lat) || 0}
                  onChange={(e) => set('lat', Number(e.target.value))}
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">طول جغرافیایی (lng)</span>
                <input
                  type="number"
                  step="any"
                  value={Number(p.lng) || 0}
                  onChange={(e) => set('lng', Number(e.target.value))}
                  className={fieldClass}
                />
              </label>
            </div>
          )}
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">
              زوم ({Number(p.zoom) || 15})
            </span>
            <input
              type="range"
              min={1}
              max={21}
              value={Number(p.zoom) || 15}
              onChange={(e) => set('zoom', Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">ارتفاع نقشه (پیکسل)</span>
            <input
              type="number"
              min={160}
              max={800}
              value={Number(p.height) || 360}
              onChange={(e) => set('height', Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">گردی گوشه‌ها</span>
            <input
              type="number"
              min={0}
              max={48}
              value={Number(p.borderRadius) || 24}
              onChange={(e) => set('borderRadius', Number(e.target.value))}
              className={fieldClass}
            />
          </label>
        </div>
      );

    case 'tabGallery': {
      const items = (Array.isArray(p.items) ? p.items : []) as Array<{
        id?: string;
        title: string;
        description: string;
        thumbnail: string;
        image: string;
      }>;
      return (
        <div className="space-y-3">
          <TextInput label="نشان (Badge)" value={String(p.badge || '')} onChange={(v) => set('badge', v)} />
          <TextInput label="عنوان" value={String(p.title || '')} onChange={(v) => set('title', v)} />
          <TextInput
            label="زیرعنوان"
            value={String(p.subtitle || '')}
            onChange={(v) => set('subtitle', v)}
            multiline
          />
          <TextInput
            label="متن راهنمای تب"
            value={String(p.tabHint || 'کلیک برای نمایش')}
            onChange={(v) => set('tabHint', v)}
          />
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 rounded-xl border border-outline-variant/20 space-y-2 bg-surface-container-low/50"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-black text-primary">تب {idx + 1}</p>
                <button
                  type="button"
                  className="text-[10px] font-bold text-rose-500"
                  onClick={() => set('items', items.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <TextInput
                label="عنوان تب"
                value={item.title || ''}
                onChange={(v) => set('items', updateItemArray(items, idx, { title: v }))}
              />
              <TextInput
                label="توضیح روی تصویر"
                value={item.description || ''}
                onChange={(v) => set('items', updateItemArray(items, idx, { description: v }))}
                multiline
              />
              <MediaField
                label="تصویر بندانگشتی تب"
                value={item.thumbnail || ''}
                onChange={(v) => set('items', updateItemArray(items, idx, { thumbnail: v }))}
                accept="image"
                aspect="square"
              />
              <MediaField
                label="تصویر اصلی"
                value={item.image || ''}
                onChange={(v) => {
                  const next = updateItemArray(items, idx, {
                    image: v,
                    thumbnail: item.thumbnail || v,
                  });
                  set('items', next);
                }}
                accept="image"
                aspect="video"
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
            onClick={() =>
              set('items', [
                ...items,
                {
                  id: `tg-${Date.now().toString(36)}`,
                  title: 'عنوان جدید',
                  description: 'توضیح کوتاه این بخش',
                  thumbnail: '',
                  image: '',
                },
              ])
            }
          >
            + افزودن تب
          </button>
        </div>
      );
    }

    case 'container': {
      const columnCount = Math.min(
        4,
        Math.max(1, Number(p.columnsDesktop ?? p.columnCount) || 2)
      );
      const columns = (Array.isArray(p.columns) ? p.columns : []) as Array<{
        id: string;
        blocks: ServiceBlock[];
      }>;
      const nestTypes: ServiceBlockType[] = [
        'richText',
        'htmlCode',
        'imageCarousel',
        'videoPlayer',
        'icon',
        'iconList',
        'button',
        'divider',
        'spacer',
        'singleImage',
        'imageGallery',
        'googleMap',
        'features',
        'highlights',
        'cta',
        'contactCards',
        'contactInfo',
      ];
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-on-surface-variant block">عرض کانتینر</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'contained', label: 'کانتینری', hint: 'پیش‌فرض ۱۴۰۰px' },
                  { value: 'full', label: 'تمام‌عرض', hint: 'عرض کامل صفحه' },
                ] as const
              ).map((opt) => {
                const active = String(p.widthMode || 'contained') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('widthMode', opt.value)}
                    className={`text-right rounded-xl border p-2.5 transition-all ${
                      active
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-outline-variant/40 hover:border-primary/30'
                    }`}
                  >
                    <p className="text-[11px] font-black text-on-surface">{opt.label}</p>
                    <p className="text-[10px] text-on-surface-variant">{opt.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
          {String(p.widthMode || 'contained') !== 'full' && (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                حداکثر عرض (پیکسل)
              </span>
              <input
                type="number"
                min={640}
                max={2400}
                step={20}
                value={Number(p.maxWidth) > 0 ? Number(p.maxWidth) : 1400}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  set('maxWidth', Number.isFinite(n) ? n : 1400);
                }}
                className={fieldClass}
                dir="ltr"
              />
              <span className="text-[10px] text-on-surface-variant">
                پیشنهادی: ۱۴۰۰ · محدوده ۶۴۰–۲۴۰۰
              </span>
            </label>
          )}
          <ResponsiveColumnsFields
            props={p}
            onChange={onChange}
            defaults={{ mobile: 1, tablet: 2, desktop: 2 }}
            desktopLabel="دسکتاپ / محتوا"
            onDesktopChange={(nextCount, nextProps) => {
              let nextCols = [...columns];
              while (nextCols.length < nextCount) {
                nextCols.push({
                  id: `col-${Date.now().toString(36)}-${nextCols.length}`,
                  blocks: [],
                });
              }
              nextCols = nextCols.slice(0, nextCount);
              onChange({ ...nextProps, columns: nextCols });
            }}
          />
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">فاصله ستون‌ها</span>
            <select
              value={String(p.gap || 'md')}
              onChange={(e) => set('gap', e.target.value)}
              className={fieldClass}
            >
              <option value="sm">کم</option>
              <option value="md">متوسط</option>
              <option value="lg">زیاد</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">حاشیه داخلی</span>
            <select
              value={String(p.padding || 'md')}
              onChange={(e) => set('padding', e.target.value)}
              className={fieldClass}
            >
              <option value="none">بدون</option>
              <option value="sm">کم</option>
              <option value="md">متوسط</option>
              <option value="lg">زیاد</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">پس‌زمینه</span>
            <select
              value={String(p.background || 'none')}
              onChange={(e) => set('background', e.target.value)}
              className={fieldClass}
            >
              <option value="none">شفاف</option>
              <option value="soft">سطح ملایم</option>
              <option value="white">کارت سفید</option>
            </select>
          </label>

          {Array.from({ length: columnCount }).map((_, colIdx) => {
            const col = columns[colIdx] || { id: `col-${colIdx}`, blocks: [] };
            return (
              <div
                key={col.id || colIdx}
                className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2"
              >
                <p className="text-[11px] font-black text-primary">ستون {colIdx + 1}</p>
                {(col.blocks || []).map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-surface-dim border border-outline-variant/20"
                  >
                    <button
                      type="button"
                      className="flex-1 text-right text-[11px] font-bold truncate"
                      onClick={() => onSelectNestedBlock?.(child.id)}
                    >
                      {BLOCK_LABELS[child.type] || child.type}
                    </button>
                    <button
                      type="button"
                      className="text-rose-500 text-[10px] font-bold"
                      onClick={() => onRemoveNestedBlock?.(colIdx, child.id)}
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <select
                  defaultValue=""
                  className={fieldClass}
                  onChange={(e) => {
                    const type = e.target.value as ServiceBlockType;
                    if (!type) return;
                    onAddNestedBlock?.(colIdx, type);
                    e.target.value = '';
                  }}
                >
                  <option value="">+ افزودن بلوک به این ستون</option>
                  {nestTypes.map((t) => (
                    <option key={t} value={t}>
                      {BLOCK_LABELS[t] || t}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return <p className="text-xs text-on-surface-variant">تنظیماتی برای این بلوک تعریف نشده.</p>;
  }
};
