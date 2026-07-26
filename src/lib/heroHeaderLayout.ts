import type { CSSProperties } from 'react';
import { DESKTOP_MIN_PX, TABLET_MIN_PX } from './responsiveGrid';

export type HeroWidthMode = 'full' | 'percent' | 'px';
export type HeroDevice = 'mobile' | 'tablet' | 'desktop';
export type HeroBackgroundMode = 'none' | 'color' | 'image' | 'pattern';

export type HeroPatternStyle = 'diagonal' | 'cross' | 'soft' | 'dots';

export function normalizeHeroPatternStyle(value: unknown): HeroPatternStyle {
  if (value === 'cross' || value === 'soft' || value === 'dots') return value;
  return 'diagonal';
}

/** Parse #rgb / #rrggbb into rgba() for hatch lines. */
export function heroHexToRgba(hex: string, alpha: number): string {
  const raw = hex.trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (!/^[0-9A-Fa-f]{6}$/.test(full)) {
    return `rgba(181, 16, 106, ${alpha})`;
  }
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const pi = PERSIAN_DIGITS.indexOf(ch);
    if (pi >= 0) return String(pi);
    const ai = ARABIC_DIGITS.indexOf(ch);
    return ai >= 0 ? String(ai) : ch;
  });
}

export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] || d);
}

export type ParsedHeroStatValue = {
  prefix: string;
  target: number | null;
  decimals: number;
  suffix: string;
  usePersian: boolean;
  raw: string;
};

/** Split a display value like «+۱۲,۰۰۰» or «۹۸.۴٪» for count-up animation. */
export function parseHeroStatValue(raw: string): ParsedHeroStatValue {
  const text = String(raw || '').trim();
  const usePersian = /[۰-۹٠-٩]/.test(text);
  const latin = toLatinDigits(text).replace(/٬/g, ',').replace(/٫/g, '.');
  const match = latin.match(/(\d+(?:[.,]\d+)?)/);
  if (!match || match.index == null) {
    return { prefix: '', target: null, decimals: 0, suffix: '', usePersian, raw: text };
  }
  const numRaw = match[1];
  const normalized = numRaw.replace(/,/g, '');
  const target = Number(normalized);
  if (!Number.isFinite(target)) {
    return { prefix: '', target: null, decimals: 0, suffix: '', usePersian, raw: text };
  }
  const dot = normalized.includes('.') ? normalized.split('.')[1]?.length || 0 : 0;
  return {
    prefix: latin.slice(0, match.index),
    target,
    decimals: Math.min(2, dot),
    suffix: latin.slice(match.index + numRaw.length),
    usePersian,
    raw: text,
  };
}

export function formatHeroStatNumber(
  value: number,
  decimals: number,
  usePersian: boolean
): string {
  const fixed = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  const withSep = decimals > 0
    ? fixed
    : Math.round(value).toLocaleString('en-US');
  return usePersian ? toPersianDigits(withSep) : withSep;
}

const WIDTH_MODE_KEYS: Record<HeroDevice, string> = {
  mobile: 'widthModeMobile',
  tablet: 'widthModeTablet',
  desktop: 'widthMode',
};

const WIDTH_PERCENT_KEYS: Record<HeroDevice, string> = {
  mobile: 'widthPercentMobile',
  tablet: 'widthPercentTablet',
  desktop: 'widthPercent',
};

const WIDTH_PX_KEYS: Record<HeroDevice, string> = {
  mobile: 'widthPxMobile',
  tablet: 'widthPxTablet',
  desktop: 'widthPx',
};

export function normalizeHeroWidthMode(value: unknown): HeroWidthMode {
  if (value === 'percent' || value === 'px') return value;
  return 'full';
}

export function defaultHeroWidthValue(mode: HeroWidthMode, device: HeroDevice): number {
  if (mode === 'percent') return 100;
  if (device === 'mobile') return 360;
  if (device === 'tablet') return 720;
  return 1200;
}

/** Resolve active device from builder toolbar or live viewport. */
export function resolveHeroDevice(
  previewDevice: HeroDevice | null | undefined,
  viewportWidth?: number
): HeroDevice {
  if (previewDevice === 'mobile' || previewDevice === 'tablet' || previewDevice === 'desktop') {
    return previewDevice;
  }
  const w = typeof viewportWidth === 'number' ? viewportWidth : typeof window !== 'undefined' ? window.innerWidth : DESKTOP_MIN_PX;
  if (w < TABLET_MIN_PX) return 'mobile';
  if (w < DESKTOP_MIN_PX) return 'tablet';
  return 'desktop';
}

