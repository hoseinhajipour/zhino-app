import { Router, Request, Response } from 'express';
import { getEntity, upsertEntity } from '../db';
import { formsCrudRouter } from './entities';
import { sendKavenegarSms, buildFormNotifyMessage } from '../lib/kavenegar';
import type {
  ClinicSettings,
  FormAnswerValue,
  FormDefinition,
  FormField,
  FormSubmission,
  KavenegarSettings,
} from '../../src/types';

function isEmptyAnswer(value: FormAnswerValue | undefined): boolean {
  if (value == null) return true;
  if (typeof value === 'boolean') return !value;
  if (Array.isArray(value)) return value.length === 0;
  return String(value).trim() === '';
}

function validateAnswers(
  fields: FormField[],
  answers: Record<string, FormAnswerValue>
): string | null {
  for (const field of fields) {
    if (field.type === 'description') continue;
    if (!field.required) continue;
    if (isEmptyAnswer(answers[field.id])) {
      return `فیلد «${field.label}» الزامی است`;
    }
  }
  return null;
}

function formatAnswerForSummary(field: FormField, value: FormAnswerValue | undefined): string {
  if (value == null || isEmptyAnswer(value)) return '—';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  if (Array.isArray(value)) {
    const labels = value.map((id) => field.options?.find((o) => o.id === id)?.label || id);
    return labels.join('، ') || '—';
  }
  if (field.type === 'select' || field.type === 'radio') {
    return field.options?.find((o) => o.id === value)?.label || String(value);
  }
  return String(value);
}

function buildSummary(fields: FormField[], answers: Record<string, FormAnswerValue>): string {
  return fields
    .filter((f) => f.type !== 'description')
    .map((f) => `${f.label}: ${formatAnswerForSummary(f, answers[f.id])}`)
    .join('\n');
}

async function loadKavenegarSettings(): Promise<KavenegarSettings | null> {
  const settings = await getEntity<{ id: string } & ClinicSettings>('settings', 'clinic_settings');
  return settings?.kavenegar || null;
}

export const formsRouter = Router();

formsRouter.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const formId = String(req.params.id || '');
    const form = await getEntity<FormDefinition>('forms', formId);
    if (!form || form.enabled === false) {
      res.status(404).json({ error: 'فرم یافت نشد یا غیرفعال است' });
      return;
    }

    const body = req.body || {};
    const answers = (body.answers || {}) as Record<string, FormAnswerValue>;
    const validationError = validateAnswers(form.fields || [], answers);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const summary = buildSummary(form.fields || [], answers);
    const notify: FormSubmission['notify'] = {};

    if (form.notifyEmail?.trim()) {
      console.info(
        `[form-notify-email] to=${form.notifyEmail.trim()} form=${form.name} (${form.id})\n${summary}`
      );
      notify.emailLogged = true;
    }

    if (form.notifySms?.trim()) {
      const kv = await loadKavenegarSettings();
      if (kv?.enabled) {
        const message = buildFormNotifyMessage(kv, form.name, summary);
        const smsResult = await sendKavenegarSms(kv, form.notifySms.trim(), message);
        if (smsResult.ok === true) {
          notify.smsSent = true;
        } else {
          const errMsg = smsResult.ok === false ? smsResult.error : 'SMS failed';
          notify.smsSent = false;
          notify.smsError = errMsg;
          console.warn(`[form-notify-sms] failed: ${errMsg}`);
        }
      } else {
        notify.smsSent = false;
        notify.smsError = 'Kavenegar disabled or missing';
      }
    }

    const submission: FormSubmission = {
      id: `fsub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      formId: form.id,
      formName: form.name,
      answers,
      status: 'new',
      createdAt: new Date().toISOString(),
      pageId: typeof body.pageId === 'string' ? body.pageId : undefined,
      pageSlug: typeof body.pageSlug === 'string' ? body.pageSlug : undefined,
      notify,
    };

    await upsertEntity('form_submissions', submission.id, submission);
    res.status(201).json({
      ok: true,
      id: submission.id,
      message: form.successMessage || 'پیام شما با موفقیت ثبت شد.',
    });
  } catch (err) {
    console.error('POST /forms/:id/submit error:', err);
    res.status(500).json({ error: 'ثبت فرم ناموفق بود' });
  }
});

formsRouter.use('/', formsCrudRouter);
