/** Vertical spacer / gap helpers for the page builder. */

export type SpacerPreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

export const SPACER_PRESETS: Array<{ value: SpacerPreset; label: string; px: number }> = [
  { value: 'xs', label: 'خیلی کم', px: 8 },
  { value: 'sm', label: 'کم', px: 16 },
  { value: 'md', label: 'متوسط', px: 32 },
  { value: 'lg', label: 'زیاد', px: 48 },
  { value: 'xl', label: 'خیلی زیاد', px: 72 },
  { value: '2xl', label: 'عظیم', px: 96 },
  { value: 'custom', label: 'سفارشی', px: 40 },
];

export function spacerPresetPx(preset: string, customPx?: number): number {
  if (preset === 'custom') {
    const n = Number(customPx);
    return Number.isFinite(n) ? clampSpacerPx(n) : 40;
  }
  const found = SPACER_PRESETS.find((p) => p.value === preset);
  return found?.px ?? 32;
}

export function clampSpacerPx(n: number): number {
  return Math.max(0, Math.min(400, Math.round(n)));
}

export function resolveSpacerSides(props: Record<string, unknown>): {
  top: number;
  bottom: number;
} {
  const linked = props.linked !== false;
  const preset = String(props.size || 'md');
  const custom = Number(props.height);
  const base = spacerPresetPx(preset, custom);

  if (linked) {
    return { top: base, bottom: base };
  }

  const topPreset = String(props.sizeTop || preset);
  const bottomPreset = String(props.sizeBottom || preset);
  const top =
    topPreset === 'custom'
      ? clampSpacerPx(Number(props.paddingTop) || base)
      : spacerPresetPx(topPreset);
  const bottom =
    bottomPreset === 'custom'
      ? clampSpacerPx(Number(props.paddingBottom) || base)
      : spacerPresetPx(bottomPreset);

  return { top, bottom };
}
