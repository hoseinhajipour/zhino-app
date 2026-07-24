import React, { useEffect } from 'react';
import { PageScreen } from '../types';

interface SEOHeadProps {
  currentScreen: PageScreen;
  extraTitle?: string;
  description?: string;
  /** Force noindex (maintenance mode) */
  maintenance?: boolean;
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
    description: 'اتاق بازی‌درمانی مجهز، درمان بیش‌فعالی (ADHD)، اضطراب جدایی، لجبازی کودک و مشاوره استعدادیابی تحصیلی.',
  },
  'marriage-therapy': {
    title: 'زوج‌درمانی و مشاوره پیش از ازدواج | کلینیک روانشناسی ژینو',
    description: 'حل تعارضات زناشویی، مشاوره پیش از ازدواج همراه با آزمون‌های شخصیت، بهبود روابط عاطفی و صمیمیت زوجین.',
  },
  team: {
    title: 'کادر پزشکی و درمانگران ارشد | کلینیک روانشناسی ژینو',
    description: 'معرفی اساتید دانشگاه و روانشناسان دارای پروانه نظام روانشناسی در زمینه مشاوره فردی، کودک، زوج و علوم اعصاب.',
  },
  blog: {
    title: 'مجله تخصصی روانشناسی و سلامت روان | کلینیک ژینو',
    description: 'مقالات علمی و کاربردی در حوزه روانشناسی خانواده، تربیت کودک، بهبود کیفیت زندگی، روابط عاطفی و سلامت ذهن.',
  },
  faq: {
    title: 'سوالات متداول مراجعین و پرسش از روانشناس | کلینیک ژینو',
    description: 'پاسخ به سوالات رایج درباره نحوه برگزاری جلسات مشاوره، هزینه‌ها، مشاوره آنلاین و رزرو نوبت.',
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
  admin: {
    title: 'سامانه مدیریت و پذیرش کلینیک | ژینو',
    description: 'پنل اختصاصی کادر درمان، پزشکان و اپراتور پذیرش کلینیک روانشناسی ژینو.',
  },
  'custom-page': {
    title: 'صفحه | کلینیک روانشناسی ژینو',
    description: 'صفحه اختصاصی کلینیک روانشناسی ژینو.',
  },
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  currentScreen,
  extraTitle,
  description,
  maintenance = false,
}) => {
  useEffect(() => {
    const config = SCREEN_SEO[currentScreen] || SCREEN_SEO.home;
    const finalTitle = maintenance
      ? `${extraTitle || 'در دست تعمیر'} | کلینیک ژینو`
      : extraTitle
        ? `${extraTitle} | کلینیک ژینو`
        : config.title;
    const finalDescription = maintenance
      ? 'سایت موقتاً در دست تعمیر و به‌روزرسانی است.'
      : description || config.description;

    document.title = finalTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', finalDescription);

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute(
      'content',
      maintenance ? 'noindex, nofollow, noarchive, nosnippet' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    let googlebot = document.querySelector('meta[name="googlebot"]');
    if (!googlebot) {
      googlebot = document.createElement('meta');
      googlebot.setAttribute('name', 'googlebot');
      document.head.appendChild(googlebot);
    }
    googlebot.setAttribute(
      'content',
      maintenance ? 'noindex, nofollow, noarchive, nosnippet' : 'index, follow'
    );

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', finalTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', finalDescription);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, [currentScreen, extraTitle, description, maintenance]);

  return null;
};
