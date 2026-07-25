import type {
  FreeGuideField,
  FreeGuideMatchRule,
  FreeGuideOption,
  FreeGuideSettings,
} from '../types';

export const SPECIALTY_CATALOG = [
  { id: 'cbt', label: 'CBT / شناختی رفتاری' },
  { id: 'individual', label: 'مشاوره فردی' },
  { id: 'family', label: 'خانواده / زوج' },
  { id: 'child', label: 'کودک و نوجوان' },
  { id: 'career', label: 'تحصیلی / شغلی' },
  { id: 'assessment', label: 'ارزیابی و تست' },
] as const;

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newFreeGuideOption(label = 'گزینه جدید'): FreeGuideOption {
  return { id: uid('opt'), label };
}

export function newFreeGuideField(partial?: Partial<FreeGuideField>): FreeGuideField {
  return {
    id: uid('field'),
    label: 'سوال جدید',
    type: 'buttons',
    options: [newFreeGuideOption('گزینه ۱'), newFreeGuideOption('گزینه ۲')],
    enabled: true,
    ...partial,
  };
}

export function newFreeGuideMatchRule(partial?: Partial<FreeGuideMatchRule>): FreeGuideMatchRule {
  return {
    id: uid('rule'),
    label: 'قانون جدید',
    conditions: [],
    specialtyKeys: ['individual'],
    ...partial,
  };
}

export const DEFAULT_FREE_GUIDE: FreeGuideSettings = {
  enabled: true,
  badge: 'راهنمای هوشمند',
  title: 'مشاوره رایگان انتخاب درمانگر',
  intro:
    'با پاسخ به چند سوال کوتاه زیر، مناسب‌ترین درمانگر کلینیک ژینو بر اساس دغدغه و شرایط شما پیشنهاد خواهد شد.',
  submitLabel: 'نمایش درمانگر پیشنهادی',
  resultBadge: 'پیشنهاد کلینیک ژینو',
  resultTitle: 'نتیجه آنالیز هوشمند:',
  resultHint: 'بر اساس گزینه‌های انتخابی شما، درمانگر زیر بیشترین تطابق تخصصی را دارد.',
  changeOptionsLabel: 'تغییر گزینه‌ها',
  bookLabelTemplate: 'رزرو نوبت با {name}',
  fields: [
    {
      id: 'ageGroup',
      label: '۱. مراجعه‌کننده اصلی چه کسی است؟',
      type: 'buttons',
      enabled: true,
      options: [
        { id: 'adult', label: 'بزرگسال (خودم یا دیگران)' },
        { id: 'couple', label: 'زوج یا همسران' },
        { id: 'child', label: 'کودک (۳ تا ۱۲ سال)' },
        { id: 'teen', label: 'نوجوان (۱۳ تا ۱۸ سال)' },
      ],
    },
    {
      id: 'mainConcern',
      label: '۲. موضوع یا دغدغه اصلی چیست؟',
      type: 'select',
      enabled: true,
      options: [
        { id: 'anxiety', label: 'اضطراب، استرس یا وسواس' },
        { id: 'depression', label: 'افسردگی و افت انگیزه' },
        { id: 'marriage', label: 'روابط عاطفی و مشاوره ازدواج' },
        { id: 'child-behavior', label: 'مشکلات رفتاری کودک / بازی‌درمانی' },
        { id: 'career', label: 'هدایت تحصیلی، شغلی و کوچینگ' },
        { id: 'assessment', label: 'تست هوش و ارزیابی شخصیت' },
      ],
    },
    {
      id: 'format',
      label: '۳. ترجیح شما برای شیوه جلسه:',
      type: 'buttons',
      enabled: true,
      options: [
        { id: 'in-person', label: 'حضوری در کلینیک' },
        { id: 'online', label: 'آنلاین تصویری' },
      ],
    },
  ],
  matchRules: [
    {
      id: 'rule-child',
      label: 'کودک → تخصص کودک',
      conditions: [{ fieldId: 'ageGroup', optionId: 'child' }],
      specialtyKeys: ['child'],
    },
    {
      id: 'rule-teen',
      label: 'نوجوان → تخصص کودک',
      conditions: [{ fieldId: 'ageGroup', optionId: 'teen' }],
      specialtyKeys: ['child'],
    },
    {
      id: 'rule-couple',
      label: 'زوج → تخصص خانواده',
      conditions: [{ fieldId: 'ageGroup', optionId: 'couple' }],
      specialtyKeys: ['family'],
    },
    {
      id: 'rule-career',
      label: 'دغدغه شغلی → تخصص شغلی',
      conditions: [{ fieldId: 'mainConcern', optionId: 'career' }],
      specialtyKeys: ['career', 'individual', 'cbt'],
    },
    {
      id: 'rule-assessment',
      label: 'ارزیابی → تخصص تست',
      conditions: [{ fieldId: 'mainConcern', optionId: 'assessment' }],
      specialtyKeys: ['assessment'],
    },
  ],
  fallbackSpecialtyKeys: ['cbt', 'individual'],
};

function mergeOption(raw: Partial<FreeGuideOption> | null | undefined, fallback: FreeGuideOption): FreeGuideOption {
  return {
    id: String(raw?.id || fallback.id).trim() || fallback.id,
    label: raw?.label != null ? String(raw.label) : fallback.label,
  };
}

