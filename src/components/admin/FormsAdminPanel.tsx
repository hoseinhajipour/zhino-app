import React, { useEffect, useMemo, useState } from 'react';
import type {
  FormAnswerValue,
  FormDefinition,
  FormField,
  FormFieldType,
  FormSubmission,
  FormSubmissionStatus,
  UserRole,
} from '../../types';
import {
  createDefaultContactForm,
  fieldNeedsOptions,
  FORM_FIELD_TYPE_LABELS,
  newFormField,
  newFormFieldOption,
} from '../../lib/formDefaults';
import {
  canManageFormDefinitions,
  canManageFormSubmissions,
} from '../../lib/adminPermissions';
import {
  deleteForm,
  deleteFormSubmission,
  saveForm,
  saveFormSubmission,
  subscribeForms,
  subscribeFormSubmissions,
} from '../../lib/dbService';

interface FormsAdminPanelProps {
  role?: UserRole | string | null;
}

type PanelTab = 'definitions' | 'submissions';

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

const FIELD_TYPES = Object.keys(FORM_FIELD_TYPE_LABELS) as FormFieldType[];

function formatAnswerDisplay(field: FormField | undefined, value: FormAnswerValue | undefined): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    return value
      .map((id) => field?.options?.find((o) => o.id === id)?.label || id)
      .join('، ');
  }
  if (field && (field.type === 'select' || field.type === 'radio')) {
    return field.options?.find((o) => o.id === value)?.label || String(value);
  }
  return String(value) || '—';
}

function blankForm(): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: `form-${Date.now()}`,
    name: 'فرم جدید',
    description: '',
    submitLabel: 'ارسال',
    successMessage: 'با تشکر، اطلاعات شما ثبت شد.',
    enabled: true,
    notifyEmail: '',
    notifySms: '',
    createdAt: now,
    updatedAt: now,
    fields: [
      newFormField({ label: 'نام', type: 'text', required: true }),
      newFormField({ label: 'موبایل', type: 'tel', required: true }),
    ],
  };
}

