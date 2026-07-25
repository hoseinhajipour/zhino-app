import { Doctor, ServiceItem, FAQItem, Article } from '../types';

export const CLINIC_INFO = {
  name: 'کلینیک روانشناسی ژینو',
  logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8fFw1zVrUeedrDe_HOmwUPu5ccNJaulmXhsGZHi9ry7XLShS0_FEQPDgx7az3mbqzQwfF77n_goSKU5CISU3KKZtWdeotaOmcP-QSbj3Xo6LIDueSL18vYRMTiSAWUODH7zB1CTIKWxu1-vtK4mmm1YDobGQEGFDvB_vfnU5L8B8uZ8_tH2cHBWpbPWkEVTqMGgu1TRTX_ixKWw0KLACT_exLFQ-0ty8gUmoYkJWz6Qe3TiuQ-8TkGWmt9zCRCbuzrOWj7bK-HUE',
  phone1: '۰۲۱-۸۸۷۷۶۶۵۵',
  phone2: '۰۲۱-۸۸۷۷۴۴۳۳',
  phoneClean: '02188776655',
  address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، کوچه نگار، ساختمان پزشکان، طبقه ۴',
  email: 'info@zhinoclinic.ir',
  hoursSatToWed: '۹:۰۰ الی ۲۰:۰۰',
  hoursThu: '۹:۰۰ الی ۱۶:۰۰',
  instagram: '@zhino_clinic',
  telegram: '@zhinoclinic',
  whatsappNumber: '+989120000000',
};

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-deihimi',
    name: 'خانم مرجانه دیهیمی',
    title: 'روانشناس و درمانگر ارشد',
    degree: 'کارشناسی ارشد روانشناسی بالینی',
    avatar: '/staff/dr-deihimi.jpg',
    bio: 'با بیش از ۱۲ سال سابقه تخصصی در درمان اضطراب، افسردگی و وسواس فکری-عملی با رویکرد CBT و طرحواره درمانی. مدرس کارگاه‌های بین‌المللی روانشناسی.',
    specialties: ['cbt', 'individual'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 12,
    tags: ['درمان فردی', 'اضطراب', 'CBT'],
  },
  {
    id: 'dr-ghadyani',
    name: 'خانم مرجان قدیانی',
    title: 'مشاور خانواده و ازدواج',
    degree: 'دکتری تخصصی مشاوره خانواده',
    avatar: '/staff/dr-ghadyani.jpg',
    bio: 'متخصص زوج‌درمانی و مشاوره پیش از ازدواج بر اساس پروتکل استاندارد گاتمن. همراه بیش از ۵۰۰ زوج در مسیر صمیمیت و حل تعارضات.',
    specialties: ['family'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 10,
    tags: ['زوج درمانی', 'مشاوره پیش از ازدواج'],
  },
  {
    id: 'dr-nejad-hosseini',
    name: 'خانم سعیده نژاد حسینی',
    title: 'روانشناس کودک و نوجوان',
    degree: 'کارشناسی ارشد روانشناسی کودک',
    avatar: '/staff/dr-nejad-hosseini.jpg',
    bio: 'متخصص بازی‌درمانی و درمان اختلالات رفتاری، اضطراب جدایی و اضطراب اجتماعی کودکان. مدرس دوره‌های تخصصی فرزندپروری.',
    specialties: ['child'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 9,
    tags: ['فرزندپروری', 'بازی درمانی'],
  },
  {
    id: 'dr-afshar',
    name: 'خانم زهره افشار',
    title: 'متخصص روان‌سنجی',
    degree: 'دکتری تخصصی سنجش و اندازه‌گیری',
    avatar: '/staff/dr-afshar.jpg',
    bio: 'ارزیاب رسمی هوش و استعداد درخشان، تست‌های تخصصی شخصیت‌شناسی (MMPI, NEO) و اختلالات یادگیری.',
    specialties: ['assessment'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person'],
    experienceYears: 11,
    tags: ['تست هوش', 'شخصیت‌شناسی'],
  },
  {
    id: 'dr-sajedi',
    name: 'خانم تینا ساجدی',
    title: 'روان‌درمانگر تحلیلی',
    degree: 'کارشناسی ارشد روانشناسی بالینی',
    avatar: '/staff/dr-sajedi.jpg',
    bio: 'تمرکز بر روانکاوی و درمان تحلیلی، سوگ، تروماهای کودکی و چالش‌های عمیق هویتی.',
    specialties: ['individual'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 8,
    tags: ['روانکاوی', 'درمان سوگ'],
  },
  {
    id: 'dr-shaghaghi',
    name: 'خانم پروانه شقاقی',
    title: 'روانشناس بالینی',
    degree: 'دکتری روانشناسی بالینی',
    avatar: '/staff/dr-shaghaghi.jpg',
    bio: 'درمانگر تخصصی اختلالات خلق‌وخو، افسردگی مقاوم به درمان و حملات پانیک با رویکرد CBT و مایندفولنس.',
    specialties: ['cbt', 'individual'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 14,
    tags: ['افسردگی', 'اختلالات خلقی'],
  },
  {
    id: 'dr-homayounian',
    name: 'خانم بدرالسادات همایونیان',
    title: 'مشاور ارشد تحصیلی و شغلی',
    degree: 'کارشناسی ارشد مشاوره شغلی',
    avatar: '/staff/dr-homayounian.jpg',
    bio: 'هدایت شغلی، برنامه‌ریزی کنکور و تحصیلات عالی، استعدادیابی متناسب با تیپ شخصیتی و کوچینگ عملکرد.',
    specialties: ['career'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 13,
    tags: ['استعدادیابی', 'برنامه‌ریزی'],
  },
  {
    id: 'dr-molazem',
    name: 'خانم اعظم ملازم',
    title: 'درمانگر حیطه وسواس',
    degree: 'کارشناسی ارشد روانشناسی بالینی',
    avatar: '/staff/dr-molazem.jpg',
    bio: 'درمان تخصصی OCD و وسواس‌های عملی فکری با متد مواجهه و جلوگیری از پاسخ (ERP) و رویکرد پذیرش و تعهد (ACT).',
    specialties: ['cbt', 'individual'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 10,
    tags: ['ACT', 'ERP'],
  },
  {
    id: 'dr-jalali',
    name: 'بی نظیر جلالی',
    title: 'روانشناس و هنر درمانگر',
    degree: 'کارشناسی ارشد روانشناسی',
    avatar: '/staff/dr-jalali.jpg',
    bio: 'ابراز هیجانات و بهبود خودشناسی از طریق هنردرمانی، نقاشی‌درمانی و تکنیک‌های روان‌شناختی خلاقانه.',
    specialties: ['individual'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 7,
    tags: ['هنر درمانی', 'خودشناسی'],
  },
  {
    id: 'dr-ahmadi',
    name: 'دکتر سارا احمدی',
    title: 'متخصص بازی‌درمانی و اختلالات رفتاری',
    degree: 'دکتری روانشناسی کودک',
    avatar: '/staff/dr-ahmadi.jpg',
    bio: 'بیش از ۱۰ سال سابقه در حوزه درمان تروما و اضطراب کودکان با محیط‌های مجهز بازی‌درمانی.',
    specialties: ['child'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person'],
    experienceYears: 10,
    tags: ['درمان اضطراب', 'فرزندپروری'],
  },
  {
    id: 'dr-rezaei',
    name: 'دکتر علی رضایی',
    title: 'متخصص روانشناسی نوجوان',
    degree: 'دکتری تخصصی روانشناسی',
    avatar: '/staff/dr-rezaei.jpg',
    bio: 'تمرکز بر چالش‌های بلوغ، هویت، هدایت رفتاری و بهبود روابط اجتماعی نوجوانان.',
    specialties: ['child', 'individual'],
    gender: 'male',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 11,
    tags: ['بلوغ', 'مهارت‌های ارتباطی'],
  },
  {
    id: 'dr-sohrabi',
    name: 'دکتر مریم سهرابی',
    title: 'متخصص روانشناسی خانواده و زوج درمانی',
    degree: 'دکتری روانشناسی خانواده',
    avatar: '/staff/dr-sohrabi.jpg',
    bio: 'روانشناس برجسته زناشویی با متد گاتمن و طرحواره‌درمانی هیجان‌مدار.',
    specialties: ['family'],
    gender: 'female',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 15,
    tags: ['درمان گاتمن', 'طرحواره درمانی'],
  },
  {
    id: 'dr-parsa',
    name: 'دکتر آرش پارسا',
    title: 'دکترای تخصصی مشاوره پیش از ازدواج',
    degree: 'دکتری مشاوره',
    avatar: '/staff/dr-parsa.jpg',
    bio: 'ارزیابی‌های تخصصی سنخ شخصیتی پیش از ازدواج با متد CBT و تحلیل رفتار متقابل (TA).',
    specialties: ['family'],
    gender: 'male',
    active: true,
    sessionTypes: ['in-person', 'online'],
    experienceYears: 12,
    tags: ['CBT', 'تحلیل رفتار متقابل'],
  }
];

export const MAIN_SERVICES: ServiceItem[] = [
  {
    id: 'adult-individual',
    title: 'مشاوره فردی بزرگسال',
    description: 'درمان تخصصی اضطراب، افسردگی، وسواس و چالش‌های زندگی شخصی با رویکردهای مدرن روانشناختی برای دستیابی به تعادل روانی پایدار.',
    icon: 'person',
    duration: '۴۵ دقیقه',
    format: 'حضوری و آنلاین',
    bgClass: 'bg-surface-container-low',
    targetScreen: 'adult-therapy'
  },
  {
    id: 'online-counseling',
    title: 'مشاوره آنلاین',
    description: 'دسترسی به بهترین متخصصان کلینیک بدون محدودیت جغرافیایی از طریق پلتفرم‌های تصویری امن و رمزنگاری شده.',
    icon: 'video_camera_front',
    format: 'سراسر دنیا',
    badge: 'دسترسی آسان',
    bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    targetScreen: 'services'
  },
  {
    id: 'couples-marriage',
    title: 'زوج‌درمانی و پیش از ازدواج',
    description: 'بهبود روابط عاطفی، حل تعارضات زناشویی و اتخاذ تصمیمات آگاهانه بر اساس تست‌های تخصصی برای شروع زندگی مشترک.',
    icon: 'favorite',
    duration: '۶۰ دقیقه',
    badge: 'تخصصی',
    bgClass: 'bg-surface-container-highest',
    targetScreen: 'marriage-therapy'
  },
  {
    id: 'child-play-therapy',
    title: 'کودک و نوجوان (بازی درمانی)',
    description: 'ارزیابی و درمان اختلالات رفتاری، اضطراب جدایی، بیش‌فعالی و پرخاشگری با استفاده از متدهای علمی بازی‌درمانی.',
    icon: 'child_care',
    duration: '۳ تا ۱۸ سال',
    bgClass: 'bg-primary-fixed text-on-primary-fixed',
    targetScreen: 'child-therapy'
  },
  {
    id: 'family-psychology',
    title: 'روانشناسی خانواده',
    description: 'حل تعارضات خانوادگی، بهبود الگوهای ارتباطی میان اعضای خانواده و تسهیل تعاملات مثبت.',
    icon: 'groups',
    duration: '۹۰ دقیقه',
    badge: 'جلسات گروهی',
    bgClass: 'bg-surface-container-low',
    targetScreen: 'services'
  },
  {
    id: 'academic-career',
    title: 'تحصیلی و شغلی',
    description: 'استعدادیابی تخصصی، برنامه‌ریزی تحصیلی و هدایت مسیر شغلی متناسب با ویژگی‌های شخصیتی و توانمندی‌ها.',
    icon: 'work',
    bgClass: 'bg-surface-container-high',
    targetScreen: 'services'
  },
  {
    id: 'psychological-assessment',
    title: 'ارزیابی‌های روانشناختی',
    description: 'اجرای آزمون‌های استاندارد هوش، شخصیت، سلامت روان و اختلالات یادگیری با ارائه گزارش‌های تحلیلی دقیق.',
    icon: 'assignment',
    bgClass: 'bg-secondary-fixed text-on-secondary-fixed',
    targetScreen: 'services'
  },
  {
    id: 'coaching-development',
    title: 'توسعه فردی و کوچینگ',
    description: 'برنامه‌های مدون برای افزایش اعتماد به نفس، مدیریت زمان، تاب‌آوری و بهبود مهارت‌های نرم زندگی.',
    icon: 'workspace_premium',
    badge: 'جامع‌ترین خدمات',
    bgClass: 'bg-surface-container-lowest border border-outline-variant',
    targetScreen: 'services'
  }
];

export const PLAY_THERAPY_GALLERY = [
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx3suYmpRCaVgqWnDmPXOSHhEBJ_RuL9btSXxCZbcu_EwlxOrb8Os_2BskOcr7Sdccu0eucS1FU8jqmUrDVp3H-qq2ng_f_SF8FGxqN2TjcN-Kz2CSdueM9bHrp15cRrqy3w7yPg7s3v-UY5ZlfyUNOo0Y2ag-FJXSFo7_PtGQBf7cYnGQBwxFGgnPY0Ag5dAXyAL2hJPuqmtT06L-lZ9fWS12FPUdFfBJaUziyucwXmHRevYzr2Ry6pNyNSR88USQb6Mf32ymDI0',
    title: 'میز شن‌بازی تخصصی',
    desc: 'میز شن تخصصی برای درمان غیرکلامی اضطراب و تروماهای خردسالی'
  },
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBY8huFtktjwSKFUFnEcMK0zi816de4Y-rkdyTK-9CPBlSnBTBNz4K6O1Z7NxWg_Ie_pEWrBnxHneXnDs2ABdtKDZRyUdvASYqy9pOIgSo-Ptq3f9SLPJNO5zZ0GeMRKabSdAGHmJCv69gy2uAhf1Hkgyi7lK1HdliDLBNnm-Tt_QkPnR_Thkc2lV5L33yIznQ2Jql2OkHBB29xbjmxsb-_KRB5HiIaGoqTxaWT5x-Pey8xiyZs4KbRHkfxYDJm4V7gLuB7c5aMDNc',
    title: 'گوشه هنر درمانی',
    desc: 'بخش هنری مجهز با وسایل سفال‌گری و نقاشی جهت تخلیه هیجانی'
  },
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzwbdHAwpqAUFm9aI1dhQ4Oafz7A2wfSX1WNlWUhx98U5sxrg4APROfdnIZo2t_oeZ1SLMPQCq9CbGGf2nDUERd1iQk78lP6MYerWqoko5NDUuz5N5zWgD4GmX3-pXYgAPkb6a3bS2c7wNJRIgs8TC33lcrBWqyGipOmneTQeI_ZaB6a_Lv3SMEhih1GFhhCImzx1RzW9HROOwFmtt1kOLXRHsYehGPNk8BnQVe5sWhYn93SS8EZ43SqwoDuhktmaF0Cl5Q7-7KRI',
    title: 'کنج کتاب خوانی کودکان',
    desc: 'محیطی صمیمی برای داستان‌درمانی و تقویت هوش هیجانی'
  },
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOaE_Vt67j5X0pq4fqHbb0M_iSVnj7gnSiBdjllwTLsWnu1WA4KYaVuoUeWANyU05maSeqZp4vl79WmDGctZigqbKP_0Lz8kZx_n7HeICNaJ1obT2Ioz_o1XAuEajl34Xxy7SntuOu9z2lm_4EBq3th_Kas3roqg3fkDIF1IBlD6wTh-8_1gg95tWpEZc11wV5oEffYDqta8wj-IXWkJ3Nhe2G0FYQHrrabQ00CiutAkh13POaOk06tMgA2i7iXTWFW3Nfn3vxi1M',
    title: 'سیستم مشاهده غیرمستقیم',
    desc: 'اتاق استاندارد با آینه یک‌طرفه جهت تحلیل رفتاری دقیق متخصص'
  }
];

export const PHYSICAL_GALLERY = [
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwgM1zHW1pgzyqlaYvis7cGxkGijSlxPO8zx8U6l1Vaji4aWAHmZ5Kwws7_CHYdycJ6IUfTKOq9Fv7xGina4x_PvH5FuqgXACBv-0A2FJX7nY_HKJPBT9GhHYUnH4516s6zUZ7IpcCQTjc7I668UxGn6SqIvlmYqWfKAYaCJ2l8HIT0zA6c17GaJwo-9HQKreiC82LJ-zJuNLuo8yEBz7iDJH1n_y8qQ-XrTd-JUBIFbu5olDogZMVhnOfxUDpRROgjZqEe1Rs_iY',
    title: 'سالن انتظار آرامش VIP',
    desc: 'فضای انتظار طراحی شده بر اساس اصول روانشناسی رنگ و نور'
  },
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH9B55DF8zSmIIG4CVGuDIE_tMQN0e4bVr731ywBzrYZCjP4bdNtFU9LuoAw-hPgfwFm5JhQekz2j-hlcAJhDb1vsEGCpOo7aQyTFjviJp4aiDhvCBJZ1FlxEsu3SMs0gtssgGK7cSsreVCloQ-M01tgbhWxwcdbxcvNjV_1HxxlCT-WZfj2_xtNktKiVwloLGAyG6AlsFog7FYV7teZhXPiZ11mCtHjft3MaB8bCqhfD1TDky1mlM2REHo5udDa9AU1Zmfu7I0d8',
    title: 'اتاق مشاوره انفرادی',
    desc: 'محیط عایق صدا و ارگونومیک جهت احساس امنیت کامل مراجع'
  },
  {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNWvWsSz39v60yg1PWDwny4SeVGYESDdvF5TagNRkEjTReAEGpDvNpM5m0zzM-r6xi94lBYDZR6WWaW-kb0ctRusJTM_-a4hxNldusjZQp_p7V_GSXZn13HeDdfH0S715mS9DO33N2Qb5WtvtQFxzNmjM3QtwOytaMihiHdFjMVBWi7qYfrH32cmsner0df9x14EC793wMSh-f3yGlEQZmLt09M8cuXfZFB_TkVvrV9z-sUPt2EbYOWNrd7UV4AcmkKJ_g_O1c-jg',
    title: 'اتاق مدیریت و مشاوره ارشد',
    desc: 'تجهیزات مدرن تشخیصی و فضایی دلنشین برای گفت‌وگو'
  }
];

export const FAQS_GENERAL: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'چگونه بفهمم چه نوع مشاوره‌ای برای من یا فرزندو همسرم مناسب است؟',
    answer: 'شما می‌توانید از گزینه "مشاوره رایگان انتخاب درمانگر" یا تماس با شماره ۰۲۱-۸۸۷۷۶۶۵۵ استفاده کنید. همکاران پذیرش با پرسیدن چند سوال اولیه، بهترین متخصص را متناسب با موضوع شما پیشنهاد می‌دهند.'
  },
  {
    id: 'faq-2',
    question: 'مدت زمان و هزینه هر جلسه مشاوره چقدر است؟',
    answer: 'جلسات فردی معمولاً ۴۵ تا ۵۰ دقیقه، جلسات زوج‌درمانی ۶۰ تا ۹۰ دقیقه و جلسات مشاوره آنلاین ۴۵ دقیقه است. تعرفه‌ها مطابق با مصوبه سازمان نظام روانشناسی تعیین شده است.'
  },
  {
    id: 'faq-3',
    question: 'آیا اطلاعات مطرح شده در جلسات محرمانه باقی می‌ماند؟',
    answer: 'بله، تمامی جلسات و پرونده‌های مراجعین در چارچوب اصول اخلاق حرفه‌ای سازمان نظام روانشناسی، کاملاً محرمانه نگه داشته می‌شوند.'
  },
  {
    id: 'faq-4',
    question: 'نحوه برگزاری جلسات آنلاین چگونه است؟',
    answer: 'جلسات آنلاین از طریق بستر اختصاصی و امن تصویری برگزار می‌شود. پس از ثبت نوبت، لینک مستقیم ورود به بستر تصویری برای شما پیامک می‌گردد.'
  }
];

