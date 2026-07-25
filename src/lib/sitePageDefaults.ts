import type { SitePage, SitePageId, ServiceBlock, PageBuilderDoc } from '../types';
import { CLINIC_INFO } from '../data/clinicData';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function doc(blocks: ServiceBlock[]): PageBuilderDoc {
  return { version: 1, blocks };
}

export const SITE_PAGE_META: Record<SitePageId, { slug: string; title: string; icon: string }> = {
  home: { slug: '/', title: 'صفحه خانه', icon: 'home' },
  about: { slug: '/about', title: 'درباره ما', icon: 'info' },
  contact: { slug: '/contact', title: 'تماس با ما', icon: 'call' },
  blog: { slug: '/blog', title: 'مقالات', icon: 'article' },
};

export const SYSTEM_SITE_PAGE_IDS = Object.keys(SITE_PAGE_META) as SitePageId[];

/** Path segments that must not be used as custom page slugs. */
export const RESERVED_PAGE_SLUGS = new Set([
  '',
  'admin',
  'user-panel',
  'services',
  'service',
  'child-therapy',
  'adult-therapy',
  'marriage-therapy',
  'about',
  'team',
  'contact',
  'blog',
  'faq',
  'p',
  'api',
  'uploads',
  'login',
  'register',
]);

export function isSystemSitePageId(id: string): id is SitePageId {
  return (SYSTEM_SITE_PAGE_IDS as string[]).includes(id);
}

export function isSystemSitePage(page: Pick<SitePage, 'id' | 'isSystem'>): boolean {
  return page.isSystem === true || isSystemSitePageId(page.id);
}

export function slugifyPageTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `page-${Date.now().toString(36)}`;
}