export const FormsAdminPanel: React.FC<FormsAdminPanelProps> = ({ role }) => {
  const canDefs = canManageFormDefinitions(role);
  const canSubs = canManageFormSubmissions(role);

  const [tab, setTab] = useState<PanelTab>(canDefs ? 'definitions' : 'submissions');
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [editing, setEditing] = useState<FormDefinition | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formFilter, setFormFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FormSubmissionStatus>('all');
  const [selectedSub, setSelectedSub] = useState<FormSubmission | null>(null);

  useEffect(() => {
    const unsubForms = subscribeForms(setForms);
    const unsubSubs = subscribeFormSubmissions(setSubmissions);
    return () => {
      unsubForms();
      unsubSubs();
    };
  }, []);

  useEffect(() => {
    if (!canDefs && tab === 'definitions') setTab('submissions');
  }, [canDefs, tab]);

  const formById = useMemo(() => {
    const map = new Map<string, FormDefinition>();
    for (const f of forms) map.set(f.id, f);
    return map;
  }, [forms]);

  const filteredSubs = useMemo(() => {
    return [...submissions]
      .filter((s) => (formFilter === 'all' ? true : s.formId === formFilter))
      .filter((s) => (statusFilter === 'all' ? true : s.status === statusFilter))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [submissions, formFilter, statusFilter]);

  const newCount = submissions.filter((s) => s.status === 'new').length;

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const startCreate = () => {
    setEditing(blankForm());
  };

  const startEdit = (form: FormDefinition) => {
    setEditing(JSON.parse(JSON.stringify(form)) as FormDefinition);
  };

  const patchEditing = (partial: Partial<FormDefinition>) => {
    if (!editing) return;
    setEditing({ ...editing, ...partial });
  };

  const updateField = (fieldId: string, partial: Partial<FormField>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      fields: editing.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const next = { ...f, ...partial };
        if (partial.type && fieldNeedsOptions(partial.type) && !next.options?.length) {
          next.options = [
            newFormFieldOption({ label: 'گزینه ۱' }),
            newFormFieldOption({ label: 'گزینه ۲' }),
          ];
        }
        if (partial.type && !fieldNeedsOptions(partial.type)) {
          next.options = undefined;
        }
        return next;
      }),
    });
  };

  const moveField = (index: number, dir: -1 | 1) => {
    if (!editing) return;
    const next = [...editing.fields];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setEditing({ ...editing, fields: next });
  };

  const handleSaveForm = async () => {
    if (!editing || !canDefs) return;
    if (!editing.name.trim()) {
      showMsg('error', 'نام فرم الزامی است');
      return;
    }
    if (!editing.fields.length) {
      showMsg('error', 'حداقل یک فیلد لازم است');
      return;
    }
    setSaving(true);
    try {
      const payload: FormDefinition = {
        ...editing,
        name: editing.name.trim(),
        updatedAt: new Date().toISOString(),
        createdAt: editing.createdAt || new Date().toISOString(),
      };
      await saveForm(payload);
      setEditing(null);
      showMsg('success', 'فرم ذخیره شد');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطا در ذخیره فرم');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!canDefs) return;
    if (!confirm('این فرم حذف شود؟ ارسال‌های قبلی باقی می‌مانند.')) return;
    try {
      await deleteForm(id);
      if (editing?.id === id) setEditing(null);
      showMsg('success', 'فرم حذف شد');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'حذف ناموفق بود');
    }
  };

  const handleEnsureDefault = async () => {
    if (!canDefs) return;
    setSaving(true);
    try {
      await saveForm(createDefaultContactForm());
      showMsg('success', 'فرم تماس پیش‌فرض ذخیره شد');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  };

  const setSubmissionStatus = async (sub: FormSubmission, status: FormSubmissionStatus) => {
    if (!canSubs) return;
    try {
      const next = { ...sub, status };
      await saveFormSubmission(next);
      setSelectedSub(next);
      showMsg('success', 'وضعیت به‌روز شد');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطا در به‌روزرسانی');
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!canSubs) return;
    if (!confirm('این ارسال حذف شود؟')) return;
    try {
      await deleteFormSubmission(id);
      if (selectedSub?.id === id) setSelectedSub(null);
      showMsg('success', 'ارسال حذف شد');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'حذف ناموفق بود');
    }
  };

  const statusLabel = (s: FormSubmissionStatus) =>
    s === 'new' ? 'جدید' : s === 'read' ? 'خوانده‌شده' : 'آرشیو';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">dynamic_form</span>
            مدیریت فرم‌ها و ارسال‌ها
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            تعریف فرم‌های قابل استفاده در صفحه‌ساز و پیگیری پیام‌های ثبت‌شده
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full">
            {forms.length} فرم
          </span>
          <span className="bg-amber-500/10 text-amber-800 font-bold px-3 py-1.5 rounded-full">
            {newCount} ارسال جدید
          </span>
        </div>
      </div>

      {msg && (
        <div
          className={`text-xs font-bold px-4 py-3 rounded-2xl ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-rose-50 text-rose-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex bg-surface-container-low p-1 rounded-xl w-fit text-xs font-bold">
        {canDefs && (
          <button
            type="button"
            onClick={() => setTab('definitions')}
            className={`px-4 py-2 rounded-lg transition-all ${
              tab === 'definitions' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
            }`}
          >
            تعاریف فرم
          </button>
        )}
        {canSubs && (
          <button
            type="button"
            onClick={() => setTab('submissions')}
            className={`px-4 py-2 rounded-lg transition-all ${
              tab === 'submissions' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
            }`}
          >
            ارسال‌ها
          </button>
        )}
      </div>

      {tab === 'definitions' && canDefs && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-on-surface">لیست فرم‌ها</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEnsureDefault}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-primary"
                >
                  فرم تماس پیش‌فرض
                </button>
                <button
                  type="button"
                  onClick={startCreate}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-white"
                >
                  + فرم جدید
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {forms.length === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant bg-white dark:bg-surface-dim rounded-2xl border border-outline-variant/30">
                  هنوز فرمی تعریف نشده است.
                </div>
              ) : (
                forms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => startEdit(form)}
                    className={`w-full text-right p-4 rounded-2xl border transition-all ${
                      editing?.id === form.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/30 bg-white dark:bg-surface-dim hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-on-surface">{form.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          form.enabled
                            ? 'bg-emerald-500/10 text-emerald-800'
                            : 'bg-slate-500/10 text-slate-600'
                        }`}
                      >
                        {form.enabled ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      {form.fields?.length || 0} فیلد
                      {form.notifyEmail ? ' · ایمیل' : ''}
                      {form.notifySms ? ' · پیامک' : ''}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="xl:col-span-8">
            {!editing ? (
              <div className="p-10 text-center text-xs text-on-surface-variant bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30">
                یک فرم را انتخاب کنید یا فرم جدید بسازید.
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-dim p-5 md:p-6 rounded-3xl border border-outline-variant/30 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-on-surface">ویرایش فرم</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteForm(editing.id)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50"
                    >
                      حذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-outline-variant/40"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveForm()}
                      className="text-[11px] font-bold px-4 py-1.5 rounded-lg bg-primary text-white disabled:opacity-60"
                    >
                      {saving ? 'در حال ذخیره…' : 'ذخیره فرم'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="space-y-1 sm:col-span-2">
                    <span className="font-bold">نام فرم</span>
                    <input
                      className={fieldCls}
                      value={editing.name}
                      onChange={(e) => patchEditing({ name: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="font-bold">توضیح داخلی</span>
                    <textarea
                      className={fieldCls}
                      rows={2}
                      value={editing.description || ''}
                      onChange={(e) => patchEditing({ description: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">متن دکمه ارسال</span>
                    <input
                      className={fieldCls}
                      value={editing.submitLabel || ''}
                      onChange={(e) => patchEditing({ submitLabel: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">پیام موفقیت</span>
                    <input
                      className={fieldCls}
                      value={editing.successMessage || ''}
                      onChange={(e) => patchEditing({ successMessage: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">ایمیل اعلان</span>
                    <input
                      className={fieldCls}
                      dir="ltr"
                      placeholder="ops@example.com"
                      value={editing.notifyEmail || ''}
                      onChange={(e) => patchEditing({ notifyEmail: e.target.value })}
                    />
                    <span className="text-[10px] text-on-surface-variant">
                      فعلاً فقط در سرور لاگ می‌شود (SMTP بعدی)
                    </span>
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">شماره پیامک اعلان</span>
                    <input
                      className={fieldCls}
                      dir="ltr"
                      placeholder="09xxxxxxxxx"
                      value={editing.notifySms || ''}
                      onChange={(e) => patchEditing({ notifySms: e.target.value })}
                    />
                    <span className="text-[10px] text-on-surface-variant">
                      در صورت فعال بودن کاوه‌نگار ارسال می‌شود
                    </span>
                  </label>
                  <label className="flex items-center gap-2 sm:col-span-2 pt-1">
                    <input
                      type="checkbox"
                      checked={editing.enabled !== false}
                      onChange={(e) => patchEditing({ enabled: e.target.checked })}
                    />
                    <span className="font-bold">فرم فعال است</span>
                  </label>
                </div>

                <div className="space-y-3 border-t border-outline-variant/20 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-on-surface">فیلدهای فرم</h4>
                    <button
                      type="button"
                      onClick={() =>
                        patchEditing({
                          fields: [...editing.fields, newFormField()],
                        })
                      }
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-surface-container-low text-primary"
                    >
                      + افزودن فیلد
                    </button>
                  </div>

                  {editing.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-on-surface">فیلد {index + 1}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveField(index, -1)}
                            className="p-1.5 rounded-lg hover:bg-white"
                            title="بالا"
                          >
                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, 1)}
                            className="p-1.5 rounded-lg hover:bg-white"
                            title="پایین"
                          >
                            <span className="material-symbols-outlined text-base">arrow_downward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchEditing({
                                fields: editing.fields.filter((f) => f.id !== field.id),
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="حذف"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="space-y-1">
                          <span className="font-bold">برچسب</span>
                          <input
                            className={fieldCls}
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">نوع</span>
                          <select
                            className={fieldCls}
                            value={field.type}
                            onChange={(e) =>
                              updateField(field.id, { type: e.target.value as FormFieldType })
                            }
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {FORM_FIELD_TYPE_LABELS[t]}
                              </option>
                            ))}
                          </select>
                        </label>
                        {field.type !== 'description' && field.type !== 'checkbox' && (
                          <label className="space-y-1">
                            <span className="font-bold">Placeholder</span>
                            <input
                              className={fieldCls}
                              value={field.placeholder || ''}
                              onChange={(e) =>
                                updateField(field.id, { placeholder: e.target.value })
                              }
                            />
                          </label>
                        )}
                        <label className="space-y-1">
                          <span className="font-bold">متن راهنما</span>
                          <input
                            className={fieldCls}
                            value={field.helpText || ''}
                            onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                          />
                        </label>
                        {field.type !== 'description' && (
                          <label className="flex items-center gap-2 sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={!!field.required}
                              onChange={(e) =>
                                updateField(field.id, { required: e.target.checked })
                              }
                            />
                            <span className="font-bold">الزامی</span>
                          </label>
                        )}
                      </div>

                      {fieldNeedsOptions(field.type) && (
                        <div className="space-y-2 border-t border-outline-variant/20 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">گزینه‌ها</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateField(field.id, {
                                  options: [
                                    ...(field.options || []),
                                    newFormFieldOption({
                                      label: `گزینه ${(field.options?.length || 0) + 1}`,
                                    }),
                                  ],
                                })
                              }
                              className="text-[11px] font-bold text-primary"
                            >
                              + گزینه
                            </button>
                          </div>
                          {(field.options || []).map((opt) => (
                            <div key={opt.id} className="flex gap-2 items-center">
                              <input
                                className={fieldCls}
                                value={opt.label}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    options: (field.options || []).map((o) =>
                                      o.id === opt.id ? { ...o, label: e.target.value } : o
                                    ),
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateField(field.id, {
                                    options: (field.options || []).filter((o) => o.id !== opt.id),
                                  })
                                }
                                className="text-rose-600 p-1"
                              >
                                <span className="material-symbols-outlined text-base">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'submissions' && canSubs && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface-dim p-4 rounded-2xl border border-outline-variant/30 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold">فرم:</span>
              <select
                className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl font-bold"
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
              >
                <option value="all">همه</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">وضعیت:</span>
              <div className="flex bg-surface-container-low p-1 rounded-xl">
                {(
                  [
                    { id: 'all', title: 'همه' },
                    { id: 'new', title: 'جدید' },
                    { id: 'read', title: 'خوانده‌شده' },
                    { id: 'archived', title: 'آرشیو' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      statusFilter === st.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {st.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-5 space-y-2">
              {filteredSubs.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant bg-white dark:bg-surface-dim rounded-2xl border border-outline-variant/30">
                  ارسالی یافت نشد.
                </div>
              ) : (
                filteredSubs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedSub(sub);
                      if (sub.status === 'new') void setSubmissionStatus(sub, 'read');
                    }}
                    className={`w-full text-right p-4 rounded-2xl border transition-all ${
                      selectedSub?.id === sub.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/30 bg-white dark:bg-surface-dim'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-on-surface">{sub.formName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          sub.status === 'new'
                            ? 'bg-amber-500/10 text-amber-800'
                            : sub.status === 'read'
                              ? 'bg-sky-500/10 text-sky-800'
                              : 'bg-slate-500/10 text-slate-600'
                        }`}
                      >
                        {statusLabel(sub.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1" dir="ltr">
                      {sub.createdAt
                        ? new Date(sub.createdAt).toLocaleString('fa-IR')
                        : '—'}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="xl:col-span-7">
              {!selectedSub ? (
                <div className="p-10 text-center text-xs text-on-surface-variant bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30">
                  یک ارسال را برای مشاهده جزئیات انتخاب کنید.
                </div>
              ) : (
                <div className="bg-white dark:bg-surface-dim p-5 md:p-6 rounded-3xl border border-outline-variant/30 space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{selectedSub.formName}</h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5" dir="ltr">
                        {selectedSub.createdAt
                          ? new Date(selectedSub.createdAt).toLocaleString('fa-IR')
                          : '—'}
                        {selectedSub.pageSlug ? ` · /${selectedSub.pageSlug}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void setSubmissionStatus(selectedSub, 'read')}
                        className="px-3 py-1.5 rounded-lg font-bold bg-sky-50 text-sky-800"
                      >
                        خوانده‌شده
                      </button>
                      <button
                        type="button"
                        onClick={() => void setSubmissionStatus(selectedSub, 'archived')}
                        className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-700"
                      >
                        آرشیو
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSubmission(selectedSub.id)}
                        className="px-3 py-1.5 rounded-lg font-bold bg-rose-50 text-rose-700"
                      >
                        حذف
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(selectedSub.answers || {}).map(([fieldId, value]) => {
                      const field = formById.get(selectedSub.formId)?.fields?.find(
                        (f) => f.id === fieldId
                      );
                      return (
                        <div
                          key={fieldId}
                          className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/15"
                        >
                          <p className="font-bold text-on-surface mb-1">
                            {field?.label || fieldId}
                          </p>
                          <p className="text-on-surface-variant whitespace-pre-wrap">
                            {formatAnswerDisplay(field, value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {selectedSub.notify && (
                    <div className="text-[11px] text-on-surface-variant border-t border-outline-variant/20 pt-3 space-y-1">
                      {selectedSub.notify.emailLogged && <p>ایمیل اعلان لاگ شد</p>}
                      {selectedSub.notify.smsSent && <p>پیامک اعلان ارسال شد</p>}
                      {selectedSub.notify.smsError && (
                        <p className="text-amber-700">پیامک: {selectedSub.notify.smsError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
