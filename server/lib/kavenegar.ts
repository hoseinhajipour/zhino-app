import type { KavenegarSettings } from '../../src/types';

export type SendSmsResult = { ok: true; messageId?: string } | { ok: false; error: string };

/**
 * Send a plain SMS via Kavenegar REST API.
 * Docs: https://kavenegar.com/rest.html#sms-send
 */
export async function sendKavenegarSms(
  settings: KavenegarSettings,
  receptor: string,
  message: string
): Promise<SendSmsResult> {
  const apiKey = (settings.apiKey || '').trim();
  const sender = (settings.senderNumber || '').trim();
  const to = receptor.replace(/\s+/g, '').trim();

  if (!settings.enabled) {
    return { ok: false, error: 'Kavenegar is disabled' };
  }
  if (!apiKey) {
    return { ok: false, error: 'Kavenegar API key is missing' };
  }
  if (!to) {
    return { ok: false, error: 'Receptor number is empty' };
  }

  const params = new URLSearchParams();
  params.set('receptor', to);
  params.set('message', message);
  if (sender) params.set('sender', sender);

  const url = `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = (await res.json()) as {
      return?: { status?: number; message?: string };
      entries?: Array<{ messageid?: number | string }>;
    };
    const status = data?.return?.status;
    if (status === 200) {
      const messageId = data.entries?.[0]?.messageid;
      return { ok: true, messageId: messageId != null ? String(messageId) : undefined };
    }
    return {
      ok: false,
      error: data?.return?.message || `Kavenegar status ${status ?? res.status}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMS send failed' };
  }
}

export function buildFormNotifyMessage(
  settings: KavenegarSettings,
  formName: string,
  summary: string
): string {
  const pattern =
    (settings.formNotifyPattern || '').trim() ||
    'فرم جدید «%form%» ثبت شد.\n%summary%';
  return pattern.replace(/%form%/g, formName).replace(/%summary%/g, summary);
}
