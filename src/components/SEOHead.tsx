import React, { useEffect } from 'react';
import { PageScreen, SiteSeoSettings } from '../types';
import { mergeSiteSeo } from '../lib/seoSettingsDefaults';

interface SEOHeadProps {
  currentScreen: PageScreen;
  extraTitle?: string;
  description?: string;
  /** Focus / meta keywords */
  keywords?: string;
  /** Force noindex (maintenance mode) */
  maintenance?: boolean;
  /** Site-wide SEO settings from clinic_settings */
  siteSeo?: SiteSeoSettings | null;
}

const SCREEN_SEO: Record<PageScreen, { title: string; description: string }> = {
  home: {
    title: 'کلینیک روانشناسی و مشاوره ژینو | مرکز تخصصی روان‌درمانی، نوروفیدبک و مشاوره آنلاین',
    description: 'مرکز تخصصی روانشناسی ژینو ارائه دهنده خدمات مشاوره فردی بزرگسال (CBT)، زوج‌درمانی، بازی‌درمانی کودک و نوروفیدبک لورتا در تهران با اساتید برجسته دانشگاه.',
  },
  services: {
    title: 'خدمات و دپارتمان‌های تخصصی روانشناسی | کلینیک ژینو',
    description: 'مشاهده کامل خدمات روان‌درمانی، مشاوره ازدواج، درمان کودک و نوجوان، نوروفیدبک لورتا و تست‌های روان‌سنجی در کلینیک ژینو.',
  },
  'service-detail': {
    title: 'جزئیات خدمت تخصصی | کلینیک روانشناسی ژینو',
    description: 'بررسی کامل پروتکل‌های درمانی، هزینه‌ها و رزرو نوبت آنلاین خدمت تخصصی.',
  },
  'adult-therapy': {
    title: 'مشاوره فردی بزرگسال و CBT | کلینیک روانشناسی ژینو',
    description: 'درمان تخصصی اضطراب، افسردگی، وسواس فکری، شکست‌های عاطفی و طرحواره درمانی با روانشناسان ارشد.',
  },
  'child-therapy': {
    title: 'بازی‌درمانی و روانشناسی کودک و نوجوان | کلینیک ژینو',
    description: 'درمان بیش‌فعالی (ADHD)، اضطراب جدایی، لجبازی کودک، اختلالات یادگیری و مشاوره نوجوان.',
  },
  'marriage-therapy': {
    title: 'زوج‌درمانی و مشاوره پیش از ازدواج | کلینیک روانشناسی ژینو',
    description: 'حل تعارضات زناشویی، مشاوره پیش از ازدواج همراه با آزمون‌های شخصیت، بهبود روابط عاطفی و صمیمیت زوجین.',
  },
  team: {
    title: 'کادر پزشکی و درمانگران ارشد | کلینیک روانشناسی ژینو',
    description: 'معرفی اساتید دانشگاه و روانشناسان دارای پروانه نظام روانشناسی در زمینه مشاوره فردی، کودک، زوج و علوم اعصاب.',
  },
  workshops: {
    title: 'کارگاه‌های آموزشی | کلینیک روانشناسی ژینو',
    description: 'مشاهده کارگاه‌های آموزشی کلینیک ژینو و جزئیات هر رویداد.',
  },
  blog: {
    title: 'مجله تخصصی روانشناسی و سلامت روان | کلینیک ژینو',
    description: 'مقالات علمی و کاربردی در حوزه روانشناسی خانواده، تربیت کودک، بهبود کیفیت زندگی، روابط عاطفی و سلامت ذهن.',
  },
  faq: {
    title: 'سوالات متداول مراجعین و پرسش از روانشناس | کلینیک ژینو',
    description: 'پاسخ به سوالات رایج درباره نحوه برگزاری جلسات مشاوره، هزینه‌ها، مشاوره آنلاین و رزرو نوبت.',
  },
  shop: {
    title: 'فروشگاه | کلینیک روانشناسی ژینو',
    description: 'خرید محصولات فیزیکی و دیجیتال کلینیک ژینو با ثبت سفارش و پرداخت دستی.',
  },
  'shop-product': {
    title: 'محصول | فروشگاه کلینیک ژینو',
    description: 'جزئیات محصول و افزودن به سبد خرید در فروشگاه کلینیک ژینو.',
  },
  cart: {
    title: 'سبد خرید | فروشگاه کلینیک ژینو',
    description: 'مشاهده و مدیریت اقلام سبد خرید فروشگاه کلینیک ژینو.',
  },
  checkout: {
    title: 'تسویه حساب | فروشگاه کلینیک ژینو',
    description: 'ثبت سفارش و اطلاعات ارسال در فروشگاه کلینیک ژینو.',
  },
  'order-confirmation': {
    title: 'تأیید سفارش | فروشگاه کلینیک ژینو',
    description: 'سفارش شما با موفقیت ثبت شد.',
  },
  'payment-callback': {
    title: 'نتیجه پرداخت | فروشگاه کلینیک ژینو',
    description: 'بررسی و تأیید نتیجه پرداخت آنلاین سفارش.',
  },
  about: {
    title: 'درباره کلینیک روانشناسی و مشاوره ژینو',
    description: 'تاریخچه، افتخارات و استانداردهای درمانی کلینیک روانشناسی ژینو با بیش از یک دهه تجربه موثر.',
  },
  contact: {
    title: 'تماس با کلینیک روانشناسی ژینو | آدرس و شماره تلفن',
    description: 'آدرس کلینیک ژینو در تهران خیابان شریعتی، شماره تماس مستقیم ۰۲۱۸۸۷۷۶۶۵۵ و نقشه دسترسی.',
  },
  'user-panel': {
    title: 'پنل کاربری مراجعین | کلینیک روانشناسی ژینو',
    description: 'مدیریت نوبت‌های مشاوره، پرونده درمانی، مشاهده تکالیف و پشتیبانی آنلاین.',
  },
  login: {
    title: 'ورود و عضویت | کلینیک روانشناسی ژینو',
    description: 'ورود به حساب کاربری یا ثبت‌نام برای پیگیری نوبت‌ها و پرونده شخصی در کلینیک ژینو.',
  },
  admin: {
    title: 'سامانه مدیریت و پذیرش کلینیک | ژینو',
    description: 'پنل اختصاصی کادر درمان، پزشکان و اپراتور پذیرش کلینیک روانشناسی ژینو.',
  },
  'custom-page': {
    title: 'صفحه | کلینیک روانشناسی ژینو',
    description: 'صفحه اختصاصی کلینیک روانشناسی ژینو.',
  },
  'not-found': {
    title: 'صفحه پیدا نشد (۴۰۴) | کلینیک ژینو',
    description: 'آدرس واردشده در سایت کلینیک ژینو وجود ندارد.',
  },
};

function upsertMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!content.trim()) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content.trim());
}

function upsertMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!content.trim()) return;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content.trim());
}

function absoluteUrl(siteUrl: string, maybeRelative: string): string {
  const value = maybeRelative.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const base = siteUrl.replace(/\/+$/, '');
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}

function ensureGoogleAnalytics(measurementId: string) {
  const id = measurementId.trim();
  const marker = 'data-zhino-ga';
  const existing = document.querySelector(`script[${marker}]`);
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) {
    document.querySelectorAll(`script[${marker}]`).forEach((n) => n.remove());
    return;
  }
  if (existing?.getAttribute(marker) === id) return;

  document.querySelectorAll(`script[${marker}]`).forEach((n) => n.remove());

  const src = document.createElement('script');
  src.async = true;
  src.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  src.setAttribute(marker, id);
  document.head.appendChild(src);

  const inline = document.createElement('script');
  inline.setAttribute(marker, id);
  inline.text = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', ${JSON.stringify(id)});
  `;
  document.head.appendChild(inline);
}

function ensureGoogleTagManager(containerId: string) {
  const id = containerId.trim();
  const marker = 'data-zhino-gtm';
  const existing = document.querySelector(`script[${marker}]`);
  if (!id || !/^GTM-[A-Z0-9]+$/i.test(id)) {
    document.querySelectorAll(`script[${marker}]`).forEach((n) => n.remove());
    document.querySelectorAll(`noscript[${marker}]`).forEach((n) => n.remove());
    return;
  }
  if (existing?.getAttribute(marker) === id) return;

  document.querySelectorAll(`script[${marker}]`).forEach((n) => n.remove());
  document.querySelectorAll(`noscript[${marker}]`).forEach((n) => n.remove());

  const script = document.createElement('script');
  script.setAttribute(marker, id);
  script.text = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',${JSON.stringify(id)});
  `;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  noscript.setAttribute(marker, id);
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(noscript);
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  currentScreen,
  extraTitle,
  description,
  keywords,
  maintenance = false,
  siteSeo,
}) => {
  useEffect(() => {
    const seo = mergeSiteSeo(siteSeo);
    const config = SCREEN_SEO[currentScreen] || SCREEN_SEO.home;
    const homeTitle = seo.defaultTitle || config.title;
    const homeDescription = seo.defaultDescription || config.description;

    const finalTitle = maintenance
      ? `${extraTitle || 'در دست تعمیر'} | کلینیک ژینو`
      : extraTitle
        ? (extraTitle.includes('ژینو') ? extraTitle : `${extraTitle} | کلینیک ژینو`)
        : currentScreen === 'home'
          ? homeTitle
          : config.title;
    const finalDescription = maintenance
      ? 'سایت موقتاً در دست تعمیر و به‌روزرسانی است.'
      : description ||
        (currentScreen === 'home' ? homeDescription : config.description);

    const finalKeywords =
      keywords?.trim() ||
      (currentScreen === 'home' ? seo.defaultKeywords : '') ||
      '';

    document.title = finalTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', finalDescription);

    if (finalKeywords) {
      upsertMetaByName('keywords', finalKeywords);
    }

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    const shouldNoIndex = maintenance || currentScreen === 'not-found';
    robots.setAttribute(
      'content',
      shouldNoIndex
        ? 'noindex, nofollow, noarchive, nosnippet'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    let googlebot = document.querySelector('meta[name="googlebot"]');
    if (!googlebot) {
      googlebot = document.createElement('meta');
      googlebot.setAttribute('name', 'googlebot');
      document.head.appendChild(googlebot);
    }
    googlebot.setAttribute(
      'content',
      shouldNoIndex ? 'noindex, nofollow, noarchive, nosnippet' : 'index, follow'
    );

    upsertMetaByName('google-site-verification', seo.googleSiteVerification);
    upsertMetaByName('msvalidate.01', seo.bingSiteVerification);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', finalTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', finalDescription);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    const ogImage = absoluteUrl(seo.siteUrl, seo.ogImage);
    if (ogImage) {
      upsertMetaByProperty('og:image', ogImage);
      upsertMetaByName('twitter:image', ogImage);
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    ensureGoogleAnalytics(seo.googleAnalyticsId);
    ensureGoogleTagManager(seo.googleTagManagerId);
  }, [currentScreen, extraTitle, description, keywords, maintenance, siteSeo]);

  return null;
};
