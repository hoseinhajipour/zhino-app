/** Professional divider / decorative line helpers for the page builder. */

export type DividerLineStyle =
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'soft';

export type DividerContentPlacement = 'center' | 'start' | 'end' | 'above' | 'below';

export type DividerContentMode = 'none' | 'text' | 'icon' | 'iconText';

export type DividerWidthMode = 'full' | 'percent' | 'px';

export type DividerEndCap = 'none' | 'dot' | 'diamond' | 'bar';

export const DIVIDER_LINE_STYLES: Array<{ value: DividerLineStyle; label: string; hint: string }> = [
  { value: 'solid', label: 'ساده', hint: 'خط ممتد کلاسیک' },
  { value: 'dashed', label: 'خط‌چین', hint: 'قطعات هم‌فاصله' },
  { value: 'dotted', label: 'نقطه‌چین', hint: 'نقاط ریز پشت‌سرهم' },
  { value: 'double', label: 'دوبل', hint: 'دو خط موازی' },
  { value: 'groove', label: 'حفره‌ای', hint: 'لبه فرورفته سه‌بعدی' },
  { value: 'ridge', label: 'برجسته', hint: 'لبه برآمده سه‌بعدی' },
  { value: 'soft', label: 'محو', hint: 'گرادیان محو از وسط' },
];

export const DIVIDER_COLOR_CSS: Record<string, string> = {
  primary: 'var(--color-primary, #0f766e)',
  muted: 'color-mix(in srgb, var(--color-on-surface, #1e293b) 28%, transparent)',
  onSurface: 'var(--color-on-surface, #1e293b)',
  outline: 'color-mix(in srgb, var(--color-on-surface, #1e293b) 18%, transparent)',
  emerald: '#059669',
  rose: '#e11d48',
  amber: '#d97706',
};

export const DIVIDER_TEXT_COLOR_CLASS: Record<string, string> = {
  inherit: 'text-on-surface',
  primary: 'text-primary',
  muted: 'text-on-surface-variant',
  onSurface: 'text-on-surface',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  amber: 'text-amber-600',
};

export function resolveDividerColor(colorKey: string, customColor?: string): string {
  if (colorKey === 'custom' && customColor?.trim()) return customColor.trim();
  return DIVIDER_COLOR_CSS[colorKey] || DIVIDER_COLOR_CSS.outline;
}

export function resolveDividerWidth(
  mode: DividerWidthMode,
  percent: number,
  px: number
): string {
  if (mode === 'px') return `${Math.max(24, Math.min(2000, px || 240))}px`;
  if (mode === 'percent') return `${Math.max(5, Math.min(100, percent || 100))}%`;
  return '100%';
}

export function resolveDividerThickness(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 2;
  return Math.max(1, Math.min(24, Math.round(n)));
}

/** Border-style for CSS; soft is rendered as gradient instead. */
export function cssBorderStyle(style: DividerLineStyle): Exclude<DividerLineStyle, 'soft'> {
  if (style === 'soft') return 'solid';
  return style;
}

export function dividerSpacingClass(spacing: string): string {
  switch (spacing) {
    case 'none':
      return 'my-0';
    case 'sm':
      return 'my-2';
    case 'lg':
      return 'my-8';
    case 'xl':
      return 'my-12';
    default:
      return 'my-5';
  }
}

export function dividerTextSizeClass(size: string): string {
  switch (size) {
    case 'xs':
      return 'text-[10px]';
    case 'md':
      return 'text-sm';
    case 'lg':
      return 'text-base';
    default:
      return 'text-xs';
  }
}

export function dividerTextWeightClass(weight: string): string {
  switch (weight) {
    case 'medium':
      return 'font-medium';
    case 'black':
      return 'font-black';
    default:
      return 'font-bold';
  }
}
