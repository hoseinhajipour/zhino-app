import type { CSSProperties } from 'react';

/** Page / container content width modes for the page builder. */
export type ContentWidthMode = 'contained' | 'full';

/** Default max width (px) for contained page shell & container widget */
export const DEFAULT_CONTENT_MAX_WIDTH = 1400;

export function normalizeContentWidthMode(value?: string | null): ContentWidthMode {
  return value === 'full' ? 'full' : 'contained';
}

/** Outer shell classes for SitePageView (page-level). */
export function pageShellClassName(layoutWidth?: string | null): string {
  const mode = normalizeContentWidthMode(layoutWidth);
  const base = 'space-y-16 pb-16 text-right w-full';
  if (mode === 'full') {
    return `${base} max-w-none`;
  }
  return `${base} max-w-[1400px] mx-auto px-4 md:px-6`;
}

/**
 * Inline style for Container widget width.
 * - contained: centered with maxWidth (default 1400)
 * - full: break out to viewport width (works inside a contained page shell)
 */
export function containerWidthStyle(
  widthMode?: string | null,
  maxWidthPx?: number | null
): CSSProperties {
  const mode = normalizeContentWidthMode(widthMode);
  if (mode === 'full') {
    return {
      width: '100vw',
      maxWidth: '100vw',
      marginInline: 'calc(50% - 50vw)',
    };
  }
  const max =
    typeof maxWidthPx === 'number' && Number.isFinite(maxWidthPx) && maxWidthPx > 0
      ? maxWidthPx
      : DEFAULT_CONTENT_MAX_WIDTH;
  return {
    width: '100%',
    maxWidth: max,
    marginInline: 'auto',
  };
}
