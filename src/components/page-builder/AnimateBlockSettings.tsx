import React from 'react';
import {
  BLOCK_SCROLL_ANIMATIONS,
  normalizeBlockScrollAnimation,
} from '../../lib/blockScrollAnimation';

interface AnimateBlockSettingsProps {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}

export const AnimateBlockSettings: React.FC<AnimateBlockSettingsProps> = ({
  props,
  onChange,
}) => {
  const enabled = Boolean(props.animateEnabled);
  const type = normalizeBlockScrollAnimation(props.animateType);

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 space-y-3">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">animation</span>
          انیمیشن نمایش
        </p>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          وقتی کاربر اسکرول کند و این ویجت وارد نمای صفحه شود، انیمیشن اجرا می‌شود.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange({ ...props, animateEnabled: e.target.checked })}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="text-xs font-bold text-on-surface">فعال‌سازی انیمیشن</span>
        </label>

        <label className={`block space-y-1.5 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <span className="text-[10px] font-bold text-on-surface-variant">نحوه نمایش</span>
          <select
            value={type}
            disabled={!enabled}
            onChange={(e) =>
              onChange({
                ...props,
                animateType: e.target.value as typeof type,
              })
            }
            className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary disabled:cursor-not-allowed"
          >
            {BLOCK_SCROLL_ANIMATIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
