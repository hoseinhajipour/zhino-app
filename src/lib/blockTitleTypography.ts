import type { CSSProperties } from 'react';
import { ensureSiteFontLoaded, getSiteFontOption } from './siteChromeDefaults';

/** Section (h2) title sizes for card-grid widgets. */
export function sectionTitleSizeClass(size?: unknown): string {
  switch (String(size || 'lg')) {
    case 'sm':
      return 'text-xl md:text-2xl';
    case 'md':
      return 'text-2xl';
    case 'xl':
      return 'text-3xl md:text-4xl';
    default:
      return 'text-2xl md:text-3xl';
  }
}

/** Card / item title sizes. */
export function itemTitleSizeClass(size?: unknown, fallback: 'sm' | 'md' | 'lg' = 'md'): string {
  switch (String(size || fallback)) {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg';
    default:
      return 'text-base';
  }
}

/** Inline font-family when a specific site font is chosen (not inherit). */
export function resolveTitleFontStyle(fontFamilyId?: unknown): CSSProperties | undefined {
  const id = String(fontFamilyId || '').trim();
  if (!id || id === 'inherit') return undefined;
  const font = getSiteFontOption(id);
  ensureSiteFontLoaded(font.id);
  return { fontFamily: font.stack };
}
