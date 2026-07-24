import { SERVICE_LANDING_DATA, ServiceLandingDetail } from '../data/serviceLandingData';
import type { ServiceBlock, ServiceItem, ServicePageBuilder } from '../types';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  cta: 'فراخوان اقدام (CTA)',
  richText: 'متن آزاد',
  otherServices: 'سایر خدمات (چیپ)',
  servicesGrid: 'شبکه خدمات',
  contactCards: 'کارت‌های تماس',
  contactForm: 'فرم تماس',
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
};

export const BLOCK_ICONS: Record<string, string> = {
  hero: 'web_asset',
  pageHero: 'crop_landscape',
  heroHeader: 'view_quilt',
  highlights: 'grid_view',
  symptoms: 'psychology',
  process: 'timeline',
  features: 'stars',
  doctors: 'groups',
  testimonials: 'format_quote',
  faqs: 'help',
  cta: 'campaign',
  richText: 'notes',
  otherServices: 'apps',
  servicesGrid: 'view_module',
  contactCards: 'contact_mail',
  contactForm: 'mail',
  articlesGrid: 'newspaper',
  imageCarousel: 'view_carousel',
  videoPlayer: 'smart_display',
  container: 'view_column',
  icon: 'interests',
  iconList: 'checklist',
  button: 'smart_button',
  staffCarousel: 'view_carousel',
  googleMap: 'map',
  tabGallery: 'tab',
};

/** Widgets safe to nest inside container columns */
export const NESTABLE_WIDGET_TYPES: ServiceBlock['type'][] = [
  'richText',
  'imageCarousel',
  'videoPlayer',
  'features',
  'highlights',
  'cta',
  'contactCards',
  'icon',
  'iconList',
  'button',
  'googleMap',
];

export const WIDGET_GROUPS: Array<{
  id: string;
  label: string;
  types: ServiceBlock['type'][];
}> = [
  {
    id: 'layout',
    label: 'چیدمان',
    types: ['container', 'heroHeader', 'pageHero', 'hero'],
  },
  {
    id: 'media',
    label: 'رسانه',
    types: ['imageCarousel', 'videoPlayer', 'icon', 'googleMap', 'tabGallery'],
  },
  {
    id: 'content',
    label: 'محتوا',
    types: ['richText', 'highlights', 'features', 'iconList', 'button', 'process', 'symptoms', 'cta'],
  },
  {
    id: 'clinic',
    label: 'کلینیک',
    types: [
      'doctors',
      'staffCarousel',
      'servicesGrid',
      'otherServices',
      'articlesGrid',
      'testimonials',
      'faqs',
      'contactCards',
      'contactForm',
    ],
  },
];

export function landingToBlocks(landing: ServiceLandingDetail): ServicePageBuilder {
  const blocks: ServiceBlock[] = [
    {
      id: uid('hero'),
      type: 'hero',
      props: {
        title: landing.title,
        subtitle: landing.subtitle,
        badge: landing.badge,
        heroImage: landing.heroImage,
        duration: landing.duration,
        format: landing.format,
        satisfactionRate: landing.satisfactionRate,
        sessionFeeNote: landing.sessionFeeNote || '',
      },
    },
    {
      id: uid('highlights'),
      type: 'highlights',
      props: { items: landing.highlights },
    },
    {
      id: uid('symptoms'),
      type: 'symptoms',
      props: {
        title: landing.symptomsTitle,
        subtitle: landing.symptomsSubtitle,
        items: landing.symptoms,
      },
    },
    {
      id: uid('process'),
      type: 'process',
      props: {
        title: 'مراحل مشاوره و درمان در کلینیک ژینو',
        eyebrow: 'فرآیند دریافت خدمت',
        steps: landing.processSteps,
      },
    },
    {
      id: uid('features'),
      type: 'features',
      props: {
        title: landing.featuresTitle,
        items: landing.features,
      },
    },
    {
      id: uid('doctors'),
      type: 'doctors',
      props: {
        title: 'روانشناسان و درمانگران این خدمت',
        subtitle: 'متخصصین دارای پروانه نظام روانشناسی و حداقل ۸ سال سابقه تخصصی',
        specialtiesFilter: landing.specialtiesFilter,
        maxCount: 3,
      },
    },
    {
      id: uid('testimonials'),
      type: 'testimonials',
      props: {
        title: 'نظرات و تجربیات مراجعین این خدمت',
        subtitle: 'بازخورد واقعی مراجعین کلینیک روانشناسی ژینو',
        items: landing.testimonials,
      },
    },
    {
      id: uid('faqs'),
      type: 'faqs',
      props: {
        title: 'سوالات متداول درباره این خدمت',
        subtitle: 'پاسخ شفاف به ابهامات متداول شما',
        items: landing.faqs,
      },
    },
    {
      id: uid('other'),
      type: 'otherServices',
      props: {
        title: 'مشاهده سایر خدمات و دپارتمان‌های کلینیک ژینو',
      },
    },
    {
      id: uid('cta'),
      type: 'cta',
      props: {
        badge: 'گام اول به سوی سلامت و آرامش روانی',
        title: 'همین امروز نوبت مشاوره خود را رزرو کنید',
        subtitle:
          'فرآیند رزرو نوبت کمتر از ۲ دقیقه زمان می‌برد. امکان دریافت نوبت‌های حضوری در مطب یا مشاوره ویدیویی آنلاین موجود است.',
        phoneLabel: 'تماس با پذیرش (۰۲۱-۸۸۷۷۶۶۵۵)',
        phoneHref: 'tel:02188776655',
      },
    },
  ];

  return { version: 1, blocks };
}

