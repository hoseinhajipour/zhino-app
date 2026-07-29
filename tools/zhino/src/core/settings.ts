import { apiRequest } from './client.js';

export async function getSettings() {
  return apiRequest<Record<string, unknown>>('/api/settings');
}

export async function updateSettings(body: Record<string, unknown>) {
  const current = await getSettings();
  const merged = {
    ...current,
    ...body,
    id: 'clinic_settings',
  };
  return apiRequest('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(merged),
  });
}

function digitsOnly(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

/** Mirrors src/lib/contactInfo.ts identityPatchFromContact — keeps legacy identity fields in sync. */
function identityPatchFromContact(contact: Record<string, unknown>): Record<string, unknown> {
  const phones = Array.isArray(contact.phones)
    ? (contact.phones as Array<Record<string, unknown>>)
    : [];
  const addresses = Array.isArray(contact.addresses)
    ? (contact.addresses as Array<Record<string, unknown>>)
    : [];
  const p0 = phones[0];
  const p1 = phones[1];
  const addr = addresses[0];

  const patch: Record<string, unknown> = {};
  if (p0) {
    patch.phone1 = p0.number ?? '';
    patch.phoneClean = digitsOnly(p0.telHref ?? p0.number);
  }
  if (p1) patch.phone2 = p1.number ?? '';
  if (contact.email != null) patch.email = contact.email;
  if (contact.whatsapp != null) patch.whatsappNumber = contact.whatsapp;
  if (contact.telegram != null) patch.telegram = contact.telegram;
  if (contact.instagram != null) patch.instagram = contact.instagram;
  if (addr) patch.address = addr.text ?? '';
  return patch;
}

function mergeContactPatch(
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      merged[key] = {
        ...((current[key] as Record<string, unknown> | undefined) || {}),
        ...(value as Record<string, unknown>),
      };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Merge partial contact fields (phones, socials, addresses, fab...) into
 * clinic_settings.contact and sync the legacy site.identity fields that
 * mirror it (phone1/phone2/email/whatsapp/telegram/instagram/address).
 */
export async function updateContact(contactPatch: Record<string, unknown>) {
  const settings = (await getSettings()) as Record<string, unknown>;
  const currentContact = (settings.contact as Record<string, unknown>) || {};
  const mergedContact = mergeContactPatch(currentContact, contactPatch);

  const site = (settings.site as Record<string, unknown>) || {};
  const identity = (site.identity as Record<string, unknown>) || {};
  const identityPatch = identityPatchFromContact(mergedContact);
  const nextSite = { ...site, identity: { ...identity, ...identityPatch } };

  return updateSettings({ ...settings, contact: mergedContact, site: nextSite });
}

export async function getChrome() {
  const settings = await getSettings();
  return (settings as { site?: unknown }).site ?? null;
}

export async function updateChrome(chromePatch: Record<string, unknown>) {
  const settings = await getSettings();
  const site = {
    ...((settings as { site?: Record<string, unknown> }).site || {}),
    ...chromePatch,
  };
  return updateSettings({ ...settings, site });
}
