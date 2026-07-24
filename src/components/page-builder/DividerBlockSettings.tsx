import React from 'react';
import { DIVIDER_LINE_STYLES } from '../../lib/dividerLine';
import { filterMaterialIcons } from '../../lib/materialIcons';

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-on-surface-variant">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

function ItemIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const icons = React.useMemo(() => filterMaterialIcons(query, 48), [query]);
  const current = value || 'auto_awesome';

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
          placeholder="auto_awesome"
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

export function DividerBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const widthMode = String(props.widthMode || 'full');
  const contentMode = String(props.contentMode || 'none');
  const lineStyle = String(props.lineStyle || 'solid');
  const color = String(props.color || 'outline');
  const textColor = String(props.textColor || 'muted');
  const hasContent = contentMode !== 'none';

  return (
    <div className="space-y-4">
      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">straighten</span>
          هندسه خط
        </p>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">عرض خط</span>
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
              درصد عرض ({Number(props.widthPercent) || 100}٪)
            </span>
            <input
              type="range"
              min={10}
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
              min={40}
              max={2000}
              step={10}
              value={Number(props.widthPx) || 280}
              onChange={(e) => set('widthPx', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            ضخامت ({Number(props.thickness) || 2}px)
          </span>
          <input
            type="range"
            min={1}
            max={16}
            value={Number(props.thickness) || 2}
            onChange={(e) => set('thickness', Number(e.target.value))}
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

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">جهت</span>
          <select
            value={String(props.orientation || 'horizontal')}
            onChange={(e) => set('orientation', e.target.value)}
            className={fieldClass}
          >
            <option value="horizontal">افقی</option>
            <option value="vertical">عمودی</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">فاصله عمودی</span>
          <select
            value={String(props.spacing || 'md')}
            onChange={(e) => set('spacing', e.target.value)}
            className={fieldClass}
          >
            <option value="none">بدون فاصله</option>
            <option value="sm">کم</option>
            <option value="md">متوسط</option>
            <option value="lg">زیاد</option>
            <option value="xl">خیلی زیاد</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-black text-on-surface">نوع خط</p>
        <div className="grid grid-cols-2 gap-1.5">
          {DIVIDER_LINE_STYLES.map((opt) => {
            const active = lineStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('lineStyle', opt.value)}
                className={`text-right rounded-xl border p-2 transition-all ${
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-outline-variant/40 hover:border-primary/30'
                }`}
              >
                <div
                  className="mb-1.5 h-0 w-full"
                  style={{
                    borderTopWidth: opt.value === 'double' ? 4 : 2,
                    borderTopStyle: opt.value === 'soft' ? 'solid' : opt.value,
                    borderTopColor: active ? 'var(--color-primary, #0f766e)' : '#94a3b8',
                    opacity: opt.value === 'soft' ? 0.55 : 1,
                  }}
                />
                <p className="text-[11px] font-black text-on-surface">{opt.label}</p>
                <p className="text-[9px] text-on-surface-variant leading-snug">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface">رنگ و تزئین</p>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">رنگ خط</span>
          <select
            value={color}
            onChange={(e) => set('color', e.target.value)}
            className={fieldClass}
          >
            <option value="outline">حاشیه (پیش‌فرض)</option>
            <option value="primary">اصلی</option>
            <option value="muted">کم‌رنگ</option>
            <option value="onSurface">متن</option>
            <option value="emerald">سبز</option>
            <option value="rose">صورتی</option>
            <option value="amber">کهربایی</option>
            <option value="custom">سفارشی</option>
          </select>
        </label>
        {color === 'custom' && (
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">کد رنگ</span>
            <input
              type="color"
              value={String(props.customColor || '#94a3b8')}
              onChange={(e) => set('customColor', e.target.value)}
              className="w-full h-9 rounded-xl border border-outline-variant/30 bg-surface-container-low cursor-pointer"
            />
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">سرِ خط</span>
          <select
            value={String(props.endCap || 'none')}
            onChange={(e) => set('endCap', e.target.value)}
            className={fieldClass}
          >
            <option value="none">بدون سر</option>
            <option value="dot">نقطه</option>
            <option value="diamond">لوزی</option>
            <option value="bar">میله</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={props.fadeEnds === true}
            onChange={(e) => set('fadeEnds', e.target.checked)}
          />
          محو شدن دو سر خط
        </label>
      </div>

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">title</span>
          متن و آیکون
        </p>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">محتوای روی خط</span>
          <select
            value={contentMode}
            onChange={(e) => set('contentMode', e.target.value)}
            className={fieldClass}
          >
            <option value="none">فقط خط</option>
            <option value="text">فقط متن</option>
            <option value="icon">فقط آیکون</option>
            <option value="iconText">آیکون + متن</option>
          </select>
        </label>

        {hasContent && (
          <>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">جایگاه محتوا</span>
              <select
                value={String(props.contentPlacement || 'center')}
                onChange={(e) => set('contentPlacement', e.target.value)}
                className={fieldClass}
              >
                <option value="center">وسط خط</option>
                <option value="start">کنار خط (ابتدا)</option>
                <option value="end">کنار خط (انتها)</option>
                <option value="above">روی خط (بالا)</option>
                <option value="below">زیر خط</option>
              </select>
            </label>

            {(contentMode === 'text' || contentMode === 'iconText') && (
              <TextInput
                label="متن"
                value={String(props.text || '')}
                onChange={(v) => set('text', v)}
              />
            )}

            {(contentMode === 'icon' || contentMode === 'iconText') && (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant">آیکون</span>
                  <ItemIconPicker
                    value={String(props.icon || 'auto_awesome')}
                    onChange={(icon) => set('icon', icon)}
                  />
                </div>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    اندازه آیکون ({Number(props.iconSize) || 18}px)
                  </span>
                  <input
                    type="range"
                    min={12}
                    max={36}
                    value={Number(props.iconSize) || 18}
                    onChange={(e) => set('iconSize', Number(e.target.value))}
                    className="w-full"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={props.iconFilled === true}
                    onChange={(e) => set('iconFilled', e.target.checked)}
                  />
                  آیکون توپُر
                </label>
              </>
            )}

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                فاصله محتوا تا خط ({Number(props.contentGap) || 12}px)
              </span>
              <input
                type="range"
                min={4}
                max={32}
                value={Number(props.contentGap) || 12}
                onChange={(e) => set('contentGap', Number(e.target.value))}
                className="w-full"
              />
            </label>

            {(contentMode === 'text' || contentMode === 'iconText') && (
              <>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">اندازه متن</span>
                  <select
                    value={String(props.textSize || 'sm')}
                    onChange={(e) => set('textSize', e.target.value)}
                    className={fieldClass}
                  >
                    <option value="xs">خیلی کوچک</option>
                    <option value="sm">کوچک</option>
                    <option value="md">متوسط</option>
                    <option value="lg">بزرگ</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">وزن متن</span>
                  <select
                    value={String(props.textWeight || 'bold')}
                    onChange={(e) => set('textWeight', e.target.value)}
                    className={fieldClass}
                  >
                    <option value="medium">متوسط</option>
                    <option value="bold">ضخیم</option>
                    <option value="black">خیلی ضخیم</option>
                  </select>
                </label>
              </>
            )}

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">رنگ متن/آیکون</span>
              <select
                value={textColor}
                onChange={(e) => set('textColor', e.target.value)}
                className={fieldClass}
              >
                <option value="muted">کم‌رنگ</option>
                <option value="onSurface">متن</option>
                <option value="primary">اصلی</option>
                <option value="emerald">سبز</option>
                <option value="rose">صورتی</option>
                <option value="amber">کهربایی</option>
                <option value="custom">سفارشی</option>
              </select>
            </label>
            {textColor === 'custom' && (
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">کد رنگ متن</span>
                <input
                  type="color"
                  value={String(props.textCustomColor || '#64748b')}
                  onChange={(e) => set('textCustomColor', e.target.value)}
                  className="w-full h-9 rounded-xl border border-outline-variant/30 bg-surface-container-low cursor-pointer"
                />
              </label>
            )}

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">پس‌زمینه برچسب</span>
              <select
                value={String(props.labelSurface || 'auto')}
                onChange={(e) => set('labelSurface', e.target.value)}
                className={fieldClass}
              >
                <option value="auto">خودکار (پس‌زمینه صفحه)</option>
                <option value="white">سفید</option>
                <option value="transparent">شفاف</option>
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