export function createDefaultPageBuilder(service: Pick<ServiceItem, 'id' | 'title' | 'description' | 'duration' | 'format'>): ServicePageBuilder {
  const landing = SERVICE_LANDING_DATA[service.id];
  if (landing) return landingToBlocks(landing);

  return {
    version: 1,
    blocks: [
      {
        id: uid('hero'),
        type: 'hero',
        props: {
          title: service.title,
          subtitle: service.description,
          badge: 'دپارتمان تخصصی ژینو',
          heroImage:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000',
          duration: service.duration || '۴۵ تا ۶۰ دقیقه',
          format: service.format || 'حضوری و آنلاین',
          satisfactionRate: '۹۸٪ رضایت مراجعین',
          sessionFeeNote: '',
        },
      },
      {
        id: uid('cta'),
        type: 'cta',
        props: {
          badge: 'گام اول به سوی سلامت و آرامش روانی',
          title: 'همین امروز نوبت مشاوره خود را رزرو کنید',
          subtitle: 'فرآیند رزرو نوبت کمتر از ۲ دقیقه زمان می‌برد.',
          phoneLabel: 'تماس با پذیرش (۰۲۱-۸۸۷۷۶۶۵۵)',
          phoneHref: 'tel:02188776655',
        },
      },
    ],
  };
}

export function getPageBuilderForService(service: ServiceItem): ServicePageBuilder {
  if (service.pageBuilder?.blocks?.length) {
    return service.pageBuilder;
  }
  return createDefaultPageBuilder(service);
}

export function enrichServicesWithPageBuilder(services: ServiceItem[]): ServiceItem[] {
  return services.map((s) => ({
    ...s,
    pageBuilder: getPageBuilderForService(s),
  }));
}

