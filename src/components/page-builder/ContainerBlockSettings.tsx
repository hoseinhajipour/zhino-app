import React from 'react';
import type { ServiceBlockType } from '../../types';
import { BLOCK_LABELS, NESTABLE_WIDGET_TYPES } from '../../lib/landingToBlocks';
import {
  createEmptyColumn,
  defaultWidthValueForMode,
  normalizeContainerColumn,
  type ColumnWidthMode,
  type ContainerColumn,
} from '../../lib/containerColumn';
import { MediaField } from '../media/MediaField';

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
        <span className="material-symbols-outlined text-primary text-base">grid_view</span>
        ستون‌ها در هر دستگاه
      </p>
      <p className="text-[10px] text-on-surface-variant leading-relaxed">
        در پیش‌نمایش صفحه‌ساز، دکمه موبایل/تبلت/دسکتاپ همان تعداد ستون همان دستگاه را نشان می‌دهد (نه عرض
        واقعی کادر).
      </p>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">موبایل</span>
        <select
          value={mobile}
          onChange={(e) => onChange({ ...props, columnsMobile: Number(e.target.value) })}
          className={fieldClass}
        >
          {options}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">تبلت</span>
        <select
          value={tablet}
          onChange={(e) => onChange({ ...props, columnsTablet: Number(e.target.value) })}
          className={fieldClass}
        >
          {options}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">{desktopLabel}</span>
        <select
          value={desktop}
          onChange={(e) => {
            const next = Number(e.target.value);
            const nextProps = { ...props, columnsDesktop: next, columnCount: next };
            if (onDesktopChange) onDesktopChange(next, nextProps);
            else onChange(nextProps);
          }}
          className={fieldClass}
        >
          {options}
        </select>
      </label>
    </div>
  );
}