export const FAQS_CHILD: FAQItem[] = [
  {
    id: 'cfaq-1',
    question: 'چگونه بفهمم فرزندم به مشاوره نیاز دارد؟',
    answer: 'تغییرات ناگهانی در رفتار، افت تحصیلی، کابوس‌های شبانه، گوشه‌گیری یا پرخashگری مداوم می‌توانند نشانه‌هایی باشند که کودک برای پردازش احساساتش نیاز به کمک تخصصی دارد.'
  },
  {
    id: 'cfaq-2',
    question: 'حداقل سن برای شروع بازی‌درمانی چقدر است؟',
    answer: 'به طور معمول بازی‌درمانی برای کودکان از سن ۳ تا ۱۲ سال بسیار موثر است. برای سنین پایین‌تر، تمرکز اصلی بر مشاوره والد و کودک و تقویت دلبستگی ایمن است.'
  },
  {
    id: 'cfaq-3',
    question: 'تعداد جلسات معمولاً چقدر است؟',
    answer: 'تعداد جلسات کاملاً بستگی به نوع چالش و پاسخ‌دهی کودک دارد. معمولاً یک دوره ۱۲ تا ۲۰ جلسه‌ای برای مشاهده تغییرات پایدار توصیه می‌شود.'
  },
  {
    id: 'cfaq-4',
    question: 'آیا والدین هم باید در جلسات حضور داشته باشند؟',
    answer: 'در بازی‌درمانی کلاسیک، جلسات کودک به صورت فردی است، اما به موازات آن، جلسات منظم ماهانه با والدین برای گزارش پیشرفت و ارائه راهکار برگزار می‌شود.'
  }
];

