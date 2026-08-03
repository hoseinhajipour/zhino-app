import type { PageBuilderDoc, ServiceBlock, Workshop } from '../types';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugifyWorkshopTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `workshop-${Date.now().toString(36)}`;
}

export function getWorkshopPath(workshop: Pick<Workshop, 'id' | 'slug'>): string {
  const slug = (workshop.slug || workshop.id || '').replace(/^\/+/, '');
  return `/workshops/${encodeURIComponent(slug)}`;
}

export function createDefaultWorkshopBlocks(
  workshop: Pick<Workshop, 'title' | 'description' | 'posterUrl'>
): ServiceBlock[] {
  const blocks: ServiceBlock[] = [
    {
      id: uid('pageHero'),
      type: 'pageHero',
      props: {
        badge: 'کارگاه آموزشی کلینیک ژینو',
        title: workshop.title || 'عنوان کارگاه',
        subtitle: workshop.description || 'جزئیات کارگاه را اینجا ویرایش کنید.',
        showBooking: false,
        primaryCtaLabel: '',
      },
    },
  ];

  if (workshop.posterUrl) {
    blocks.push({
      id: uid('singleImage'),
      type: 'singleImage',
      props: {
        src: workshop.posterUrl,
        alt: workshop.title || 'پوستر کارگاه',
        rounded: true,
        shadow: true,
      },
    });
  }

  blocks.push({
    id: uid('richText'),
    type: 'richText',
    props: {
      html: `<h2>معرفی کارگاه</h2>
<p>${workshop.description || 'متن معرفی، سرفصل‌ها، مخاطبان و جزئیات برگزاری را در صفحه‌ساز ویرایش کنید.'}</p>`,
    },
  });

  return blocks;
}

export function getWorkshopPageBuilder(workshop: Workshop): PageBuilderDoc {
  if (workshop.pageBuilder?.blocks?.length) {
    return workshop.pageBuilder;
  }
  return {
    version: 1,
    blocks: createDefaultWorkshopBlocks(workshop),
  };
}

export function ensureWorkshopDefaults(workshop: Workshop): Workshop {
  const slug = workshop.slug || slugifyWorkshopTitle(workshop.title || workshop.id);
  const pageBuilder = getWorkshopPageBuilder({ ...workshop, slug });
  return {
    ...workshop,
    slug,
    posterUrl: workshop.posterUrl || '',
    registrationPhone: (workshop.registrationPhone || '').trim(),
    registrationPhoneClean: (workshop.registrationPhoneClean || '').trim(),
    pageBuilder,
  };
}
