import type { FormDefinition, FormField, FormFieldOption, FormFieldType } from '../types';

export const DEFAULT_CONTACT_FORM_ID = 'form-contact';

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'متن کوتاه',
  textarea: 'متن بلند',
  email: 'ایمیل',
  tel: 'موبایل / تلفن',
  number: 'عدد',
  select: 'لیست کشویی',
  radio: 'رادیو باتن',
  checkbox: 'چک‌باکس تکی',
  checkboxGroup: 'چک‌باکس چندتایی',
  date: 'تاریخ',
  description: 'توضیحات (بدون ورودی)',
};

export function newFormFieldOption(partial?: Partial<FormFieldOption>): FormFieldOption {
  return {
    id: partial?.id || `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: partial?.label ?? 'گزینه',
  };
}

export function newFormField(partial?: Partial<FormField>): FormField {
  const type = partial?.type || 'text';
  const needsOptions = type === 'select' || type === 'radio' || type === 'checkboxGroup';
  return {
    id: partial?.id || `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: partial?.label ?? 'فیلد جدید',
    type,
    required: partial?.required ?? false,
    placeholder: partial?.placeholder ?? '',
    helpText: partial?.helpText ?? '',
    options: partial?.options
      ? partial.options.map((o) => newFormFieldOption(o))
      : needsOptions
        ? [newFormFieldOption({ label: 'گزینه ۱' }), newFormFieldOption({ label: 'گزینه ۲' })]
        : undefined,
  };
}

export function createDefaultContactForm(): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: DEFAULT_CONTACT_FORM_ID,
    name: 'فرم تماس',
    description: 'فرم پیش‌فرض صفحه تماس با کلینیک',
    submitLabel: 'ارسال پیام',
    successMessage: 'پیام شما با موفقیت ثبت شد.',
    enabled: true,
    notifyEmail: '',
    notifySms: '',
    createdAt: now,
    updatedAt: now,
    fields: [
      newFormField({
        id: 'field-name',
        label: 'نام',
        type: 'text',
        required: true,
        placeholder: 'نام و نام خانوادگی',
      }),
      newFormField({
        id: 'field-phone',
        label: 'موبایل',
        type: 'tel',
        required: true,
        placeholder: '09xxxxxxxxx',
      }),
      newFormField({
        id: 'field-subject',
        label: 'موضوع',
        type: 'select',
        required: false,
        options: [
          newFormFieldOption({ id: 'opt-consult', label: 'مشاوره عمومی' }),
          newFormFieldOption({ id: 'opt-book', label: 'رزرو نوبت' }),
          newFormFieldOption({ id: 'opt-coop', label: 'همکاری' }),
          newFormFieldOption({ id: 'opt-other', label: 'سایر' }),
        ],
      }),
      newFormField({
        id: 'field-message',
        label: 'پیام',
        type: 'textarea',
        required: true,
        placeholder: 'متن پیام شما…',
      }),
    ],
  };
}

export function fieldNeedsOptions(type: FormFieldType): boolean {
  return type === 'select' || type === 'radio' || type === 'checkboxGroup';
}
