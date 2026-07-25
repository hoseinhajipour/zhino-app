import type {
  PageScreen,
  SiteChromeSettings,
  SiteIdentitySettings,
  SiteNavItem,
} from '../types';
import { CLINIC_INFO } from '../data/clinicData';

export const BUILTIN_NAV_TARGETS: Array<{ value: string; label: string }> = [
  { value: 'home', label: 'صفحه اصلی' },
  { value: 'about', label: 'درباره ما' },
  { value: 'services', label: 'خدمات' },
  { value: 'child-therapy', label: 'کودک و نوجوان' },
  { value: 'adult-therapy', label: 'مشاوره فردی' },
  { value: 'marriage-therapy', label: 'زوج درمانی' },
  { value: 'team', label: 'تیم ما' },
  { value: 'blog', label: 'مقالات' },
  { value: 'faq', label: 'سوالات متداول' },
  { value: 'contact', label: 'تماس با ما' },
  { value: 'login', label: 'ورود / عضویت' },
  { value: 'user-panel', label: 'پنل کاربری' },
  { value: 'admin', label: 'داشبورد ادمین' },
];

export const DEFAULT_SITE_CHROME: SiteChromeSettings = {
  identity: {
    siteName: CLINIC_INFO.name,
    tagline: 'مرکز تخصصی روان‌درمانی، مشاوره و نوروفیدبک',
    logoUrl: CLINIC_INFO.logoUrl,
    faviconUrl: '/favicon.ico',
    primaryColor: '#b5106a',
    secondaryColor: '#2c694e',
    buttonColor: '#b5106a',
    backgroundColor: '#f8f9fa',
    accentColor: '#13677b',
    textColor: '#191c1d',
    fontFamily: 'vazirmatn',
    phone1: CLINIC_INFO.phone1,
    phone2: CLINIC_INFO.phone2,
    phoneClean: CLINIC_INFO.phoneClean,
    address: CLINIC_INFO.address,
    email: CLINIC_INFO.email,
    whatsappNumber: CLINIC_INFO.whatsappNumber,
    instagram: CLINIC_INFO.instagram,
    telegram: CLINIC_INFO.telegram,
  },
  header: {
    showPhone: true,
    showAuthButton: true,
    showThemeToggle: true,
    showBookingButton: true,
    bookingButtonLabel: 'رزرو نوبت',
    sticky: true,
  },
  menu: {
    servicesDropdownTitle: 'دسته بندی تخصصی خدمات',
    mainItems: [
      { id: 'nav-home', label: 'صفحه اصلی', target: 'home', visible: true },
      { id: 'nav-about', label: 'درباره ما', target: 'about', visible: true },
      {
        id: 'nav-services',
        label: 'خدمات کلینیک',
        target: 'services',
        visible: true,
        hasDropdown: true,
        children: [
          { id: 'nav-svc-all', label: 'همه خدمات درمان', target: 'services', visible: true, icon: 'grid_view' },
          { id: 'nav-svc-child', label: 'کودک و نوجوان', target: 'child-therapy', visible: true, icon: 'child_care' },
          { id: 'nav-svc-adult', label: 'مشاوره فردی', target: 'adult-therapy', visible: true, icon: 'person' },
          {
            id: 'nav-svc-marriage',
            label: 'زوج درمانی',
            target: 'marriage-therapy',
            visible: true,
            icon: 'favorite',
          },
        ],
      },
      { id: 'nav-team', label: 'تیم ما', target: 'team', visible: true },
      { id: 'nav-blog', label: 'مجله و مقالات', target: 'blog', visible: true },
      { id: 'nav-faq', label: 'سوالات متداول', target: 'faq', visible: true },
      { id: 'nav-contact', label: 'تماس با ما', target: 'contact', visible: true },
    ],
  },
  footer: {
    aboutText:
      'مرکز تخصصی مشاوره و روان‌درمانی ژینو با رویکردی علمی، مدرن و انسانی. همراه شما در تمام مراحل رشد و سلامت روان.',
    showNewsletter: true,
    newsletterTitle: 'خبرنامه سلامت روان',
    newsletterSubtitle:
      'برای دریافت جدیدترین مقالات آموزشی، آگاهی‌بخشی روانشناختی و تخفیف‌های دوره‌ای عضو شوید.',
    copyrightText: '© ۱۴۰۳ کلینیک روانشناسی ژینو. تمامی حقوق علمی و مادی محفوظ است.',
    hoursText: 'شنبه تا چهارشنبه ۹ الی ۲۰ | پنجشنبه ۹ الی ۱۶',
    showAdminLink: true,
    showWhatsapp: true,
    showPhoneIcon: true,
    showMapIcon: true,
    quickLinks: [
      { id: 'f-home', label: 'صفحه اصلی', target: 'home', visible: true },
      { id: 'f-services', label: 'خدمات تخصصی', target: 'services', visible: true },
      { id: 'f-child', label: 'بازی‌درمانی و کودک', target: 'child-therapy', visible: true },
      { id: 'f-adult', label: 'مشاوره فردی بزرگسال', target: 'adult-therapy', visible: true },
      { id: 'f-marriage', label: 'مشاوره پیش از ازدواج', target: 'marriage-therapy', visible: true },
      { id: 'f-team', label: 'معرفی درمانگران', target: 'team', visible: true },
      { id: 'f-blog', label: 'مجله و مقالات تخصصی', target: 'blog', visible: true },
      { id: 'f-faq', label: 'سوالات متداول (FAQ)', target: 'faq', visible: true },
    ],
  },
};

