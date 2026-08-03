import type {
  ClinicContactInfo,
  ConsultFabSettings,
  ContactAddressItem,
  ContactPhoneItem,
  SiteIdentitySettings,
} from '../types';
import { CLINIC_INFO } from '../data/clinicData';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

export const DEFAULT_FAB_SETTINGS: ConsultFabSettings = {
  enabled: true,
  position: 'right',
  color: '#b5106a',
  icon: 'support_agent',
  label: 'مشاوره',
  showLabel: true,
  entryAnimation: 'fadeUp',
  pulse: true,
};

export const FAB_ICON_PRESETS = [
  'support_agent',
  'chat',
  'forum',
  'call',
  'headset_mic',
  'contact_support',
  'sms',
  'phone_in_talk',
  'diversity_3',
  'volunteer_activism',
] as const;

export function mergeFabSettings(
  partial?: Partial<ConsultFabSettings> | null
): ConsultFabSettings {
  const base = DEFAULT_FAB_SETTINGS;
  if (!partial) return { ...base };
  return {
    enabled: partial.enabled != null ? Boolean(partial.enabled) : base.enabled,
    position: partial.position === 'left' ? 'left' : 'right',
    color: String(partial.color || base.color).trim() || base.color,
    icon: String(partial.icon || base.icon).trim() || base.icon,
    label: partial.label != null ? String(partial.label) : base.label,
    showLabel: partial.showLabel != null ? Boolean(partial.showLabel) : base.showLabel,
    entryAnimation:
      partial.entryAnimation === 'scale' ||
      partial.entryAnimation === 'bounce' ||
      partial.entryAnimation === 'slide' ||
      partial.entryAnimation === 'none' ||
      partial.entryAnimation === 'fadeUp'
        ? partial.entryAnimation
        : base.entryAnimation,
    pulse: partial.pulse != null ? Boolean(partial.pulse) : base.pulse,
  };
}

export const DEFAULT_CONTACT_INFO: ClinicContactInfo = {
  phones: [
    {
      id: 'phone-1',
      label: 'تلفن ۱',
      number: CLINIC_INFO.phone1,
      telHref: CLINIC_INFO.phoneClean,
    },
    {
      id: 'phone-2',
      label: 'تلفن ۲',
      number: CLINIC_INFO.phone2,
      telHref: CLINIC_INFO.phone2Clean || CLINIC_INFO.phoneClean,
    },
  ],
  whatsapp: CLINIC_INFO.whatsappNumber,
  email: CLINIC_INFO.email,
  telegram: CLINIC_INFO.telegram,
  instagram: CLINIC_INFO.instagram,
  bale: '',
  eitaa: '',
  rubika: '',
  youtube: '',
  linkedin: '',
  x: '',
  addresses: [
    {
      id: 'addr-1',
      title: 'دفتر مرکزی',
      text: CLINIC_INFO.address,
      lat: CLINIC_INFO.mapLat,
      lng: CLINIC_INFO.mapLng,
    },
  ],
  fab: DEFAULT_FAB_SETTINGS,
};

export function contactFromIdentity(identity?: Partial<SiteIdentitySettings> | null): ClinicContactInfo {
  const id = identity || {};
  const phones: ContactPhoneItem[] = [];
  if (id.phone1) {
    phones.push({
      id: 'phone-1',
      label: 'تلفن ۱',
      number: id.phone1,
      telHref: id.phoneClean || digitsOnly(id.phone1),
    });
  }
  if (id.phone2) {
    phones.push({
      id: 'phone-2',
      label: 'تلفن ۲',
      number: id.phone2,
      telHref: id.phoneClean || digitsOnly(id.phone2),
    });
  }
  const addresses: ContactAddressItem[] = id.address
    ? [
        {
          id: 'addr-1',
          title: 'آدرس',
          text: id.address,
          lat: CLINIC_INFO.mapLat,
          lng: CLINIC_INFO.mapLng,
        },
      ]
    : [];

  return {
    phones: phones.length ? phones : DEFAULT_CONTACT_INFO.phones,
    whatsapp: id.whatsappNumber || DEFAULT_CONTACT_INFO.whatsapp,
    email: id.email || DEFAULT_CONTACT_INFO.email,
    telegram: id.telegram || DEFAULT_CONTACT_INFO.telegram,
    instagram: id.instagram || DEFAULT_CONTACT_INFO.instagram,
    bale: '',
    eitaa: '',
    rubika: '',
    youtube: '',
    linkedin: '',
    x: '',
    addresses: addresses.length ? addresses : DEFAULT_CONTACT_INFO.addresses,
    fab: DEFAULT_FAB_SETTINGS,
  };
}

export function mergeContactInfo(
  partial?: Partial<ClinicContactInfo> | null,
  identityFallback?: Partial<SiteIdentitySettings> | null
): ClinicContactInfo {
  const base = contactFromIdentity(identityFallback);
  if (!partial) return base;
  return {
    phones: Array.isArray(partial.phones) && partial.phones.length ? partial.phones : base.phones,
    whatsapp: partial.whatsapp != null ? String(partial.whatsapp) : base.whatsapp,
    email: partial.email != null ? String(partial.email) : base.email,
    telegram: partial.telegram != null ? String(partial.telegram) : base.telegram,
    instagram: partial.instagram != null ? String(partial.instagram) : base.instagram,
    bale: partial.bale != null ? String(partial.bale) : base.bale,
    eitaa: partial.eitaa != null ? String(partial.eitaa) : base.eitaa,
    rubika: partial.rubika != null ? String(partial.rubika) : base.rubika,
    youtube: partial.youtube != null ? String(partial.youtube) : base.youtube,
    linkedin: partial.linkedin != null ? String(partial.linkedin) : base.linkedin,
    x: partial.x != null ? String(partial.x) : base.x,
    addresses:
      Array.isArray(partial.addresses) && partial.addresses.length
        ? partial.addresses
        : base.addresses,
    fab: mergeFabSettings(partial.fab || base.fab),
  };
}