export function ContainerBlockSettings({
  props: p,
  onChange,
  onAddNestedBlock,
  onRemoveNestedBlock,
  onMoveNestedBlock,
  onSelectNestedBlock,
  selectedColumnId,
  onSelectColumn,
  onUpdateColumn,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
  onAddNestedBlock?: (columnIndex: number, type: ServiceBlockType) => void;
  onRemoveNestedBlock?: (columnIndex: number, blockId: string) => void;
  onMoveNestedBlock?: (
    fromCol: number,
    fromIndex: number,
    toCol: number,
    toIndex: number
  ) => void;
  onSelectNestedBlock?: (blockId: string | null) => void;
  selectedColumnId?: string | null;
  onSelectColumn?: (columnId: string) => void;
  onUpdateColumn?: (patch: Partial<ContainerColumn>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...p, [key]: value });
  const columnCount = Math.min(4, Math.max(1, Number(p.columnsDesktop ?? p.columnCount) || 2));
  const rawColumns = Array.isArray(p.columns) ? p.columns : [];
  const columns: ContainerColumn[] = Array.from({ length: columnCount }, (_, i) =>
    normalizeContainerColumn(rawColumns[i], i)
  );
  const nestTypes: ServiceBlockType[] = [...NESTABLE_WIDGET_TYPES];
  const selectedColIdx = selectedColumnId
    ? columns.findIndex((c) => c.id === selectedColumnId)
    : -1;
  const selectedCol = selectedColIdx >= 0 ? columns[selectedColIdx] : null;

  if (selectedCol && onUpdateColumn) {
    const widthMode = (selectedCol.widthMode || 'auto') as ColumnWidthMode;
    const colBlocks = selectedCol.blocks || [];
    return (
      <div className="space-y-3">
        <div className="space-y-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <p className="text-[11px] font-black text-primary">ظاهر ستون {selectedColIdx + 1}</p>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">عرض ستون</span>
            <select
              value={widthMode}
              onChange={(e) => {
                const mode = e.target.value as ColumnWidthMode;
                onUpdateColumn({
                  widthMode: mode,
                  widthValue: defaultWidthValueForMode(mode),
                });
              }}
              className={fieldClass}
            >
              <option value="auto">خودکار (مساوی)</option>
              <option value="px">پیکسل (px)</option>
              <option value="vw">عرض ویوپورت (vw)</option>
              <option value="percent">درصد (%)</option>
            </select>
          </label>

          {widthMode !== 'auto' && (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                مقدار عرض
                {widthMode === 'px' ? ' (px)' : widthMode === 'vw' ? ' (vw)' : ' (%)'}
              </span>
              <input
                type="number"
                min={widthMode === 'px' ? 40 : 5}
                max={widthMode === 'px' ? 2000 : 100}
                value={Number(selectedCol.widthValue) || defaultWidthValueForMode(widthMode)}
                onChange={(e) => onUpdateColumn({ widthValue: Number(e.target.value) })}
                className={fieldClass}
                dir="ltr"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">پدینگ عمودی</span>
              <input
                type="number"
                min={0}
                max={120}
                value={selectedCol.paddingY || 0}
                onChange={(e) => onUpdateColumn({ paddingY: Number(e.target.value) })}
                className={fieldClass}
                dir="ltr"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">پدینگ افقی</span>
              <input
                type="number"
                min={0}
                max={120}
                value={selectedCol.paddingX || 0}
                onChange={(e) => onUpdateColumn({ paddingX: Number(e.target.value) })}
                className={fieldClass}
                dir="ltr"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">مارجین بالا</span>
              <input
                type="number"
                min={0}
                max={160}
                value={selectedCol.marginTop || 0}
                onChange={(e) => onUpdateColumn({ marginTop: Number(e.target.value) })}
                className={fieldClass}
                dir="ltr"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">مارجین پایین</span>
              <input
                type="number"
                min={0}
                max={160}
                value={selectedCol.marginBottom || 0}
                onChange={(e) => onUpdateColumn({ marginBottom: Number(e.target.value) })}
                className={fieldClass}
                dir="ltr"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">مارجین افقی</span>
              <input
                type="number"
                min={0}
                max={80}
                value={selectedCol.marginX || 0}
                onChange={(e) => onUpdateColumn({ marginX: Number(e.target.value) })}
                className={fieldClass}
                dir="ltr"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">رنگ پس‌زمینه</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(String(selectedCol.backgroundColor || ''))
                    ? String(selectedCol.backgroundColor)
                    : '#ffffff'
                }
                onChange={(e) => onUpdateColumn({ backgroundColor: e.target.value })}
                className="h-9 w-12 rounded-lg border border-outline-variant/30 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={String(selectedCol.backgroundColor || '')}
                onChange={(e) => onUpdateColumn({ backgroundColor: e.target.value })}
                className={fieldClass}
                dir="ltr"
                placeholder="خالی = شفاف"
              />
              {selectedCol.backgroundColor ? (
                <button
                  type="button"
                  className="text-[10px] font-bold text-rose-500 shrink-0"
                  onClick={() => onUpdateColumn({ backgroundColor: '' })}
                >
                  پاک
                </button>
              ) : null}
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">
              گردی گوشه ({selectedCol.borderRadius || 0}px)
            </span>
            <input
              type="range"
              min={0}
              max={64}
              value={selectedCol.borderRadius || 0}
              onChange={(e) => onUpdateColumn({ borderRadius: Number(e.target.value) })}
              className="w-full"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">تراز افقی محتوا</span>
            <select
              value={selectedCol.alignH || 'stretch'}
              onChange={(e) =>
                onUpdateColumn({ alignH: e.target.value as ContainerColumn['alignH'] })
              }
              className={fieldClass}
            >
              <option value="stretch">کشیده (تمام عرض)</option>
              <option value="start">راست</option>
              <option value="center">وسط</option>
              <option value="end">چپ</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">تراز عمودی محتوا</span>
            <select
              value={selectedCol.alignV || 'start'}
              onChange={(e) =>
                onUpdateColumn({ alignV: e.target.value as ContainerColumn['alignV'] })
              }
              className={fieldClass}
            >
              <option value="start">بالا</option>
              <option value="center">وسط</option>
              <option value="end">پایین</option>
              <option value="stretch">توزیع‌شده</option>
            </select>
          </label>
        </div>

        <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20">
          <p className="text-[11px] font-black text-on-surface">ویجت‌های این ستون</p>
          {colBlocks.map((child) => (
            <div
              key={child.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant/20"
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
                onClick={() => onRemoveNestedBlock?.(selectedColIdx, child.id)}
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
              onAddNestedBlock?.(selectedColIdx, type);
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
      </div>
    );
  }

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
          <span className="text-[11px] font-bold text-on-surface-variant">حداکثر عرض (پیکسل)</span>
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
        </label>
      )}
      <ResponsiveColumnsFields
        props={p}
        onChange={onChange}
        defaults={{ mobile: 1, tablet: 2, desktop: 2 }}
        desktopLabel="دسکتاپ / محتوا"
        onDesktopChange={(nextCount, nextProps) => {
          let nextCols = [...columns];
          while (nextCols.length < nextCount) nextCols.push(createEmptyColumn());
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

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-on-surface-variant block">
          جهت نمایش ستون‌ها
        </span>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          مقدار پیش‌فرض (دسکتاپ). برای موبایل و تبلت از تب «ریسپانسیو» استفاده کنید.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                value: 'row',
                label: 'افقی ←',
                hint: 'راست به چپ',
                icon: 'arrow_back',
              },
              {
                value: 'row-reverse',
                label: 'افقی →',
                hint: 'چپ به راست',
                icon: 'arrow_forward',
              },
              {
                value: 'column',
                label: 'بالا به پایین',
                hint: 'ستونی از بالا',
                icon: 'arrow_downward',
              },
              {
                value: 'column-reverse',
                label: 'پایین به بالا',
                hint: 'ستونی از پایین',
                icon: 'arrow_upward',
              },
            ] as const
          ).map((opt) => {
            const active = String(p.columnsDirection || 'row') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('columnsDirection', opt.value)}
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
          <span className="material-symbols-outlined text-primary text-base">palette</span>
          ظاهر کانتینر
        </p>
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
            <option value="color">رنگ سفارشی</option>
            <option value="image">تصویر</option>
          </select>
        </label>
        {String(p.background) === 'color' && (
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">رنگ پس‌زمینه</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(String(p.backgroundColor || ''))
                    ? String(p.backgroundColor)
                    : '#f1f5f9'
                }
                onChange={(e) => set('backgroundColor', e.target.value)}
                className="h-9 w-12 rounded-lg border border-outline-variant/30 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={String(p.backgroundColor || '#f1f5f9')}
                onChange={(e) => set('backgroundColor', e.target.value)}
                className={fieldClass}
                dir="ltr"
              />
            </div>
          </label>
        )}
        {String(p.background) === 'image' && (
          <div className="space-y-2">
            <MediaField
              label="تصویر پس‌زمینه"
              value={String(p.backgroundImage || '')}
              onChange={(v) => set('backgroundImage', v)}
              accept="image"
              aspect="video"
            />
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                تیرگی لایه ({Number(p.backgroundOverlay ?? 40)}٪)
              </span>
              <input
                type="range"
                min={0}
                max={80}
                value={Number(p.backgroundOverlay ?? 40)}
                onChange={(e) => set('backgroundOverlay', Number(e.target.value))}
                className="w-full"
              />
            </label>
          </div>
        )}
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            حاشیه داخلی (پیش‌فرض دسکتاپ)
          </span>
          <select
            value={String(p.padding || 'md')}
            onChange={(e) => {
              const next = e.target.value;
              const presetPx: Record<string, number> = { none: 0, sm: 12, md: 20, lg: 32 };
              if (next !== 'custom' && next in presetPx) {
                onChange({
                  ...p,
                  padding: next,
                  paddingX: presetPx[next],
                  paddingY: presetPx[next],
                });
                return;
              }
              set('padding', next);
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
        {String(p.padding) === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant">عمودی</span>
              <input
                type="number"
                min={0}
                max={120}
                value={Number(p.paddingY) || 0}
                onChange={(e) => set('paddingY', Number(e.target.value))}
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
                value={Number(p.paddingX) || 0}
                onChange={(e) => set('paddingX', Number(e.target.value))}
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
              value={Number(p.marginTop) || 0}
              onChange={(e) => set('marginTop', Number(e.target.value))}
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
              value={Number(p.marginBottom) || 0}
              onChange={(e) => set('marginBottom', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </label>
        </div>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          پدینگ و مارجین جدا برای موبایل/تبلت را در تب «ریسپانسیو» تنظیم کنید.
        </p>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            گردی گوشه ({Number.isFinite(Number(p.borderRadius)) ? Number(p.borderRadius) : 28}px)
          </span>
          <input
            type="range"
            min={0}
            max={64}
            value={Number.isFinite(Number(p.borderRadius)) ? Number(p.borderRadius) : 28}
            onChange={(e) => set('borderRadius', Number(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">سایه</span>
          <select
            value={String(p.shadow ?? (String(p.background || 'none') === 'white' ? 'md' : 'none'))}
            onChange={(e) => set('shadow', e.target.value)}
            className={fieldClass}
          >
            <option value="none">بدون سایه</option>
            <option value="sm">کم</option>
            <option value="md">متوسط</option>
            <option value="lg">زیاد</option>
          </select>
        </label>
      </div>

      <p className="text-[10px] text-on-surface-variant font-bold">
        برای تنظیم هر ستون، روی آن در پیش‌نمایش کلیک کنید یا «تنظیمات ستون» را بزنید.
      </p>

      {columns.map((col, colIdx) => {
        const colBlocks = col.blocks || [];
        const isSelected = selectedColumnId === col.id;
        return (
          <div
            key={col.id || colIdx}
            className={`p-3 rounded-xl border space-y-2 ${
              isSelected ? 'border-teal-500 bg-teal-50/50' : 'border-primary/20 bg-primary/5'
            }`}
            onDragOver={(e) => {
              if (!onMoveNestedBlock) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              const raw = e.dataTransfer.getData('application/x-zhino-nested');
              if (!raw || !onMoveNestedBlock) return;
              e.preventDefault();
              try {
                const payload = JSON.parse(raw) as { columnIndex: number; blockIndex: number };
                onMoveNestedBlock(payload.columnIndex, payload.blockIndex, colIdx, colBlocks.length);
              } catch {
                /* ignore */
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-[11px] font-black text-primary hover:underline"
                onClick={() => onSelectColumn?.(col.id)}
              >
                ستون {colIdx + 1}
                {(col.widthMode || 'auto') !== 'auto'
                  ? ` · ${col.widthValue}${col.widthMode === 'percent' ? '%' : col.widthMode}`
                  : ''}
              </button>
              <button
                type="button"
                className="text-[10px] font-bold text-teal-700 bg-white/80 px-2 py-1 rounded-lg border border-teal-200"
                onClick={() => onSelectColumn?.(col.id)}
              >
                تنظیمات ستون
              </button>
            </div>
            {colBlocks.map((child, childIndex) => (
              <div
                key={child.id}
                draggable={Boolean(onMoveNestedBlock)}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/x-zhino-nested',
                    JSON.stringify({ columnIndex: colIdx, blockIndex: childIndex })
                  );
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (!onMoveNestedBlock) return;
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  const raw = e.dataTransfer.getData('application/x-zhino-nested');
                  if (!raw || !onMoveNestedBlock) return;
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const payload = JSON.parse(raw) as { columnIndex: number; blockIndex: number };
                    onMoveNestedBlock(payload.columnIndex, payload.blockIndex, colIdx, childIndex);
                  } catch {
                    /* ignore */
                  }
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-surface-dim border border-outline-variant/20 cursor-grab active:cursor-grabbing"
              >
                <span className="material-symbols-outlined text-base text-outline-variant shrink-0">
                  drag_indicator
                </span>
                <button
                  type="button"
                  className="flex-1 text-right text-[11px] font-bold truncate"
                  onClick={() => onSelectNestedBlock?.(child.id)}
                >
                  {BLOCK_LABELS[child.type] || child.type}
                </button>
                <button
                  type="button"
                  className="text-rose-500 text-[10px] font-bold px-1"
                  onClick={() => onRemoveNestedBlock?.(colIdx, child.id)}
                >
                  حذف
                </button>
              </div>
            ))}
            {!colBlocks.length && (
              <p className="text-[10px] text-on-surface-variant text-center py-3 border border-dashed border-outline-variant/30 rounded-lg">
                هنوز ویجتی نیست
              </p>
            )}
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
