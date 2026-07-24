import React from 'react';
import { SPACER_PRESETS, clampSpacerPx, type SpacerPreset } from '../../lib/spacerBlock';

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

function PresetPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: SpacerPreset) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {SPACER_PRESETS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-1.5 py-2 text-center transition-all ${
              active
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-outline-variant/40 hover:border-primary/30'
            }`}
          >
            <p className="text-[10px] font-black text-on-surface leading-tight">{opt.label}</p>
            {opt.value !== 'custom' && (
              <p className="text-[9px] text-on-surface-variant mt-0.5" dir="ltr">
                {opt.px}px
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SpacerBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const linked = props.linked !== false;
  const size = String(props.size || 'md');
  const responsive = props.responsive === true;

  const totalPreview = (() => {
    if (linked) {
      const px =
        size === 'custom'
          ? clampSpacerPx(Number(props.height) || 40)
          : SPACER_PRESETS.find((p) => p.value === size)?.px ?? 32;
      return px * 2;
    }
    const top =
      String(props.sizeTop || 'md') === 'custom'
        ? clampSpacerPx(Number(props.paddingTop) || 32)
        : SPACER_PRESETS.find((p) => p.value === String(props.sizeTop || 'md'))?.px ?? 32;
    const bottom =
      String(props.sizeBottom || 'md') === 'custom'
        ? clampSpacerPx(Number(props.paddingBottom) || 32)
        : SPACER_PRESETS.find((p) => p.value === String(props.sizeBottom || 'md'))?.px ?? 32;
    return top + bottom;
  })();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-on-surface">پیش‌نمایش فاصله</p>
          <p className="text-[10px] text-on-surface-variant">
            مجموع پدینگ بالا و پایین در دسکتاپ
          </p>
        </div>
        <span className="text-sm font-black text-primary shrink-0" dir="ltr">
          {totalPreview}px
        </span>
      </div>

      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={linked}
          onChange={(e) => set('linked', e.target.checked)}
        />
        فاصله بالا و پایین یکسان باشد
      </label>

      {linked ? (
        <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
          <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">height</span>
            اندازه فاصله (هر طرف)
          </p>
          <PresetPicker
            value={size}
            onChange={(v) => {
              const next: Record<string, unknown> = { ...props, size: v };
              if (v !== 'custom') {
                const px = SPACER_PRESETS.find((p) => p.value === v)?.px ?? 32;
                next.height = px;
              }
              onChange(next);
            }}
          />
          {size === 'custom' && (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">
                پدینگ هر طرف ({clampSpacerPx(Number(props.height) || 40)}px)
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={clampSpacerPx(Number(props.height) || 40)}
                onChange={(e) => set('height', Number(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                min={0}
                max={400}
                value={clampSpacerPx(Number(props.height) || 40)}
                onChange={(e) => set('height', clampSpacerPx(Number(e.target.value)))}
                className={fieldClass}
                dir="ltr"
              />
            </label>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
            <p className="text-[11px] font-black text-on-surface">فاصله از بالا (padding-top)</p>
            <PresetPicker
              value={String(props.sizeTop || 'md')}
              onChange={(v) => {
                const next: Record<string, unknown> = { ...props, sizeTop: v };
                if (v !== 'custom') {
                  next.paddingTop = SPACER_PRESETS.find((p) => p.value === v)?.px ?? 32;
                }
                onChange(next);
              }}
            />
            {String(props.sizeTop || 'md') === 'custom' && (
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">
                  مقدار بالا ({clampSpacerPx(Number(props.paddingTop) || 32)}px)
                </span>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={clampSpacerPx(Number(props.paddingTop) || 32)}
                  onChange={(e) => set('paddingTop', Number(e.target.value))}
                  className="w-full"
                />
              </label>
            )}
          </div>

          <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
            <p className="text-[11px] font-black text-on-surface">فاصله از پایین (padding-bottom)</p>
            <PresetPicker
              value={String(props.sizeBottom || 'md')}
              onChange={(v) => {
                const next: Record<string, unknown> = { ...props, sizeBottom: v };
                if (v !== 'custom') {
                  next.paddingBottom = SPACER_PRESETS.find((p) => p.value === v)?.px ?? 32;
                }
                onChange(next);
              }}
            />
            {String(props.sizeBottom || 'md') === 'custom' && (
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">
                  مقدار پایین ({clampSpacerPx(Number(props.paddingBottom) || 32)}px)
                </span>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={clampSpacerPx(Number(props.paddingBottom) || 32)}
                  onChange={(e) => set('paddingBottom', Number(e.target.value))}
                  className="w-full"
                />
              </label>
            )}
          </div>
        </>
      )}

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={responsive}
            onChange={(e) => set('responsive', e.target.checked)}
          />
          اندازه جدا برای موبایل / تبلت / دسکتاپ
        </label>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          اگر فعال باشد، روی موبایل و تبلت می‌توانید فاصله کوچک‌تری بگذارید.
        </p>

        {responsive && (
          <div className="grid grid-cols-1 gap-2 pt-1">
            {(
              [
                { key: 'heightMobile', label: 'موبایل', icon: 'smartphone', fallback: 24 },
                { key: 'heightTablet', label: 'تبلت', icon: 'tablet_mac', fallback: 32 },
                { key: 'heightDesktop', label: 'دسکتاپ', icon: 'computer', fallback: 40 },
              ] as const
            ).map((row) => (
              <label key={row.key} className="block space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">{row.icon}</span>
                  {row.label} — پدینگ هر طرف (px)
                </span>
                <input
                  type="number"
                  min={0}
                  max={400}
                  value={
                    Number(props[row.key]) > 0
                      ? Number(props[row.key])
                      : linked
                        ? size === 'custom'
                          ? clampSpacerPx(Number(props.height) || row.fallback)
                          : SPACER_PRESETS.find((p) => p.value === size)?.px ?? row.fallback
                        : row.fallback
                  }
                  onChange={(e) => set(row.key, clampSpacerPx(Number(e.target.value)))}
                  className={fieldClass}
                  dir="ltr"
                />
              </label>
            ))}
            <p className="text-[9px] text-on-surface-variant">
              در حالت ریسپانسیو، مقادیر بالا/پایین یکسان (هر طرف) اعمال می‌شود.
            </p>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={props.showGuide !== false}
          onChange={(e) => set('showGuide', e.target.checked)}
        />
        نمایش راهنما در صفحه‌ساز (خط‌چین)
      </label>
    </div>
  );
}