/** Keep legacy identity fields in sync when contact is saved. */
export function identityPatchFromContact(contact: ClinicContactInfo): Partial<SiteIdentitySettings> {
  const p0 = contact.phones[0];
  const p1 = contact.phones[1];
  const addr = contact.addresses[0];
  return {
    phone1: p0?.number || '',
    phone2: p1?.number || '',
    phoneClean: digitsOnly(p0?.telHref || p0?.number || ''),
    email: contact.email || '',
    whatsappNumber: contact.whatsapp || '',
    telegram: contact.telegram || '',
    instagram: contact.instagram || '',
    address: addr?.text || '',
  };
}

function asHandleOrUrl(raw: string, webBase: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  return `${webBase}${encodeURIComponent(handle)}`;
}

export type ContactChannelId =
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'telegram'
  | 'instagram'
  | 'bale'
  | 'eitaa'
  | 'rubika'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'map';

export type ContactChannel = {
  id: ContactChannelId;
  label: string;
  href: string;
  external?: boolean;
  phoneNumber?: string;
};

export function getTelHref(phone: ContactPhoneItem): string {
  const d = digitsOnly(phone.telHref || phone.number);
  return d ? `tel:${d}` : '';
}

export function getWhatsAppHref(whatsapp: string, text?: string): string {
  const d = digitsOnly(whatsapp);
  if (!d) return '';
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${d}${q}`;
}

export function getMapHref(address: ContactAddressItem): string {
  if (typeof address.lat === 'number' && typeof address.lng === 'number') {
    return `https://maps.google.com/?q=${address.lat},${address.lng}`;
  }
  const q = address.text.trim();
  return q ? `https://maps.google.com/?q=${encodeURIComponent(q)}` : '';
}

export function getMapEmbedSrc(address: ContactAddressItem, zoom = 15): string | null {
  if (typeof address.lat === 'number' && typeof address.lng === 'number') {
    return `https://maps.google.com/maps?q=${address.lat},${address.lng}&z=${zoom}&output=embed`;
  }
  const q = address.text.trim();
  if (!q) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
}

/** Channels available for FAB / footer social row. */
export function listContactChannels(contact: ClinicContactInfo): ContactChannel[] {
  const channels: ContactChannel[] = [];

  for (const phone of contact.phones) {
    const href = getTelHref(phone);
    if (!href) continue;
    channels.push({
      id: 'phone',
      label: phone.label || phone.number,
      href,
      phoneNumber: phone.number,
    });
  }

  const wa = getWhatsAppHref(contact.whatsapp);
  if (wa) {
    channels.push({ id: 'whatsapp', label: 'واتساپ', href: wa, external: true });
  }

  if (contact.email.trim()) {
    channels.push({
      id: 'email',
      label: 'ایمیل',
      href: `mailto:${contact.email.trim()}`,
    });
  }

  const tg = asHandleOrUrl(contact.telegram, 'https://t.me/');
  if (tg) channels.push({ id: 'telegram', label: 'تلگرام', href: tg, external: true });

  const ig = asHandleOrUrl(
    String(contact.instagram || '').replace(/^@/, ''),
    'https://www.instagram.com/'
  );
  if (ig) channels.push({ id: 'instagram', label: 'اینستاگرام', href: ig, external: true });

  const bale = asHandleOrUrl(contact.bale, 'https://ble.ir/');
  if (bale) channels.push({ id: 'bale', label: 'بله', href: bale, external: true });

  const eitaa = asHandleOrUrl(contact.eitaa, 'https://eitaa.com/');
  if (eitaa) channels.push({ id: 'eitaa', label: 'ایتا', href: eitaa, external: true });

  const rubika = asHandleOrUrl(contact.rubika, 'https://rubika.ir/');
  if (rubika) channels.push({ id: 'rubika', label: 'روبیکا', href: rubika, external: true });

  const youtube = asHandleOrUrl(contact.youtube, 'https://www.youtube.com/@');
  if (youtube) channels.push({ id: 'youtube', label: 'یوتیوب', href: youtube, external: true });

  const linkedin = asHandleOrUrl(contact.linkedin, 'https://www.linkedin.com/in/');
  if (linkedin) channels.push({ id: 'linkedin', label: 'لینکدین', href: linkedin, external: true });

  const x = asHandleOrUrl(contact.x, 'https://x.com/');
  if (x) channels.push({ id: 'x', label: 'شبکه ایکس', href: x, external: true });

  return channels;
}

export function newPhoneItem(): ContactPhoneItem {
  return { id: uid('phone'), label: 'تلفن', number: '', telHref: '' };
}

export function newAddressItem(): ContactAddressItem {
  return { id: uid('addr'), title: 'آدرس', text: '', lat: undefined, lng: undefined };
}