const PAGE_SCREENS = new Set<string>([
  'home',
  'services',
  'service-detail',
  'child-therapy',
  'adult-therapy',
  'marriage-therapy',
  'about',
  'team',
  'contact',
  'blog',
  'faq',
  'admin',
  'user-panel',
  'login',
  'custom-page',
]);

export function isPageScreenTarget(target: string): target is PageScreen {
  return PAGE_SCREENS.has(target);
}

export function mergeSiteChrome(partial?: Partial<SiteChromeSettings> | null): SiteChromeSettings {
  const p = partial || {};
  return {
    identity: { ...DEFAULT_SITE_CHROME.identity, ...(p.identity || {}) },
    header: { ...DEFAULT_SITE_CHROME.header, ...(p.header || {}) },
    menu: {
      ...DEFAULT_SITE_CHROME.menu,
      ...(p.menu || {}),
      mainItems: p.menu?.mainItems?.length ? p.menu.mainItems : DEFAULT_SITE_CHROME.menu.mainItems,
    },
    footer: {
      ...DEFAULT_SITE_CHROME.footer,
      ...(p.footer || {}),
      quickLinks: p.footer?.quickLinks?.length
        ? p.footer.quickLinks
        : DEFAULT_SITE_CHROME.footer.quickLinks,
    },
  };
}

export type SiteFontOption = {
  id: string;
  label: string;
  /** CSS font-family stack */
  stack: string;
  /** Google Fonts family query (empty = already loaded / system) */
  google?: string;
  sample: string;
};

/** Persian + English fonts for site identity. */
export const SITE_FONT_OPTIONS: SiteFontOption[] = [
  {
    id: 'vazirmatn',
    label: 'وزیرمتن (پیش‌فرض)',
    stack: "'Vazirmatn', Tahoma, sans-serif",
    google: 'Vazirmatn:wght@300;400;500;600;700;800;900',
    sample: 'کلینیک ژینو — مشاوره تخصصی',
  },
  {
    id: 'ibm-plex-arabic',
    label: 'IBM Plex Arabic',
    stack: "'IBM Plex Sans Arabic', Tahoma, sans-serif",
    google: 'IBM+Plex+Sans+Arabic:wght@300;400;500;600;700',
    sample: 'سلامت روان با فونت مدرن',
  },
  {
    id: 'noto-sans-arabic',
    label: 'نوتو سنس عربی',
    stack: "'Noto Sans Arabic', Tahoma, sans-serif",
    google: 'Noto+Sans+Arabic:wght@300;400;500;600;700',
    sample: 'نمایش خوانا برای متن فارسی',
  },
  {
    id: 'cairo',
    label: 'Cairo / قاهره',
    stack: "'Cairo', Tahoma, sans-serif",
    google: 'Cairo:wght@300;400;500;600;700;800',
    sample: 'طراحی معاصر برای عناوین',
  },
  {
    id: 'readex-pro',
    label: 'Readex Pro',
    stack: "'Readex Pro', Tahoma, sans-serif",
    google: 'Readex+Pro:wght@300;400;500;600;700',
    sample: 'فونت دو‌زبانه فارسی/انگلیسی',
  },
  {
    id: 'amiri',
    label: 'امیری (سریف)',
    stack: "'Amiri', Georgia, serif",
    google: 'Amiri:wght@400;700',
    sample: 'سبک کلاسیک و ادبی',
  },
  {
    id: 'inter',
    label: 'Inter (انگلیسی)',
    stack: "'Inter', system-ui, sans-serif",
    google: 'Inter:wght@300;400;500;600;700;800',
    sample: 'Clean modern English UI',
  },
  {
    id: 'roboto',
    label: 'Roboto (انگلیسی)',
    stack: "'Roboto', system-ui, sans-serif",
    google: 'Roboto:wght@300;400;500;700',
    sample: 'Neutral product typography',
  },
  {
    id: 'poppins',
    label: 'Poppins (انگلیسی)',
    stack: "'Poppins', system-ui, sans-serif",
    google: 'Poppins:wght@300;400;500;600;700',
    sample: 'Friendly rounded headlines',
  },
  {
    id: 'system',
    label: 'سیستم (بدون وب‌فونت)',
    stack: "Tahoma, 'Segoe UI', system-ui, sans-serif",
    sample: 'سریع و سبک روی همه دستگاه‌ها',
  },
];

