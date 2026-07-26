import type { CSSProperties } from 'react';
import type { SiteContainerMode, SiteLayoutSettings } from '../types';

/** Page / container content width modes for the page builder. */
export type ContentWidthMode = 'contained' | 'full';

/** Default max width (px) for contained page shell & container widget */
export const DEFAULT_CONTENT_MAX_WIDTH = 1400;

/** Fallback site container width (matches previous header/footer) */
export const DEFAULT_SITE_CONTAINER_MAX_WIDTH = 1200;

/** Tailwind-friendly class using the CSS var set by applySiteLayout */
export const SITE_CONTAINER_CLASS =
  'w-full mx-auto px-4 md:px-6 max-w-[var(--site-content-max-width)]';

export function normalizeContentWidthMode(value?: string | null): ContentWidthMode {
  return value === 'full' ? 'full' : 'contained';
}

export function normalizeSiteContainerMode(value?: string | null): SiteContainerMode {
  if (value === '1400' || value === 'full' || value === 'custom') return value;
  return '1200';
}

/**
 * Resolve site layout to a max-width in px, or null for full-bleed.
 */
export function resolveSiteContainerMaxWidth(
  layout?: Partial<SiteLayoutSettings> | null
): number | null {
  const mode = normalizeSiteContainerMode(layout?.containerMode);
  if (mode === 'full') return null;
  if (mode === '1400') return 1400;
  if (mode === 'custom') {
    const custom = Number(layout?.customMaxWidth);
    if (Number.isFinite(custom) && custom > 0) return Math.round(custom);
    return DEFAULT_SITE_CONTAINER_MAX_WIDTH;
  }
  return 1200;
}

/** CSS custom-property value for --site-content-max-width */
export function siteContentMaxWidthCssValue(
  layout?: Partial<SiteLayoutSettings> | null
): string {
  const max = resolveSiteContainerMaxWidth(layout);
  return max == null ? 'none' : `${max}px`;
}

/** Outer shell classes for SitePageView (page-level). */
export function pageShellClassName(layoutWidth?: string | null): string {
  const mode = normalizeContentWidthMode(layoutWidth);
  const base = 'space-y-16 pb-16 text-right w-full';
  if (mode === 'full') {
    return `${base} max-w-none`;
  }
  return `${base} ${SITE_CONTAINER_CLASS}`;
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