/** Public URL path for a site page (system or custom). */
export function getSitePagePath(page: Pick<SitePage, 'id' | 'slug'>): string {
  if (isSystemSitePageId(page.id)) {
    return SITE_PAGE_META[page.id].slug;
  }
  const slug = page.slug.replace(/^\/+/, '').replace(/^p\//, '');
  return `/p/${slug || page.id}`;
}

export function createDefaultSitePage(id: SitePageId): SitePage {
  const meta = SITE_PAGE_META[id];
  return {
    id,
    slug: meta.slug,
    title: meta.title,
    pageBuilder: defaultBlocksFor(id),
    isSystem: true,
    status: 'published',
    layoutWidth: 'contained',
  };
}

/** Empty custom page with a starter hero — for admin «صفحه جدید». */
export function createBlankSitePage(input: { title: string; slug: string; id?: string }): SitePage {
  const slug =
    (input.slug || '').replace(/^\/+/, '').replace(/^p\//, '') ||
    slugifyPageTitle(input.title) ||
    `page-${Date.now().toString(36)}`;
  const safeIdPart = slugifyPageTitle(slug).replace(/[^\w-]/g, '') || Date.now().toString(36);
  const id = input.id || `page-${safeIdPart}-${Date.now().toString(36).slice(-4)}`;
  return {
    id,
    slug,
    title: input.title.trim() || 'صفحه جدید',
    isSystem: false,
    status: 'published',
    layoutWidth: 'contained',
    updatedAt: new Date().toISOString(),
    pageBuilder: doc([
      {
        id: uid('pageHero'),
        type: 'pageHero',
        props: {
          badge: 'کلینیک ژینو',
          title: input.title.trim() || 'عنوان صفحه',
          subtitle: 'متن معرفی کوتاه این صفحه را از صفحه‌ساز ویرایش کنید.',
          showBooking: true,
          primaryCtaLabel: 'رزرو نوبت',
          imageMode: 'none',
          heroImage: '',
        },
      },
    ]),
  };
}

export function getDefaultBlocksForPage(page: SitePage): ServiceBlock[] {
  if (page.pageBuilder?.blocks?.length) return page.pageBuilder.blocks;
  if (isSystemSitePageId(page.id)) return createDefaultSitePage(page.id).pageBuilder.blocks;
  return createBlankSitePage({ title: page.title, slug: page.slug, id: page.id }).pageBuilder.blocks;
}

export function getAllDefaultSitePages(): SitePage[] {
  return SYSTEM_SITE_PAGE_IDS.map(createDefaultSitePage);
}

function defaultBlocksFor(id: SitePageId): PageBuilderDoc {
  switch (id) {
    case 'home':
      return doc([
        {
          id: uid('pageHero'),
          type: 'pageHero',
          props: {
            badge: 'مرکز تخصصی روان‌درمانی، مشاوره و نوروفیدبک ژینو',
            title: 'مسیر تخصصی شما به سوی آرامش و تعادل روانی',
            subtitle:
              'در کلینیک ژینو، با همراهی برترین اساتید روانشناسی و پروتکل‌های علمی مدرن (CBT، طرحواره درمانی و نوروفیدبک لورتا)، امن‌ترین محیط را برای رشد و بهبود شما فراهم آورده‌ایم.',
            primaryCtaLabel: 'رزرو آنلاین نوبت مشاوره',
            secondaryCtaLabel: 'مشاهده خدمات',
            secondaryCtaScreen: 'services',
            showBooking: true,
          },
        },
        {
          id: uid('highlights'),
          type: 'highlights',
          props: {
            items: [
              { icon: 'verified', label: 'پرونده درمانی', value: '+۱۲,۰۰۰' },
              { icon: 'groups', label: 'درمانگر ارشد', value: '+۱۵' },
              { icon: 'workspace_premium', label: 'سال فعالیت', value: '+۱۰' },
              { icon: 'thumb_up', label: 'رضایت مراجعین', value: '۹۸٪' },
            ],
          },
        },
        {
          id: uid('servicesGrid'),
          type: 'servicesGrid',
          props: {
            title: 'دپارتمان‌ها و خدمات کلینیک',
            subtitle: 'انتخاب خدمت مناسب، اولین گام مسیر درمان است',
          },
        },
        {
          id: uid('doctors'),
          type: 'doctors',
          props: {
            title: 'متخصصین برجسته ما',
            subtitle: 'همراهان مجرب شما در مسیر بهبودی و خودشناسی',
            specialtiesFilter: [],
            maxCount: 6,
          },
        },
        {
          id: uid('cta'),
          type: 'cta',
          props: {
            badge: 'گام اول به سوی سلامت روان',
            title: 'همین امروز نوبت مشاوره خود را رزرو کنید',
            subtitle: 'فرآیند رزرو نوبت کمتر از ۲ دقیقه زمان می‌برد.',
            phoneLabel: `تماس با پذیرش (${CLINIC_INFO.phone1})`,
            phoneHref: `tel:${CLINIC_INFO.phoneClean}`,
          },
        },
      ]);

    case 'about':
      return doc([
        {
          id: uid('pageHero'),
          type: 'pageHero',
          props: {
            badge: 'درباره کلینیک روانشناسی ژینو',
            title: 'پناهگاهی امن برای آرامش و تعادل روان شما',
            subtitle:
              'کلینیک ژینو با داشتن مجوز رسمی از سازمان نظام روانشناسی و مشاوره جمهوری اسلامی ایران و بهره‌گیری از کادری علمی و دلسوز، همراه همیشگی شماست.',
            showBooking: true,
            primaryCtaLabel: 'رزرو نوبت',
          },
        },
        {
          id: uid('richText'),
          type: 'richText',
          props: {
            html: `<h2>داستان شکل‌گیری ژینو</h2>
<p>نام «ژینو» در لغت به معنای «تولد دوباره و حیات‌بخش» است. مجموعه ژینو فعالیت خود را در سال ۱۳۹۲ با هدف ایجاد تحولی بنیادین در نحوه ارائه خدمات روانشناسی شروع کرد. ما باور داریم روان‌درمانی یک درمان کلیشه‌ای نیست، بلکه فرآیندی کاملاً انسانی و مبتنی بر همدلی آگاهانه است.</p>
<p><strong>چشم‌انداز:</strong> ارتقای فرهنگ مراجعه به روانشناس، حذف تابوهای سلامت روان در جامعه و ارائه استانداردهای درمانی برابر با کلینیک‌های پیشرو جهان.</p>`,
          },
        },
        {
          id: uid('features'),
          type: 'features',
          props: {
            title: 'ارزش‌های بنیادین کلینیک ژینو',
            items: [
              {
                icon: 'lock',
                title: 'رازداری و اصول اخلاقی',
                desc: 'تمامی مباحث مطرح‌شده در جلسات کاملاً محرمانه باقی می‌مانند.',
              },
              {
                icon: 'biotech',
                title: 'کیفیت و دانش روزآمد',
                desc: 'درمانگران همواره در دوره‌های بین‌المللی و بازآموزی دانشگاهی حضور دارند.',
              },
              {
                icon: 'handshake',
                title: 'احترام و بدون قضاوت',
                desc: 'پذیرش نامشروط هر مراجع در محیطی لبریز از احترام و کرامت انسانی.',
              },
            ],
          },
        },
        {
          id: uid('cta'),
          type: 'cta',
          props: {
            badge: 'آشنایی بیشتر',
            title: 'آماده‌اید مسیر درمان را آغاز کنید؟',
            subtitle: 'تیم پذیرش ژینو آماده راهنمایی شماست.',
            phoneLabel: `تماس (${CLINIC_INFO.phone1})`,
            phoneHref: `tel:${CLINIC_INFO.phoneClean}`,
          },
        },
      ]);

    case 'contact':
      return doc([
        {
          id: uid('pageHero'),
          type: 'pageHero',
          props: {
            badge: 'ارتباط با مرکز ژینو',
            title: 'تماس با ما و آدرس کلینیک',
            subtitle:
              'همکاران ما در بخش پذیرش آماده پاسخگویی به سوالات و راهنمایی شما جهت ثبت نوبت مشاوره می‌باشند.',
            showBooking: true,
            primaryCtaLabel: 'رزرو آنلاین نوبت',
          },
        },
        {
          id: uid('contactCards'),
          type: 'contactCards',
          props: {
            address: CLINIC_INFO.address,
            addressNote: 'دسترسی آسان از میدان ونک',
            phone1: CLINIC_INFO.phone1,
            phone2: CLINIC_INFO.phone2,
            hours: 'شنبه تا چهارشنبه ۹ الی ۲۰ | پنجشنبه ۹ الی ۱۶',
            email: 'info@zhinoclinic.ir',
          },
        },
        {
          id: uid('contactForm'),
          type: 'contactForm',
          props: {
            title: 'ارسال پیام به پذیرش',
            subtitle: 'پیام شما در کوتاه‌ترین زمان بررسی می‌شود.',
            formId: 'form-contact',
          },
        },
      ]);

    case 'blog':
      return doc([
        {
          id: uid('pageHero'),
          type: 'pageHero',
          props: {
            badge: 'مجله تخصصی روانشناسی ژینو',
            title: 'مقالات، آموزه‌ها و تازه‌های سلامت روان',
            subtitle:
              'جدیدترین پژوهش‌ها و راهکارهای علمی متخصصان کلینیک ژینو در زمینه اضطراب، روابط عاطفی، تربیت و خودشناسی.',
            showBooking: false,
          },
        },
        {
          id: uid('articlesGrid'),
          type: 'articlesGrid',
          props: {
            title: 'آخرین مقالات',
            showSearch: true,
            showCategories: true,
          },
        },
      ]);
  }
}