function mergeField(raw: Partial<FreeGuideField> | null | undefined, fallback: FreeGuideField): FreeGuideField {
  const optionsRaw = Array.isArray(raw?.options) ? raw!.options : fallback.options;
  const options =
    optionsRaw.length > 0
      ? optionsRaw.map((o, i) =>
          mergeOption(o, fallback.options[i] || { id: `opt-${i}`, label: `گزینه ${i + 1}` })
        )
      : fallback.options.map((o) => ({ ...o }));

  const type = raw?.type === 'select' || raw?.type === 'buttons' ? raw.type : fallback.type;

  return {
    id: String(raw?.id || fallback.id).trim() || fallback.id,
    label: raw?.label != null ? String(raw.label) : fallback.label,
    type,
    enabled: raw?.enabled != null ? Boolean(raw.enabled) : fallback.enabled,
    options,
  };
}

function mergeRule(
  raw: Partial<FreeGuideMatchRule> | null | undefined,
  fallback: FreeGuideMatchRule
): FreeGuideMatchRule {
  const conditions = Array.isArray(raw?.conditions)
    ? raw!.conditions
        .filter((c) => c && c.fieldId && c.optionId)
        .map((c) => ({
          fieldId: String(c.fieldId),
          optionId: String(c.optionId),
        }))
    : fallback.conditions.map((c) => ({ ...c }));

  const specialtyKeys = Array.isArray(raw?.specialtyKeys)
    ? raw!.specialtyKeys.map((k) => String(k).trim()).filter(Boolean)
    : [...fallback.specialtyKeys];

  return {
    id: String(raw?.id || fallback.id).trim() || fallback.id,
    label: raw?.label != null ? String(raw.label) : fallback.label,
    conditions,
    specialtyKeys: specialtyKeys.length ? specialtyKeys : [...fallback.specialtyKeys],
  };
}

export function mergeFreeGuide(partial?: Partial<FreeGuideSettings> | null): FreeGuideSettings {
  const base = DEFAULT_FREE_GUIDE;
  if (!partial) {
    return {
      ...base,
      fields: base.fields.map((f) => ({
        ...f,
        options: f.options.map((o) => ({ ...o })),
      })),
      matchRules: base.matchRules.map((r) => ({
        ...r,
        conditions: r.conditions.map((c) => ({ ...c })),
        specialtyKeys: [...r.specialtyKeys],
      })),
      fallbackSpecialtyKeys: [...base.fallbackSpecialtyKeys],
    };
  }

  const fieldsRaw = Array.isArray(partial.fields) ? partial.fields : null;
  const fields =
    fieldsRaw && fieldsRaw.length > 0
      ? fieldsRaw.map((f, i) => mergeField(f, base.fields[i] || newFreeGuideField({ id: `field-${i}` })))
      : base.fields.map((f) => ({
          ...f,
          options: f.options.map((o) => ({ ...o })),
        }));

  const rulesRaw = Array.isArray(partial.matchRules) ? partial.matchRules : null;
  const matchRules =
    rulesRaw != null
      ? rulesRaw.map((r, i) =>
          mergeRule(r, base.matchRules[i] || newFreeGuideMatchRule({ id: `rule-${i}` }))
        )
      : base.matchRules.map((r) => ({
          ...r,
          conditions: r.conditions.map((c) => ({ ...c })),
          specialtyKeys: [...r.specialtyKeys],
        }));

  const fallbackSpecialtyKeys = Array.isArray(partial.fallbackSpecialtyKeys)
    ? partial.fallbackSpecialtyKeys.map((k) => String(k).trim()).filter(Boolean)
    : [...base.fallbackSpecialtyKeys];

  return {
    enabled: partial.enabled != null ? Boolean(partial.enabled) : base.enabled,
    badge: partial.badge != null ? String(partial.badge) : base.badge,
    title: partial.title != null ? String(partial.title) : base.title,
    intro: partial.intro != null ? String(partial.intro) : base.intro,
    submitLabel: partial.submitLabel != null ? String(partial.submitLabel) : base.submitLabel,
    resultBadge: partial.resultBadge != null ? String(partial.resultBadge) : base.resultBadge,
    resultTitle: partial.resultTitle != null ? String(partial.resultTitle) : base.resultTitle,
    resultHint: partial.resultHint != null ? String(partial.resultHint) : base.resultHint,
    changeOptionsLabel:
      partial.changeOptionsLabel != null ? String(partial.changeOptionsLabel) : base.changeOptionsLabel,
    bookLabelTemplate:
      partial.bookLabelTemplate != null ? String(partial.bookLabelTemplate) : base.bookLabelTemplate,
    fields,
    matchRules,
    fallbackSpecialtyKeys: fallbackSpecialtyKeys.length
      ? fallbackSpecialtyKeys
      : [...base.fallbackSpecialtyKeys],
  };
}

/** Pick specialty keys from answers using ordered match rules. */
export function resolveGuideSpecialtyKeys(
  config: FreeGuideSettings,
  answers: Record<string, string>
): string[] {
  for (const rule of config.matchRules) {
    if (!rule.conditions.length) continue;
    const ok = rule.conditions.every((c) => answers[c.fieldId] === c.optionId);
    if (ok && rule.specialtyKeys.length) return rule.specialtyKeys;
  }
  return config.fallbackSpecialtyKeys.length
    ? config.fallbackSpecialtyKeys
    : DEFAULT_FREE_GUIDE.fallbackSpecialtyKeys;
}

export function enabledGuideFields(config: FreeGuideSettings): FreeGuideField[] {
  return (config.fields || []).filter((f) => f.enabled !== false && f.options?.length > 0);
}

export function defaultGuideAnswers(config: FreeGuideSettings): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of enabledGuideFields(config)) {
    out[field.id] = field.options[0]?.id || '';
  }
  return out;
}

export function formatBookLabel(template: string, doctorName: string): string {
  const short = doctorName.split(/\s+/).filter(Boolean)[1] || doctorName;
  return String(template || DEFAULT_FREE_GUIDE.bookLabelTemplate)
    .replace(/\{name\}/g, short)
    .replace(/\{fullName\}/g, doctorName);
}
