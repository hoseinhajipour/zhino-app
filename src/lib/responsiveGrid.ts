/** Responsive column counts for page-builder grid widgets (1–4). */

export type ColCount = 1 | 2 | 3 | 4;

/** Viewport / builder device band. */
export type DeviceBand = 'mobile' | 'tablet' | 'desktop';

export type ColumnsDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/** Viewport breakpoints (live site). Builder uses device toolbar instead. */
export const TABLET_MIN_PX = 768;
export const DESKTOP_MIN_PX = 1024;

export function clampCols(value: unknown, fallback: number): ColCount {
  const n = Math.min(4, Math.max(1, Number(value) || fallback));
  return n as ColCount;
}

export function resolveDeviceBandFromWidth(width: number): DeviceBand {
  if (width < TABLET_MIN_PX) return 'mobile';
  if (width < DESKTOP_MIN_PX) return 'tablet';
  return 'desktop';
}

export function resolveColsForWidth(
  width: number,
  mobile: ColCount,
  tablet: ColCount,
  desktop: ColCount
): ColCount {
  if (width < TABLET_MIN_PX) return mobile;
  if (width < DESKTOP_MIN_PX) return tablet;
  return desktop;
}

/** Prop key for a device band. Desktop uses the base key; mobile/tablet get a suffix. */
export function devicePropKey(base: string, band: DeviceBand): string {
  if (band === 'desktop') return base;
  return `${base}${band === 'mobile' ? 'Mobile' : 'Tablet'}`;
}

/**
 * Read a prop for a device band, falling back to the desktop/base value
 * when the band-specific override is unset.
 */
export function readBandProp(
  props: Record<string, unknown>,
  base: string,
  band: DeviceBand
): unknown {
  if (band === 'desktop') return props[base];
  const specific = props[devicePropKey(base, band)];
  if (specific !== undefined && specific !== null && specific !== '') return specific;
  return props[base];
}

export function normalizeColumnsDirection(raw: unknown): ColumnsDirection {
  const v = String(raw || 'row');
  if (v === 'row-reverse' || v === 'column' || v === 'column-reverse') return v;
  return 'row';
}

export function resolveColumnsDirection(
  props: Record<string, unknown>,
  band: DeviceBand
): ColumnsDirection {
  return normalizeColumnsDirection(readBandProp(props, 'columnsDirection', band));
}

const PADDING_PRESET_PX: Record<string, number> = { none: 0, sm: 12, md: 20, lg: 32 };

export function resolveContainerPadding(
  props: Record<string, unknown>,
  band: DeviceBand
): { padX: number; padY: number; preset: string } {
  const preset = String(readBandProp(props, 'padding', band) ?? 'md');
  if (preset === 'custom') {
    const padX = Math.max(0, Math.min(120, Number(readBandProp(props, 'paddingX', band)) || 0));
    const padY = Math.max(0, Math.min(120, Number(readBandProp(props, 'paddingY', band)) || 0));
    return { padX, padY, preset };
  }
  const v = PADDING_PRESET_PX[preset] ?? 20;
  return { padX: v, padY: v, preset };
}

export function resolveContainerMargin(
  props: Record<string, unknown>,
  band: DeviceBand
): { marginTop: number; marginBottom: number } {
  return {
    marginTop: Math.max(0, Math.min(160, Number(readBandProp(props, 'marginTop', band)) || 0)),
    marginBottom: Math.max(
      0,
      Math.min(160, Number(readBandProp(props, 'marginBottom', band)) || 0)
    ),
  };
}

/** True when mobile or tablet has at least one layout override set. */
export function hasContainerResponsiveOverrides(props: Record<string, unknown>): boolean {
  const keys = [
    'columnsDirection',
    'padding',
    'paddingX',
    'paddingY',
    'marginTop',
    'marginBottom',
  ];
  return keys.some(
    (base) =>
      (props[`${base}Mobile`] !== undefined &&
        props[`${base}Mobile`] !== null &&
        props[`${base}Mobile`] !== '') ||
      (props[`${base}Tablet`] !== undefined &&
        props[`${base}Tablet`] !== null &&
        props[`${base}Tablet`] !== '')
  );
}

export function readResponsiveCols(
  columnsMobile: unknown,
  columnsTablet: unknown,
  columnsDesktop: unknown,
  fallbacks: { mobile?: number; tablet?: number; desktop?: number } = {}
): { mobile: ColCount; tablet: ColCount; desktop: ColCount } {
  return {
    mobile: clampCols(columnsMobile, fallbacks.mobile ?? 1),
    tablet: clampCols(columnsTablet, fallbacks.tablet ?? 2),
    desktop: clampCols(columnsDesktop, fallbacks.desktop ?? 3),
  };
}

/** Resolve container content slot count (desktop drives structure; legacy `columnCount` supported). */
export function resolveContainerColumnCount(props: Record<string, unknown>): ColCount {
  if (props.columnsDesktop != null) return clampCols(props.columnsDesktop, 2);
  return clampCols(props.columnCount, 2);
}