export const FAQS_ADULT: FAQItem[] = [
  {
    id: 'afaq-1',
    question: 'هر جلسه مشاوره فردی چقدر زمان می‌برد؟',
    answer: 'هر جلسه استاندارد مشاوره فردی بین ۴۵ تا ۵۰ دقیقه زمان می‌برد. در جلسات اول (ارزیابی) ممکن است با توافق قبلی این زمان تا ۶۰ دقیقه نیز افزایش یابد.'
  },
  {
    id: 'afaq-2',
    question: 'آیا جلسات مشاوره به صورت آنلاین هم برگزار می‌شوند؟',
    answer: 'بله، کلینیک ما بستر امنی برای جلسات تصویری آنلاین فراهم کرده است تا عزیزانی که در خارج از کشور یا شهرهای دیگر حضور دارند، بتوانند از خدمات تخصصی بهره‌مند شوند.'
  },
  {
    id: 'afaq-3',
    question: 'تعداد جلسات مورد نیاز چطور تعیین می‌شود؟',
    answer: 'تعداد جلسات کاملاً بستگی به نوع چالش و رویکرد درمانی دارد. معمولاً پس از ۲ یا ۳ جلسه ارزیابی اول، درمانگر با مشورت شما یک نقشه راه و برآورد زمانی ارائه می‌دهد.'
  }
];

