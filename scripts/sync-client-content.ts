/**
 * Sync client content updates into the running Zhino API (MySQL via /api/*).
 * Usage: npx tsx scripts/sync-client-content.ts
 * Optional: ZHINO_API_BASE=https://zhinopsy.com ZHINO_API_TOKEN=... npx tsx scripts/sync-client-content.ts
 */
import {
  DOCTORS,
  DEFAULT_FAQS,
  MAIN_SERVICES,
  CLINIC_INFO,
  DEFAULT_WORKSHOPS,
} from '../src/data/clinicData.js';
import { enrichServicesWithPageBuilder } from '../src/lib/landingToBlocks.js';
import { createDefaultSitePage } from '../src/lib/sitePageDefaults.js';
import { DEFAULT_SITE_CHROME } from '../src/lib/siteChromeDefaults.js';
import { DEFAULT_CONTACT_INFO, identityPatchFromContact, mergeContactInfo } from '../src/lib/contactInfo.js';

const BASE = (process.env.ZHINO_API_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '');
const TOKEN = (process.env.ZHINO_API_TOKEN || '').trim();

async function api(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
    headers['X-Zhino-Token'] = TOKEN;
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status}: ${text}`);
  return data;
}

function patchHomeIconList(page: Record<string, unknown>) {
  const pb = page.pageBuilder as { blocks?: Array<Record<string, unknown>> } | undefined;
  if (!pb?.blocks) return page;
  const walk = (blocks: Array<Record<string, unknown>>) => {
    for (const block of blocks) {
      if (block.type === 'iconList') {
        const props = (block.props || {}) as { items?: Array<{ text?: string }> };
        if (Array.isArray(props.items)) {
          props.items = props.items.map((item) =>
            String(item.text || '').includes('۱۰ سال')
              ? { ...item, text: 'فعالیت رسمی از سال ۱۴۰۳ با رویکرد علمی و تخصصی' }
              : item
          );
          block.props = props;
        }
      }
      const cols = (block.props as { columns?: Array<{ blocks?: Array<Record<string, unknown>> }> })
        ?.columns;
      if (Array.isArray(cols)) {
        for (const col of cols) {
          if (Array.isArray(col.blocks)) walk(col.blocks);
        }
      }
    }
  };
  walk(pb.blocks);
  return page;
}

async function main() {
  console.log('Syncing to', BASE);

  const existingDoctors = (await api('/api/doctors')) as Array<{ id: string }>;
  const keep = new Set(DOCTORS.map((d) => d.id));
  for (const d of existingDoctors) {
    if (!keep.has(d.id)) {
      await api(`/api/doctors/${encodeURIComponent(d.id)}`, { method: 'DELETE' });
      console.log('deleted doctor', d.id);
    }
  }
  for (const doc of DOCTORS) {
    await api(`/api/doctors/${encodeURIComponent(doc.id)}`, {
      method: 'PUT',
      body: JSON.stringify(doc),
    });
  }
  console.log('doctors upserted', DOCTORS.length);

  for (const svc of enrichServicesWithPageBuilder(MAIN_SERVICES)) {
    if (svc.pageBuilder?.blocks) {
      svc.pageBuilder = {
        ...svc.pageBuilder,
        blocks: svc.pageBuilder.blocks.filter((b) => b.type !== 'testimonials'),
      };
    }
    await api(`/api/services/${encodeURIComponent(svc.id)}`, {
      method: 'PUT',
      body: JSON.stringify(svc),
    });
  }
  console.log('services upserted', MAIN_SERVICES.length);

  for (const faq of DEFAULT_FAQS) {
    await api(`/api/faqs/${encodeURIComponent(faq.id)}`, {
      method: 'PUT',
      body: JSON.stringify(faq),
    });
  }
  console.log('faqs upserted');

  // Preserve custom home builder; only patch stale copy. Refresh about/contact from defaults.
  try {
    const home = (await api('/api/pages/home')) as Record<string, unknown>;
    const patched = patchHomeIconList(home);
    await api('/api/pages/home', { method: 'PUT', body: JSON.stringify(patched) });
    console.log('home page iconList patched');
  } catch (err) {
    console.warn('home patch skipped:', err instanceof Error ? err.message : err);
  }

  for (const id of ['about', 'contact'] as const) {
    const page = createDefaultSitePage(id);
    await api(`/api/pages/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(page),
    });
  }
  console.log('pages about/contact refreshed');

  const contact = mergeContactInfo({
    ...DEFAULT_CONTACT_INFO,
    email: CLINIC_INFO.email,
    telegram: CLINIC_INFO.telegram,
    instagram: CLINIC_INFO.instagram,
    whatsapp: CLINIC_INFO.whatsappNumber,
    youtube: '',
    bale: '',
    eitaa: '',
    rubika: '',
    addresses: [
      {
        id: 'addr-1',
        title: 'دفتر مرکزی',
        text: CLINIC_INFO.address,
        lat: CLINIC_INFO.mapLat,
        lng: CLINIC_INFO.mapLng,
      },
    ],
  });

  const settings = (await api('/api/settings')) as Record<string, unknown>;
  const existingSite =
    typeof settings.site === 'object' && settings.site
      ? (settings.site as Record<string, unknown>)
      : {};
  const site = {
    ...DEFAULT_SITE_CHROME,
    ...existingSite,
    identity: {
      ...DEFAULT_SITE_CHROME.identity,
      ...((existingSite.identity as Record<string, unknown>) || {}),
      ...identityPatchFromContact(contact),
      address: CLINIC_INFO.address,
      email: CLINIC_INFO.email,
      instagram: CLINIC_INFO.instagram,
      telegram: CLINIC_INFO.telegram,
      whatsappNumber: CLINIC_INFO.whatsappNumber,
    },
    footer: {
      ...DEFAULT_SITE_CHROME.footer,
      ...((existingSite.footer as Record<string, unknown>) || {}),
      hoursText: CLINIC_INFO.hoursText,
    },
    menu: (existingSite.menu as unknown) || DEFAULT_SITE_CHROME.menu,
  };

  await api('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      ...settings,
      contact,
      site,
    }),
  });
  console.log('settings contact/chrome updated');

  for (const w of DEFAULT_WORKSHOPS) {
    await api(`/api/workshops/${encodeURIComponent(w.id)}`, {
      method: 'PUT',
      body: JSON.stringify(w),
    });
  }
  console.log('workshops upserted');

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
