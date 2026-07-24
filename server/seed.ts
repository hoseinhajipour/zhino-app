import {
  INITIAL_APPOINTMENTS,
  DOCTORS as DEFAULT_DOCTORS,
  MAIN_SERVICES as DEFAULT_SERVICES,
  INITIAL_ARTICLES,
  DEFAULT_FAQS,
} from '../src/data/clinicData';
import type { Article, ArticleCategory, ClinicSettings, ServiceItem, SitePage, UserRecord } from '../src/types';
import { enrichServicesWithPageBuilder } from '../src/lib/landingToBlocks';
import { getAllDefaultSitePages } from '../src/lib/sitePageDefaults';
import { DEFAULT_SITE_CHROME } from '../src/lib/siteChromeDefaults';
import { countEntities, listEntities, upsertEntity, getEntity } from './db';
import { hashPassword } from './lib/password';

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  bookingEnabled: true,
  zarinpal: {
    enabled: true,
    isSandbox: true,
    merchantId: '46083627-5610-42cc-a5dc-730303030303',
    defaultFee: '۸۵۰,۰۰۰',
    callbackUrl: 'https://zhinoclinic.ir/verify-payment',
  },
  kavenegar: {
    enabled: true,
    apiKey: '7856412359876543210987654321098765432109',
    senderNumber: '10008403',
    bookingPattern:
      'مراجع گرامی %patient%، نوبت شما در کلینیک ژینو برای تاریخ %date% ساعت %time% با موفقیت ثبت شد. کد پیگیری: %ref%',
    reminderPattern:
      'یادآوری: نوبت مشاوره شما فردا ساعت %time% در کلینیک ژینو با %doctor% برگزار می‌گردد.',
    cancelPattern: 'مراجع محترم %patient%، نوبت شما برای تاریخ %date% با موفقیت لغو شد.',
  },
  site: DEFAULT_SITE_CHROME,
};

export async function seedIfEmpty(): Promise<void> {
  if ((await countEntities('appointments')) === 0) {
    for (const item of INITIAL_APPOINTMENTS) {
      await upsertEntity('appointments', item.id, item);
    }
  }

  if ((await countEntities('doctors')) === 0) {
    for (const item of DEFAULT_DOCTORS) {
      await upsertEntity('doctors', item.id, item);
    }
  }

  if ((await countEntities('services')) === 0) {
    for (const item of enrichServicesWithPageBuilder(DEFAULT_SERVICES)) {
      await upsertEntity('services', item.id, item);
    }
  }

  if ((await countEntities('articles')) === 0) {
    for (const item of INITIAL_ARTICLES) {
      await upsertEntity('articles', item.id, item);
    }
  }

  if ((await countEntities('faqs')) === 0) {
    for (const item of DEFAULT_FAQS) {
      await upsertEntity('faqs', item.id, item);
    }
  }

  if ((await countEntities('settings')) === 0) {
    await upsertEntity('settings', 'clinic_settings', DEFAULT_CLINIC_SETTINGS);
  }

  if ((await countEntities('pages')) === 0) {
    for (const page of getAllDefaultSitePages()) {
      await upsertEntity('pages', page.id, page);
    }
  }

  await ensureDefaultUsers();
  await ensureArticleCategories();
}

const DEFAULT_PASSWORD = 'zhino1403';