export function getSiteFontOption(id?: string): SiteFontOption {
  return SITE_FONT_OPTIONS.find((f) => f.id === id) || SITE_FONT_OPTIONS[0];
}

function ensureGoogleFontLoaded(googleQuery: string) {
  if (typeof document === 'undefined' || !googleQuery) return;
  const id = `site-font-${googleQuery.replace(/[^a-zA-Z0-9]+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${googleQuery}&display=swap`;
  document.head.appendChild(link);
}

/** Load a site font by id (for per-block title typography). */
export function ensureSiteFontLoaded(fontId?: string) {
  const font = getSiteFontOption(fontId);
  if (font.google) ensureGoogleFontLoaded(font.google);
}

function lightenHex(hex: string, amount = 0.18): string {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const mix = (channel: number) => {
    if (amount >= 0) return Math.min(255, Math.round(channel + (255 - channel) * amount));
    return Math.max(0, Math.round(channel * (1 + amount)));
  };
  r = mix(r);
  g = mix(g);
  b = mix(b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applySiteTheme(identity: Partial<SiteIdentitySettings> | SiteIdentitySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const d = DEFAULT_SITE_CHROME.identity;
  const primary = identity.primaryColor || d.primaryColor;
  const secondary = identity.secondaryColor || d.secondaryColor;
  const button = identity.buttonColor || primary;
  const background = identity.backgroundColor || d.backgroundColor;
  const accent = identity.accentColor || d.accentColor;
  const text = identity.textColor || d.textColor;
  const font = getSiteFontOption(identity.fontFamily || d.fontFamily);

  // CTA surfaces use buttonColor (via --color-primary); brand hue stays in surface-tint.
  root.style.setProperty('--color-primary', button);
  root.style.setProperty('--color-primary-container', lightenHex(button, 0.14));
  root.style.setProperty('--color-surface-tint', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-tertiary', accent);
  root.style.setProperty('--color-tertiary-container', lightenHex(accent, 0.35));
  root.style.setProperty('--color-background', background);
  root.style.setProperty('--color-surface', background);
  root.style.setProperty('--color-surface-bright', lightenHex(background, 0.05));
  root.style.setProperty('--color-surface-container-lowest', lightenHex(background, 0.08));
  root.style.setProperty('--color-surface-container-low', lightenHex(background, 0.03));
  root.style.setProperty('--color-surface-container', lightenHex(background, -0.04));
  root.style.setProperty('--color-surface-container-high', lightenHex(background, -0.08));
  root.style.setProperty('--color-on-surface', text);
  root.style.setProperty('--color-on-background', text);
  root.style.setProperty('--color-button', button);
  root.style.setProperty('--color-brand', primary);
  root.style.setProperty('--font-site', font.stack);
  root.style.setProperty('--font-vazir', font.stack);

  document.body.style.fontFamily = font.stack;
  if (font.google) ensureGoogleFontLoaded(font.google);

  if (identity.faviconUrl) {
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = identity.faviconUrl;
  }
}

export function newNavItem(partial?: Partial<SiteNavItem>): SiteNavItem {
  return {
    id: `nav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    label: 'آیتم جدید',
    target: 'home',
    visible: true,
    ...partial,
  };
}
