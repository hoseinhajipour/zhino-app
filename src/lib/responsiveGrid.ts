/** Responsive column counts for page-builder grid widgets (1–4). */

export type ColCount = 1 | 2 | 3 | 4;

/** Viewport breakpoints (live site). Builder uses device toolbar instead. */
export const TABLET_MIN_PX = 768;
export const DESKTOP_MIN_PX = 1024;

export function clampCols(value: unknown, fallback: number): ColCount {
  const n = Math.min(4, Math.max(1, Number(value) || fallback));
  return n as ColCount;
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