export const FAQS_MARRIAGE: FAQItem[] = [
  {
    id: 'mfaq-1',
    question: 'مشاوره پیش از ازدواج چند جلسه زمان می‌برد؟',
    answer: 'به طور معمول بین ۴ تا ۸ جلسه برای بررسی کامل جنبه‌های شخصیتی، ارزش‌ها و مهارت‌های ارتباطی نیاز است. با این حال، با توجه به نیاز هر زوج این تعداد می‌تواند تغییر کند.'
  },
  {
    id: 'mfaq-2',
    question: 'آیا اگر همسرم تمایلی به شرکت در جلسات نداشته باشد، می‌توانم تنهایی بیایم؟',
    answer: 'بله، قطعاً. تغییر در یک ضلع رابطه می‌تواند منجر به تغییر در کل سیستم شود. در جلسات فردی، ما روی مهارت‌های شما و نحوه واکنش‌تان به رفتارهای همسر کار می‌کنیم.'
  },
  {
    id: 'mfaq-3',
    question: 'آیا اطلاعات جلسات محرمانه باقی می‌ماند؟',
    answer: 'رازداری و محرمانگی، هسته اصلی اخلاق حرفه‌ای ماست. تمام گفتگوها و اطلاعات شما در محیطی امن و کاملاً محرمانه باقی خواهد ماند.'
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: '۱۰ راهکار علمی و کاربردی برای غلبه بر اضطراب روزمره',
    slug: 'overcoming-daily-anxiety',
    authorId: 'dr-deihimi',
    authorName: 'خانم مرجانه دیهیمی',
    authorAvatar: '/staff/dr-deihimi.jpg',
    category: 'سلامت روان و اضطراب',
    summary: 'اضطراب مزمن انرژی ذهنی ما را تحلیل می‌برد. در این مقاله تکنیک‌های استاندارد CBT و تنفس دیافراگمی را مرور می‌کنیم.',
    content: `
# ۱۰ راهکار علمی و کاربردی برای غلبه بر اضطراب روزمره

اضطراب یکی از شایع‌ترین واکنش‌های طبیعی بدن به فشارهای روانی است. اما زمانی که مداوم و بی‌دلیل تجربه شود، می‌تواند سلامت جسمی و روانی شما را به خطر اندازد.

## ۱. تکنیک تنفس مربع (Box Breathing)
تنفس عمیق کنترل‌شده فوراً سیستم عصب پاراسمپاتیک شما را فعال کرده و ضربان قلب را پایین می‌آورد.
- ۴ ثانیه دم
- ۴ ثانیه نگه‌داشتن نفس
- ۴ ثانیه بازدم
- ۴ ثانیه مکث

## ۲. بازنویسی افکار کارآمد (CBT)
به جای تسلیم شدن در برابر سناریوهای فاجعه‌ساز، از خود بپرسید: "واقع‌بینانه‌ترین احتمالی که ممکن است رخ دهد چیست؟"

## ۳. کاهش مصرف کافئین
کافئین موجود در قهوه و نوشابه‌های انرژی‌زا علائم جسمی اضطراب مانند تپش قلب و لرزش دست را تشدید می‌کند.
    `,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe1dXMDn_23JKLDcC4xG7u5z2K-9e7BHx1iv3F0_ob1YhOh2KRT6i-PXvtaDylIthNtv8Db9wWCPhT7yLE3Qv7RQFmwmf2PV-4Wb1KHsNII3cQDWJQy9EKs5e3buxSGu0u4SG6cru9e84OwKkH4A34wIgkAbsI38hfbv3_fr4-k1sQ2ImRGPfgAchK-Wp3P2Ram9pJGlY_Po_lnTaAJQqrRdQeb4mTwMc_f5WTBskLWmXrJFooydAWM6t7rbksIk12MZrah430t5s',
    publishedAt: '۱۴۰۳/۰۴/۲۰',
    readTime: '۶ دقیقه',
    views: 1240,
    status: 'published',
    tags: ['اضطراب', 'CBT', 'آرامش']
  },
  {
    id: 'art-2',
    title: 'نقش بازی‌درمانی در درمان اضطراب جدایی کودکان',
    slug: 'play-therapy-child-anxiety',
    authorId: 'dr-nejad-hosseini',
    authorName: 'خانم سعیده نژاد حسینی',
    authorAvatar: '/staff/dr-nejad-hosseini.jpg',
    category: 'کودک و نوجوان',
    summary: 'کودکان احساسات و ترس‌های خود را در قالب کلمات بیان نمی‌کنند، بلکه بازی زبان اصلی آن‌ها برای ابراز اضطراب است.',
    content: `
# نقش بازی‌درمانی در درمان اضطراب جدایی کودکان

اضطراب جدایی یکی از شایع‌ترین دغدغه‌های والدین هنگام ورود کودک به مهدکودک یا مدرسه است.

## چرا بازی‌درمانی پاسخ می‌دهد؟
بازی زبان طبیعی کودک است. درمانگر از طریق عروسک‌ها، میز شن و وسایل نقاشی، فضای امنی ایجاد می‌کند تا کودک ترس رها شدن را تخلیه کند.

## توصیه‌هایی به والدین
- هرگز بدون خداحافظی کودک را ترک نکنید.
- زمان دقیق بازگشت خود را به زبان ساده مشخص کنید (مثلاً: "بعد از زنگ ناهار برمی‌گردم").
    `,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx3suYmpRCaVgqWnDmPXOSHhEBJ_RuL9btSXxCZbcu_EwlxOrb8Os_2BskOcr7Sdccu0eucS1FU8jqmUrDVp3H-qq2ng_f_SF8FGxqN2TjcN-Kz2CSdueM9bHrp15cRrqy3w7yPg7s3v-UY5ZlfyUNOo0Y2ag-FJXSFo7_PtGQBf7cYnGQBwxFGgnPY0Ag5dAXyAL2hJPuqmtT06L-lZ9fWS12FPUdFfBJaUziyucwXmHRevYzr2Ry6pNyNSR88USQb6Mf32ymDI0',
    publishedAt: '۱۴۰۳/۰۴/۱۵',
    readTime: '۵ دقیقه',
    views: 890,
    status: 'published',
    tags: ['بازی درمانی', 'فرزندپروری', 'کودک']
  },
  {
    id: 'art-3',
    title: 'اصول گفتگو بدون گارد در روابط زناشویی (متد گاتمن)',
    slug: 'gottman-marriage-communication',
    authorId: 'dr-ghadyani',
    authorName: 'خانم مرجان قدیانی',
    authorAvatar: '/staff/dr-ghadyani.jpg',
    category: 'ازدواج و زوجین',
    summary: 'بررسی ۴ سوار سرنوشت‌ساز لغو صمیمیت (انتقاد، تحقیر، حالت دفاعی و دیوارکشی) و جایگزین‌های سالم آن‌ها.',
    content: `
# اصول گفتگو بدون گارد در روابط زناشویی

جان گاتمن پس از ۴۰ سال پژوهش روی هزاران زوج، به این نتیجه رسید که نحوه مدیریت اختلافات تعیین‌کننده دوام رابطه است.

## ۴ رفتار خطرناک در گفتگو:
۱. **انتقاد شخصیتی:** به جای حمله به شخصیت ("تو همیشه بی‌مسئولیتی!")، احساس خود را مطرح کنید ("من وقتی قرار را فراموش می‌کنی دلگیر می‌شوم").
۲. **تحقیر:** استفاده از تمسخر و زبان بدن توهین‌آمیز.
۳. **حالت دفاعی:** شانه خالی کردن از مسئولیت.
۴. **دیوارکشی:** سکوت و ترک گفتگو.
    `,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeSLgnKpImcpOx-GjmdRz2jCdvrXg6C6uHwVHr4M_Ou_BFEaJZX5Gwe5l20NVDRIXkXKXZpMigdwIEZN0gOgr5afflN1SUkWS89CUBs3BkGq1U56b7gWlcn6j2Z5hK97D84ix0u2m-rPBD6rDEAn4M7qTn7DfoqpluLJyEJ7xZV75b53RPCHOKzoQOYqS8XiPWkR_OLqqjJKsDM5ko7z5lo3OE4NsDZ4KZsxeFDqOjdbAN3MaPjgryoF3pPubvy6xqyD2bKNCvSEk',
    publishedAt: '۱۴۰۳/۰۴/۱۰',
    readTime: '۸ دقیقه',
    views: 1560,
    status: 'published',
    tags: ['زوج درمانی', 'گاتمن', 'صمیمیت']
  }
];