export function createEmptyBlock(type: ServiceBlock['type']): ServiceBlock {
  const defaults: Record<ServiceBlock['type'], Record<string, unknown>> = {
    hero: {
      title: 'عنوان خدمت',
      subtitle: 'توضیح کوتاه خدمت',
      badge: 'دپارتمان تخصصی',
      heroImage:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000',
      duration: '۴۵ دقیقه',
      format: 'حضوری و آنلاین',
      satisfactionRate: '۹۸٪ رضایت',
      sessionFeeNote: '',
    },
    pageHero: {
      badge: 'برچسب صفحه',
      title: 'عنوان صفحه',
      subtitle: 'توضیح کوتاه صفحه',
      showBooking: true,
      primaryCtaLabel: 'رزرو نوبت',
      secondaryCtaLabel: '',
      secondaryCtaScreen: 'services',
      imageMode: 'side',
      heroImage: '',
      imageAlt: '',
      overlayOpacity: 45,
    },
    heroHeader: {
      badge: 'مرکز روان‌درمانی و مشاوره ژینو',
      statusText: 'پذیرش فعال',
      showStatus: true,
      title: 'پناهگاهی برای یافتن آرامش و تعادل روان',
      titleHighlight: 'آرامش و تعادل روان',
      subtitle:
        'با بهره‌گیری از متدهای علمی روز دنیا شامل CBT، طرحواره درمانی و نوروفیدبک لورتا، مسیر درمان اختصاصی شما را طراحی می‌کنیم.',
      contentAlign: 'start',
      mediaSide: 'end',
      titleSize: 'lg',
      accentColor: 'primary',
      sectionPadding: 'md',
      mediaRadius: 32,
      showCta: true,
      ctaLabel: 'راهنمای آنلاین انتخاب درمانگر',
      ctaIcon: 'psychology',
      ctaAction: 'guide',
      ctaLink: '',
      ctaVariant: 'outline',
      departmentsTitle: 'دپارتمان‌های فعال برای دریافت خدمت فوری:',
      showDepartments: true,
      departments: [
        { icon: 'person', label: 'مشاوره فردی بزرگسال' },
        { icon: 'toys', label: 'بازی درمانی کودک' },
        { icon: 'favorite', label: 'مشاوره ازدواج' },
        { icon: 'neurology', label: 'نوروفیدبک' },
      ],
      showCarousel: true,
      carouselAutoplay: true,
      carouselIntervalMs: 5000,
      showCarouselDots: true,
      showCarouselArrows: true,
      showRatingBadge: true,
      showFloatingBadge: true,
      slides: [
        {
          image:
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
          badge: 'اتاق مشاوره',
          title: 'اتاق تخصصی مشاوره و روان‌درمانی',
          description: 'فضای آرام با نور طبیعی، مبلمان ارگونومیک و حریم خصوصی کامل',
          rating: '۴.۹ از ۵.۰',
          floatingBadge: 'نوبت‌دهی آنلاین ۲۴/۷',
          floatingIcon: 'calendar_month',
        },
        {
          image:
            'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200',
          badge: 'جلسه درمانی',
          title: 'فضای امن برای گفت‌وگو و درمان',
          description: 'طراحی‌شده برای جلسات فردی، زوج و خانواده با استانداردهای حرفه‌ای',
          rating: '۴.۸ از ۵.۰',
          floatingBadge: 'رزرو حضوری و آنلاین',
          floatingIcon: 'event_available',
        },
      ],
      showStats: true,
      stats: [
        { icon: 'verified', value: '+۱۲,۰۰۰', label: 'جلسه موفق درمانی' },
        { icon: 'sentiment_satisfied', value: '۹۸.۴٪', label: 'رضایت مراجعین' },
        { icon: 'groups', value: '+۱۵', label: 'روانشناس و درمانگر ارشد' },
      ],
    },
    highlights: {
      items: [
        { icon: 'schedule', label: 'مدت جلسه', value: '۴۵ دقیقه' },
        { icon: 'videocam', label: 'روش', value: 'حضوری / آنلاین' },
      ],
      columnsMobile: 1,
      columnsTablet: 2,
      columnsDesktop: 4,
    },
    symptoms: {
      title: 'چه زمانی مراجعه ضرورت دارد؟',
      subtitle: 'اگر با این چالش‌ها روبه‌رو هستید...',
      items: [{ icon: 'psychology', title: 'عنوان', desc: 'توضیح کوتاه' }],
    },
    process: {
      title: 'مراحل دریافت خدمت',
      eyebrow: 'فرآیند',
      steps: [
        { number: '۰۱', title: 'گام اول', desc: 'توضیح' },
        { number: '۰۲', title: 'گام دوم', desc: 'توضیح' },
      ],
    },
    features: {
      title: 'چرا کلینیک ژینو؟',
      items: [{ icon: 'security', title: 'ویژگی', desc: 'توضیح' }],
    },
    doctors: {
      title: 'تیم متخصصین این خدمت',
      subtitle: 'روانشناسان دارای پروانه',
      specialtiesFilter: [],
      maxCount: 3,
      columnsMobile: 1,
      columnsTablet: 2,
      columnsDesktop: 3,
    },
    staffCarousel: {
      badge: 'کادر درمانی و روانشناسان کلینیک ژینو',
      title: 'متخصصین برجسته ما',
      subtitle: 'همراهان مجرب و تخصصی شما در مسیر بهبودی و خودشناسی',
      viewAllLabel: 'مشاهده همه',
      showViewAll: true,
      showArrows: true,
      showDots: true,
      autoplay: false,
      intervalMs: 5000,
      specialtiesFilter: [],
      maxCount: 0,
      onlyActive: true,
      bookingLabel: 'رزرو نوبت',
      profileLabel: 'پروفایل درمانگر',
      columnsMobile: 1,
      columnsTablet: 2,
      columnsDesktop: 4,
    },
    testimonials: {
      title: 'نظرات مراجعین',
      subtitle: 'بازخورد واقعی',
      items: [{ name: 'مراجع', role: 'مراجع کلینیک', comment: 'تجربه خوب', rating: 5 }],
    },
    faqs: {
      title: 'سوالات متداول',
      subtitle: 'پاسخ به ابهامات',
      items: [{ question: 'سوال؟', answer: 'پاسخ...' }],
    },
    cta: {
      badge: 'اقدام کنید',
      title: 'رزرو نوبت',
      subtitle: 'کمتر از ۲ دقیقه',
      phoneLabel: 'تماس با پذیرش',
      phoneHref: 'tel:02188776655',
    },
    richText: {
      html: '<p>متن دلخواه خود را اینجا بنویسید.</p>',
    },
    otherServices: {
      title: 'سایر خدمات کلینیک',
    },
    servicesGrid: {
      title: 'خدمات کلینیک',
      subtitle: 'انتخاب خدمت مناسب',
      columnsMobile: 1,
      columnsTablet: 2,
      columnsDesktop: 3,
    },
    contactCards: {
      address: 'تهران، میدان ونک',
      addressNote: 'دسترسی آسان',
      phone1: '۰۲۱-۸۸۷۷۶۶۵۵',
      phone2: '۰۲۱-۸۸۷۷۴۴۳۳',
      hours: 'شنبه تا پنجشنبه ۹ الی ۲۰',
      email: 'info@zhinoclinic.ir',
    },
    contactForm: {
      title: 'ارسال پیام',
      subtitle: 'پیام شما بررسی می‌شود',
    },
    articlesGrid: {
      title: 'مقالات',
      showSearch: true,
      showCategories: true,
    },
    imageCarousel: {
      autoplay: true,
      intervalMs: 4500,
      showDots: true,
      showArrows: true,
      aspect: 'video',
      slides: [
        {
          image:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
          caption: 'اسلاید ۱',
        },
        {
          image:
            'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200',
          caption: 'اسلاید ۲',
        },
      ],
    },
    videoPlayer: {
      title: '',
      sourceType: 'upload',
      videoUrl: '',
      posterImage: '',
      autoplay: false,
      muted: true,
      controls: true,
      aspect: 'video',
    },
    container: {
      columnCount: 2,
      columnsMobile: 1,
      columnsTablet: 2,
      columnsDesktop: 2,
      gap: 'md',
      padding: 'md',
      background: 'none',
      columns: [
        { id: uid('col'), blocks: [] },
        { id: uid('col'), blocks: [] },
      ],
    },
    icon: {
      icon: 'psychology',
      label: '',
      size: 48,
      color: 'primary',
      align: 'center',
      filled: false,
      linkTarget: '',
    },
    iconList: {
      iconSize: 28,
      color: 'primary',
      filled: false,
      gap: 'md',
      items: [
        {
          icon: 'check_circle',
          text: 'بیش از ۱۰ سال سابقه درخشان در حوزه سلامت روان',
          link: '',
        },
        {
          icon: 'check_circle',
          text: 'تیم متخصص با مدارج علمی معتبر از دانشگاه‌های برتر',
          link: '',
        },
        {
          icon: 'check_circle',
          text: 'محیطی کاملاً امن، استاندارد و با رعایت رازداری مطلق',
          link: '',
        },
      ],
    },
    button: {
      label: 'رزرو نوبت',
      icon: 'calendar_month',
      showIcon: true,
      iconPosition: 'start',
      color: 'primary',
      variant: 'solid',
      size: 'md',
      align: 'center',
      fullWidth: false,
      action: 'booking',
      link: '',
    },
    googleMap: {
      mode: 'coords',
      lat: 35.7575,
      lng: 51.4100,
      address: 'تهران، خیابان ولیعصر، میدان ونک',
      zoom: 15,
      height: 360,
      borderRadius: 24,
      showMarker: true,
    },
    tabGallery: {
      badge: 'تجهیزات استاندارد جهانی',
      title: 'اتاق بازی ما؛ جایی برای تولد دوباره',
      subtitle: 'امکانات و فضاهای استاندارد طراحی شده طبق پروتکل‌های بین‌المللی روانشناسی کودک',
      tabHint: 'کلیک برای نمایش',
      items: [
        {
          id: uid('tg'),
          title: 'میز شن‌بازی تخصصی',
          description: 'میز شن تخصصی برای درمان غیرکلامی اضطراب و تروماهای خردسالی',
          thumbnail:
            'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=200',
          image:
            'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=1200',
        },
        {
          id: uid('tg'),
          title: 'گوشه هنر درمانی',
          description: 'فضای امن برای بیان احساسات از طریق رنگ، کلاژ و خلاقیت',
          thumbnail:
            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=200',
          image:
            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200',
        },
        {
          id: uid('tg'),
          title: 'کنج کتاب‌خوانی کودکان',
          description: 'گوشه‌ای آرام برای قصه‌گویی، تخیل و تقویت مهارت‌های زبانی',
          thumbnail:
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=200',
          image:
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
        },
        {
          id: uid('tg'),
          title: 'سیستم مشاهده غیرمستقیم',
          description: 'امکان مشاهده حرفه‌ای جلسات برای آموزش والدین و سوپرویژن درمانگران',
          thumbnail:
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=200',
          image:
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
        },
      ],
    },
  };

  return { id: uid(type), type, props: defaults[type] };
}