function defaultUsers(): UserRecord[] {
  const passwordHash = hashPassword(DEFAULT_PASSWORD);
  return [
    {
      id: 'admin-01',
      name: 'مدیر کلینیک ژینو',
      mobile: '09120000000',
      username: 'admin',
      role: 'admin',
      doctorTitle: 'مدیر سیستم',
      email: 'admin@zhinoclinic.ir',
      passwordHash,
    },
    {
      id: 'dr-deihimi',
      name: 'خانم مرجانه دیهیمی',
      mobile: '09123334455',
      username: 'doctor',
      role: 'doctor',
      doctorTitle: 'روانشناس و درمانگر ارشد',
      specialty: 'CBT و طرحواره درمانی',
      email: 'dr.deihimi@zhinoclinic.ir',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAbmnpUV7pewskFBXgvo4uhvgtCLMA5T74nCGo_UAEo4zdv1HyXH81HTCWaJpl9nyH0FKpk7A4nrYXAtvHAXsKPqbqJk19PhX199mCp_yKNEBxbxSy_LtlVgUBsS5DoRtoFOJmLQaxaT_A-gZxPJhU4hSvMP2URUtByBT0rWyKMDPilhTN-s0WeypgoysKjA5kaHLI8AfdMZkAkRxrH9q-Mppw6KBMBbn-0BLijol0AMSlgzEyNm-F2xNrpUWqoa-pY8GB9u-KOG3k',
      passwordHash,
    },
    {
      id: 'operator-taheri',
      name: 'سمیرا طاهری (پذیرش کلینیک)',
      mobile: '09125556677',
      username: 'operator',
      role: 'operator',
      doctorTitle: 'مسئول پذیرش و اپراتور نوبت‌دهی',
      email: 'reception@zhinoclinic.ir',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      passwordHash,
    },
    {
      id: 'patient-demo-01',
      name: 'علیرضا رضایی',
      mobile: '09121112233',
      role: 'patient',
      nationalId: '0012345678',
      email: 'alireza.rezaei@example.com',
      gender: 'male',
      age: 32,
      emergencyPhone: '09129998877',
      address: 'تهران، خیابان شریعتی، بالاتر از سیدخندان، پلاک ۴۵',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      passwordHash,
    },
  ];
}

/** Seed default clinic users if missing. */
export async function ensureDefaultUsers(): Promise<void> {
  for (const user of defaultUsers()) {
    const existing = await getEntity<UserRecord>('users', user.id);
    if (!existing) {
      await upsertEntity('users', user.id, user);
    }
  }
}

/** Backfill pageBuilder for services that were seeded before the builder existed. */
export async function ensureServicePageBuilders(): Promise<void> {
  const services = await listEntities<ServiceItem>('services');
  for (const service of services) {
    if (!service.pageBuilder?.blocks?.length) {
      const [enriched] = enrichServicesWithPageBuilder([service]);
      await upsertEntity('services', enriched.id, enriched);
    }
  }
}

/** Ensure home/about/contact/blog site pages exist. */
export async function ensureSitePages(): Promise<void> {
  for (const page of getAllDefaultSitePages()) {
    const existing = await getEntity<SitePage>('pages', page.id);
    if (!existing?.pageBuilder?.blocks?.length) {
      await upsertEntity('pages', page.id, existing ? { ...existing, pageBuilder: page.pageBuilder } : page);
    }
  }
}

function slugifyCategory(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`
  );
}

const DEFAULT_ARTICLE_CATEGORIES: Array<{ name: string; sortOrder: number }> = [
  { name: 'سلامت روان و اضطراب', sortOrder: 1 },
  { name: 'کودک و نوجوان', sortOrder: 2 },
  { name: 'ازدواج و زوجین', sortOrder: 3 },
  { name: 'نوروفیدبک', sortOrder: 4 },
  { name: 'مشاوره آنلاین', sortOrder: 5 },
  { name: 'عمومی', sortOrder: 6 },
];

/** Seed article categories from defaults + existing article names. */
export async function ensureArticleCategories(): Promise<void> {
  const existing = await listEntities<ArticleCategory>('article_categories');
  const byName = new Map(existing.map((c) => [c.name, c]));

  let order = existing.length;
  for (const def of DEFAULT_ARTICLE_CATEGORIES) {
    if (byName.has(def.name)) continue;
    const id = `acat-${slugifyCategory(def.name)}`;
    const cat: ArticleCategory = {
      id,
      name: def.name,
      slug: slugifyCategory(def.name),
      sortOrder: def.sortOrder,
      active: true,
    };
    await upsertEntity('article_categories', id, cat);
    byName.set(def.name, cat);
  }

  const articles = await listEntities<Article>('articles');
  for (const art of articles) {
    const name = (art.category || '').trim();
    if (!name) continue;
    if (!byName.has(name)) {
      order += 1;
      const id = `acat-${slugifyCategory(name)}`;
      const cat: ArticleCategory = {
        id,
        name,
        slug: slugifyCategory(name),
        sortOrder: order,
        active: true,
      };
      await upsertEntity('article_categories', id, cat);
      byName.set(name, cat);
    }
    const cat = byName.get(name)!;
    if (art.categoryId !== cat.id) {
      await upsertEntity('articles', art.id, { ...art, categoryId: cat.id, category: cat.name });
    }
  }
}
