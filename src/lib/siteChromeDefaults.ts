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

export function applySiteTheme(identity: SiteIdentitySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const primary = identity.primaryColor || DEFAULT_SITE_CHROME.identity.primaryColor;
  const secondary = identity.secondaryColor || DEFAULT_SITE_CHROME.identity.secondaryColor;
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-container', primary);
  root.style.setProperty('--color-secondary', secondary);
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
