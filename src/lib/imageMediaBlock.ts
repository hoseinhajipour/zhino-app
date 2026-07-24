/** Shared helpers for single-image and image-gallery page-builder widgets. */

export type ImageAspect = 'auto' | 'video' | 'square' | 'portrait' | 'wide' | 'original';
export type ImageObjectFit = 'cover' | 'contain';
export type ImageClickBehavior = 'none' | 'lightbox' | 'link';
export type ImageCaptionPosition = 'below' | 'overlay' | 'none';
export type ImageWidthMode = 'full' | 'percent' | 'px';

export const IMAGE_ASPECT_OPTIONS: Array<{ value: ImageAspect; label: string }> = [
  { value: 'auto', label: 'خودکار (نسبت اصلی)' },
  { value: 'video', label: '۱۶:۹' },
  { value: 'wide', label: '۲۱:۹ عریض' },
  { value: 'square', label: '۱:۱ مربع' },
  { value: 'portrait', label: '۳:۴ عمودی' },
  { value: 'original', label: 'بدون برش (contain)' },
];

export function imageAspectClass(aspect: string): string {
  switch (aspect) {
    case 'video':
      return 'aspect-video';
    case 'wide':
      return 'aspect-[21/9]';
    case 'square':
      return 'aspect-square';
    case 'portrait':
      return 'aspect-[3/4]';
    case 'original':
      return '';
    default:
      return ''; // auto
  }
}

export function resolveImageWidth(mode: string, percent: number, px: number): string {
  if (mode === 'px') return `${Math.max(80, Math.min(2000, px || 640))}px`;
  if (mode === 'percent') return `${Math.max(10, Math.min(100, percent || 100))}%`;
  return '100%';
}

export function clampRadius(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 16;
  return Math.max(0, Math.min(48, Math.round(v)));
}
