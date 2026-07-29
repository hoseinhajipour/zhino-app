export type PageKind = 'site' | 'service' | 'article' | 'workshop';
export type TargetKind = 'page' | 'service' | 'article' | 'workshop';

export type ServiceBlockType =
  | 'hero'
  | 'pageHero'
  | 'heroHeader'
  | 'highlights'
  | 'symptoms'
  | 'process'
  | 'features'
  | 'doctors'
  | 'testimonials'
  | 'faqs'
  | 'latestFaqs'
  | 'contactInfo'
  | 'cta'
  | 'richText'
  | 'htmlCode'
  | 'otherServices'
  | 'servicesGrid'
  | 'contactCards'
  | 'contactForm'
  | 'articlesGrid'
  | 'imageCarousel'
  | 'videoPlayer'
  | 'container'
  | 'icon'
  | 'iconList'
  | 'button'
  | 'staffCarousel'
  | 'googleMap'
  | 'tabGallery'
  | 'divider'
  | 'spacer'
  | 'singleImage'
  | 'imageGallery'
  | 'verticalImageGallery'
  | 'beforeAfter'
  | 'audioPlayer';

export interface ServiceBlock {
  id: string;
  type: ServiceBlockType;
  props: Record<string, unknown>;
}

export interface PageBuilderDoc {
  version: 1;
  blocks: ServiceBlock[];
}

export type BlockScrollAnimation = 'fade-in' | 'fade-up' | 'fade-down';

export const ANIMATE_TYPES: BlockScrollAnimation[] = ['fade-in', 'fade-up', 'fade-down'];

export const BLOCK_LABELS: Record<string, string> = {
  hero: 'هیرو / بنر خدمت',
  pageHero: 'هیرو صفحه',
  heroHeader: 'هدر هیرو',
  highlights: 'هایلایت‌ها',
  symptoms: 'نشانه‌ها و مخاطبان',
  process: 'مراحل فرآیند',
  features: 'ویژگی‌ها و مزایا',
  doctors: 'تیم متخصصین',
  testimonials: 'نظرات مراجعین',
  faqs: 'سوالات متداول',
  latestFaqs: 'آخرین سوالات متداول',
  contactInfo: 'اطلاعات تماس',
  cta: 'فراخوان اقدام (CTA)',
  richText: 'ویرایشگر متن',
  htmlCode: 'کد HTML',
  otherServices: 'سایر خدمات (چیپ)',
  servicesGrid: 'شبکه خدمات',
  contactCards: 'کارت‌های تماس',
  contactForm: 'فرم',
  articlesGrid: 'فهرست مقالات',
  imageCarousel: 'کروسل تصویر',
  videoPlayer: 'پخش‌کننده ویدئو',
  container: 'کانتینر / ستون‌ها',
  icon: 'آیکون',
  iconList: 'لیست آیکون',
  button: 'دکمه',
  staffCarousel: 'کروسل پرسنل',
  googleMap: 'نقشه گوگل',
  tabGallery: 'تب گالری',
  divider: 'خط',
  spacer: 'فاصله',
  singleImage: 'تصویر تکی',
  imageGallery: 'گالری تصاویر',
  verticalImageGallery: 'گالری تصاویر عمودی',
  beforeAfter: 'قبل / بعد',
  audioPlayer: 'پخش‌کننده صدا',
};

/** Widget types that must NOT be nested inside container columns */
const NON_NESTABLE_WIDGET_TYPES: ServiceBlockType[] = ['container'];

/**
 * Widgets safe to nest inside container columns.
 * Derived automatically from every widget registered in BLOCK_LABELS,
 * so newly added widgets show up here without manual updates.
 */
export const NESTABLE_WIDGET_TYPES: ServiceBlockType[] = (
  Object.keys(BLOCK_LABELS) as ServiceBlockType[]
).filter((t) => !NON_NESTABLE_WIDGET_TYPES.includes(t));

export const SITE_WIDGET_TYPES: ServiceBlockType[] = [
  'container',
  'divider',
  'spacer',
  'heroHeader',
  'pageHero',
  'imageCarousel',
  'singleImage',
  'imageGallery',
  'verticalImageGallery',
  'beforeAfter',
  'audioPlayer',
  'videoPlayer',
  'icon',
  'iconList',
  'button',
  'staffCarousel',
  'googleMap',
  'tabGallery',
  'highlights',
  'features',
  'doctors',
  'servicesGrid',
  'articlesGrid',
  'contactCards',
  'contactInfo',
  'contactForm',
  'testimonials',
  'faqs',
  'latestFaqs',
  'richText',
  'htmlCode',
  'cta',
  'hero',
  'otherServices',
];

export const SERVICE_WIDGET_TYPES: ServiceBlockType[] = [
  'container',
  'divider',
  'spacer',
  'heroHeader',
  'hero',
  'imageCarousel',
  'singleImage',
  'imageGallery',
  'verticalImageGallery',
  'beforeAfter',
  'audioPlayer',
  'videoPlayer',
  'icon',
  'iconList',
  'button',
  'staffCarousel',
  'googleMap',
  'tabGallery',
  'highlights',
  'symptoms',
  'process',
  'features',
  'doctors',
  'testimonials',
  'faqs',
  'latestFaqs',
  'contactInfo',
  'richText',
  'htmlCode',
  'otherServices',
  'cta',
];

export const ARTICLE_WIDGET_TYPES: ServiceBlockType[] = [
  'container',
  'divider',
  'spacer',
  'heroHeader',
  'pageHero',
  'richText',
  'htmlCode',
  'imageCarousel',
  'singleImage',
  'imageGallery',
  'verticalImageGallery',
  'beforeAfter',
  'audioPlayer',
  'videoPlayer',
  'icon',
  'iconList',
  'button',
  'staffCarousel',
  'tabGallery',
  'googleMap',
  'highlights',
  'features',
  'process',
  'faqs',
  'latestFaqs',
  'contactInfo',
  'cta',
  'doctors',
];

export function widgetTypesForKind(kind: PageKind): ServiceBlockType[] {
  if (kind === 'service') return SERVICE_WIDGET_TYPES;
  if (kind === 'article') return ARTICLE_WIDGET_TYPES;
  return SITE_WIDGET_TYPES;
}

export function pageKindFromTarget(target: TargetKind): PageKind {
  if (target === 'service') return 'service';
  if (target === 'article') return 'article';
  if (target === 'workshop') return 'workshop';
  return 'site';
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