export const FAQ_CATEGORIES = [
  { id: 'all', title: 'همه سوالات', icon: 'quiz' },
  { id: 'adult', title: 'مشاوره فردی و بزرگسال', icon: 'person', serviceTitle: 'مشاوره فردی' },
  { id: 'child', title: 'کودک و نوجوان', icon: 'child_care', serviceTitle: 'کودک و نوجوان' },
  { id: 'marriage', title: 'زوج درمانی و خانواده', icon: 'favorite', serviceTitle: 'زوج درمانی' },
  { id: 'neurofeed', title: 'نوروفیدبک و نقشه مغزی', icon: 'psychology', serviceTitle: 'نوروفیدبک و روانسنجی' },
  { id: 'online', title: 'مشاوره آنلاین و غیرحضوری', icon: 'devices', serviceTitle: 'جلسات آنلاین' },
  { id: 'general', title: 'سوالات عمومی و نوبت‌دهی', icon: 'help_outline', serviceTitle: 'پشتیبانی کلینیک' },
];

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'adult',
    serviceTitle: 'مشاوره فردی و درمان افسردگی',
    question: 'تفاوت روانشناس و روانپزشک چیست و برای افسردگی به کدام مراجعه کنم؟',
    answer: 'روانپزشک پزشک متخصص است که می‌تواند دارودرمانی انجام دهد. روانشناس (درمانگر) از روش‌های روان‌درمانی مانند شناختی-رفتاری (CBT) یا طرحواره درمانی استفاده می‌کند. در جلسات اولیه روانشناسی ارزیابی می‌شوید و در صورت نیاز شدید به دارو، به روانپزشک ارجاع داده خواهید شد.',
    askedBy: 'مریم ک.',
    date: '۱۴۰۳/۰۴/۱۸',
    status: 'approved',
    responderName: 'دکتر مرجانه دیهیمی',
    likesCount: 24,
  },
  {
    id: 'faq-2',
    category: 'adult',
    serviceTitle: 'درمان اضطراب و وسواس',
    question: 'هر جلسه مشاوره فردی چقدر زمان می‌برد و چند جلسه نیاز است؟',
    answer: 'مدت زمان استاندارد هر جلسه مشاوره فردی ۴۵ الی ۵۰ دقیقه است. تعداد جلسات بسته به نوع مسئله، شدت اضطراب یا طرحواره‌ها متغیر است، اما معمولاً پروژه‌های درمان شناختی رفتاری بین ۸ تا ۱۶ جلسه به طول می‌انجامند.',
    askedBy: 'امیرحسین ر.',
    date: '۱۴۰۳/۰۴/۱۵',
    status: 'approved',
    responderName: 'دکتر مرجانه دیهیمی',
    likesCount: 18,
  },
  {
    id: 'faq-3',
    category: 'child',
    serviceTitle: 'بازی درمانی و اضطراب کودک',
    question: 'از چه سنی می‌توان کودک را برای بازی‌درمانی و سنجش به کلینیک آورد؟',
    answer: 'بازی درمانی تخصصی معمولاً از سن ۳ سالگی به بالا کاربرد دارد. برای کودکان زیر ۳ سال، جلسات مشاوره فرزندپروری و آموزش والدگری با حضور والدین انجام می‌شود.',
    askedBy: 'زهرا م. (والد)',
    date: '۱۴۰۳/۰۴/۲۰',
    status: 'approved',
    responderName: 'خانم سعیده نژاد حسینی',
    likesCount: 31,
  },
  {
    id: 'faq-4',
    category: 'child',
    serviceTitle: 'اختلال بیش‌فعالی (ADHD)',
    question: 'آیا برای تشخیص بیش‌فعالی کودک تست یا نقشه مغزی لازم است؟',
    answer: 'تشخیص بیش‌فعالی بر اساس مصاحبه بالینی استاندارد، تست‌های روانسنجی توجه و تمرکز (مانند IVA) و در صورت لزوم نقشه مغزی (QEEG) انجام می‌گیرد تا نوع دقیق نقص توجه مشخص شود.',
    askedBy: 'علی رضایی',
    date: '۱۴۰۳/۰۴/۱۲',
    status: 'approved',
    responderName: 'خانم سعیده نژاد حسینی',
    likesCount: 15,
  },
  {
    id: 'faq-5',
    category: 'marriage',
    serviceTitle: 'زوج درمانی و مشاوره پیش از ازدواج',
    question: 'آیا در جلسات زوج‌درمانی حضور هر دو نفر الزامی است؟',
    answer: 'بله، برای زوج‌درمانی کارآمد حضور هر دو طرف ضروری است. البته ممکن است درمانگر در روند درمان، جلسات انفرادی تک‌نفره نیز برای هر یک از زوجین تنظیم کند.',
    askedBy: 'سامان و نیلوفر',
    date: '۱۴۰۳/۰۴/۲۲',
    status: 'approved',
    responderName: 'خانم مرجان قدیانی',
    likesCount: 42,
  },
  {
    id: 'faq-6',
    category: 'marriage',
    serviceTitle: 'مشاوره پیش از ازدواج',
    question: 'تست‌های مشاوره قبل از ازدواج چقدر صحت در پیش‌بینی موفقیت رابطه دارند؟',
    answer: 'تست‌های روانسنجی معتبر (مانند NEO و انریچ) ابزار کالیبره‌شده‌ای برای شناخت تفاوت‌های شخصیتی، ارزش‌ها و حل تعارضات هستند. این تست‌ها در کنار مصاحبه تخصصی بالینی شفافیت بالایی ایجاد می‌کنند.',
    askedBy: 'رضا ف.',
    date: '۱۴۰۳/۰۴/۱۰',
    status: 'approved',
    responderName: 'خانم مرجان قدیانی',
    likesCount: 29,
  },
  {
    id: 'faq-7',
    category: 'neurofeed',
    serviceTitle: 'نوروفیدبک و لورتا',
    question: 'آیا جلسات نوروفیدبک عوارض جانبی دارند و اثر آن چقدر ماندگار است؟',
    answer: 'نوروفیدبک یک روش کاملاً غیرتهاجمی و یادگیری سلول‌های مغزی است و هیچ‌گونه عوارض دارویی ندارد. اثرات آن پس از تکمیل دوره درمانی (معمولاً ۲۰ تا ۳۰ جلسه) ماندگار و تثبیت‌شده خواهد بود.',
    askedBy: 'محسن ک.',
    date: '۱۴۰۳/۰۴/۰۵',
    status: 'approved',
    responderName: 'دکتر مرجانه دیهیمی',
    likesCount: 37,
  },
  {
    id: 'faq-8',
    category: 'online',
    serviceTitle: 'مشاوره تصویری و آنلاین',
    question: 'کیفیت و اثربخشی جلسات آنلاین نسبت به حضوری چگونه است؟',
    answer: 'پژوهش‌های متعدد نشان داده که جلسات آنلاین (به‌ویژه مشاوره فردی و روان‌درمانی شناختی) کیفیتی کاملاً برابر با جلسات حضوری دارند. این جلسات در بستر امن و اختصاصی برگزار می‌شوند.',
    askedBy: 'سارا از آلمان',
    date: '۱۴۰۳/۰۴/۰۱',
    status: 'approved',
    responderName: 'دکتر مرجانه دیهیمی',
    likesCount: 19,
  },
  {
    id: 'faq-9',
    category: 'general',
    serviceTitle: 'نوبت‌دهی و قوانین لغو',
    question: 'شرایط کنسلی یا تغییر زمان نوبت در کلینیک ژینو چگونه است؟',
    answer: 'مراجعه‌کنندگان محترم می‌توانند تا ۲۴ ساعت قبل از زمان تعیین‌شده، بدون جریمه نوبت خود را تغییر داده یا جابه‌جا کنند. لغو در کمتر از ۲۴ ساعت مشمول کسر درصدی از کنسلی خواهد بود.',
    askedBy: 'پشتیبانی کلینیک',
    date: '۱۴۰۳/۰۳/۲۵',
    status: 'approved',
    responderName: 'مدیریت کلینیک ژینو',
    likesCount: 50,
  },
];