export function readHeroWidthForDevice(
  props: Record<string, unknown>,
  device: HeroDevice
): { mode: HeroWidthMode; percent: number; px: number } {
  const desktopMode = normalizeHeroWidthMode(props.widthMode);
  const rawMode = props[WIDTH_MODE_KEYS[device]];
  const mode =
    device === 'desktop'
      ? desktopMode
      : rawMode != null && String(rawMode).trim() !== ''
        ? normalizeHeroWidthMode(rawMode)
        : desktopMode;

  const percentKey = WIDTH_PERCENT_KEYS[device];
  const pxKey = WIDTH_PX_KEYS[device];
  const desktopPercent = Number(props.widthPercent);
  const desktopPx = Number(props.widthPx);
  const rawPercent = Number(props[percentKey]);
  const rawPx = Number(props[pxKey]);

  const percent =
    Number.isFinite(rawPercent) && rawPercent > 0
      ? rawPercent
      : Number.isFinite(desktopPercent) && desktopPercent > 0
        ? desktopPercent
        : 100;
  const px =
    Number.isFinite(rawPx) && rawPx > 0
      ? rawPx
      : Number.isFinite(desktopPx) && desktopPx > 0
        ? desktopPx
        : defaultHeroWidthValue('px', device);

  return { mode, percent, px };
}

export function resolveHeroWidthCss(
  mode: HeroWidthMode,
  percent: number,
  px: number
): string {
  if (mode === 'px') return `${Math.max(120, Math.min(2400, px || 1200))}px`;
  if (mode === 'percent') return `${Math.max(20, Math.min(100, percent || 100))}%`;
  return '100%';
}

export function resolveHeroOuterStyle(
  props: Record<string, unknown>,
  device: HeroDevice
): CSSProperties {
  const { mode, percent, px } = readHeroWidthForDevice(props, device);
  const width = resolveHeroWidthCss(mode, percent, px);
  const align = String(props.widthAlign || 'center');
  const paddingX = Number(props.paddingX);
  const paddingY = Number(props.paddingY);
  const paddingTop = Number(props.paddingTop);
  const paddingBottom = Number(props.paddingBottom);
  const marginTop = Number(props.marginTop);
  const marginBottom = Number(props.marginBottom);
  const marginX = Number(props.marginX);
  const bgMode = String(props.background || 'none') as HeroBackgroundMode;
  const bgColor = String(props.backgroundColor || '').trim();
  const borderRadius = Number(props.borderRadius);

  const style: CSSProperties = {
    width,
    maxWidth: '100%',
  };

  if (mode === 'full') {
    if (Number.isFinite(marginX) && marginX > 0) style.marginInline = marginX;
  } else if (align === 'start') {
    style.marginInlineEnd = 'auto';
  } else if (align === 'end') {
    style.marginInlineStart = 'auto';
  } else {
    style.marginInline = 'auto';
  }

  if (Number.isFinite(paddingX) && paddingX >= 0) style.paddingInline = paddingX;
  if (Number.isFinite(paddingTop) && paddingTop >= 0) style.paddingTop = paddingTop;
  else if (Number.isFinite(paddingY) && paddingY >= 0) style.paddingBlock = paddingY;
  if (Number.isFinite(paddingBottom) && paddingBottom >= 0) style.paddingBottom = paddingBottom;

  if (Number.isFinite(marginTop) && marginTop !== 0) style.marginTop = marginTop;
  if (Number.isFinite(marginBottom) && marginBottom !== 0) style.marginBottom = marginBottom;

  if ((bgMode === 'color' || bgMode === 'pattern') && bgColor) {
    style.backgroundColor = bgColor;
  }

  if (Number.isFinite(borderRadius) && borderRadius > 0) {
    style.borderRadius = borderRadius;
    style.overflow = 'hidden';
  }

  return style;
}

export function heroHasCustomVerticalPadding(props: Record<string, unknown>): boolean {
  const top = Number(props.paddingTop);
  const bottom = Number(props.paddingBottom);
  const y = Number(props.paddingY);
  return (
    (Number.isFinite(top) && top >= 0) ||
    (Number.isFinite(bottom) && bottom >= 0) ||
    (Number.isFinite(y) && y >= 0)
  );
}

export function setHeroWidthForDevice(
  props: Record<string, unknown>,
  device: HeroDevice,
  patch: { mode?: HeroWidthMode; percent?: number; px?: number }
): Record<string, unknown> {
  const next = { ...props };
  if (patch.mode != null) next[WIDTH_MODE_KEYS[device]] = patch.mode;
  if (patch.percent != null) next[WIDTH_PERCENT_KEYS[device]] = patch.percent;
  if (patch.px != null) next[WIDTH_PX_KEYS[device]] = patch.px;
  return next;
}
