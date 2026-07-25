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
