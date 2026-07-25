import React, { useEffect, useState } from 'react';
import type { FreeGuideField, FreeGuideMatchRule, FreeGuideSettings } from '../../types';
import {
  DEFAULT_FREE_GUIDE,
  SPECIALTY_CATALOG,
  mergeFreeGuide,
  newFreeGuideField,
  newFreeGuideMatchRule,
  newFreeGuideOption,
} from '../../lib/freeGuideDefaults';

interface FreeGuideSettingsPanelProps {
  value: FreeGuideSettings;
  onChange: (next: FreeGuideSettings) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
  saveMsg?: { type: 'success' | 'error'; msg: string } | null;
}

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

type PanelTab = 'texts' | 'fields' | 'rules';

export const FreeGuideSettingsPanel: React.FC<FreeGuideSettingsPanelProps> = ({
  value,
  onChange,
  onSave,
  saving,
  saveMsg,
}) => {
  const [draft, setDraft] = useState<FreeGuideSettings>(() =>
    mergeFreeGuide(value || DEFAULT_FREE_GUIDE)
  );
  const [tab, setTab] = useState<PanelTab>('texts');

  useEffect(() => {
    setDraft(mergeFreeGuide(value || DEFAULT_FREE_GUIDE));
  }, [value]);

  const patch = (partial: Partial<FreeGuideSettings>) => {
    const next = mergeFreeGuide({ ...draft, ...partial });
    setDraft(next);
    onChange(next);
  };

  const updateField = (fieldId: string, partial: Partial<FreeGuideField>) => {
    patch({
      fields: draft.fields.map((f) => (f.id === fieldId ? { ...f, ...partial } : f)),
    });
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const next = [...draft.fields];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    patch({ fields: next });
  };

  const removeField = (fieldId: string) => {
    if (draft.fields.length <= 1) return;
    patch({
      fields: draft.fields.filter((f) => f.id !== fieldId),
      matchRules: draft.matchRules.map((r) => ({
        ...r,
        conditions: r.conditions.filter((c) => c.fieldId !== fieldId),
      })),
    });
  };

  const updateOption = (fieldId: string, optionId: string, label: string) => {
    updateField(fieldId, {
      options: draft.fields
        .find((f) => f.id === fieldId)!
        .options.map((o) => (o.id === optionId ? { ...o, label } : o)),
    });
  };

  const removeOption = (fieldId: string, optionId: string) => {
    const field = draft.fields.find((f) => f.id === fieldId);
    if (!field || field.options.length <= 1) return;
    patch({
      fields: draft.fields.map((f) =>
        f.id === fieldId ? { ...f, options: f.options.filter((o) => o.id !== optionId) } : f
      ),
      matchRules: draft.matchRules.map((r) => ({
        ...r,
        conditions: r.conditions.filter(
          (c) => !(c.fieldId === fieldId && c.optionId === optionId)
        ),
      })),
    });
  };

  const updateRule = (ruleId: string, partial: Partial<FreeGuideMatchRule>) => {
    patch({
      matchRules: draft.matchRules.map((r) => (r.id === ruleId ? { ...r, ...partial } : r)),
    });
  };

  const moveRule = (index: number, dir: -1 | 1) => {
    const next = [...draft.matchRules];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    patch({ matchRules: next });
  };

  const toggleSpecialty = (ruleId: string, key: string) => {
    const rule = draft.matchRules.find((r) => r.id === ruleId);
    if (!rule) return;
    const has = rule.specialtyKeys.includes(key);
    updateRule(ruleId, {
      specialtyKeys: has
        ? rule.specialtyKeys.filter((k) => k !== key)
        : [...rule.specialtyKeys, key],
    });
  };

  const toggleFallback = (key: string) => {
    const has = draft.fallbackSpecialtyKeys.includes(key);
    patch({
      fallbackSpecialtyKeys: has
        ? draft.fallbackSpecialtyKeys.filter((k) => k !== key)
        : [...draft.fallbackSpecialtyKeys, key],
    });
  };

  const tabs: { id: PanelTab; label: string; icon: string }[] = [
    { id: 'texts', label: 'متن‌ها', icon: 'title' },
    { id: 'fields', label: 'سوال‌های فرم', icon: 'list_alt' },
    { id: 'rules', label: 'قوانین پیشنهاد', icon: 'rule' },
  ];

  return (
    <div className="space-y-6">
      {saveMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            saveMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined">
            {saveMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{saveMsg.msg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">فرم مشاوره انتخاب درمانگر</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                سوال‌ها، متن‌ها و قوانین پیشنهاد درمانگر را اینجا ویرایش کنید
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
                className="w-4 h-4 accent-secondary rounded"
              />
              <span>فعال در سایت</span>
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-base">save</span>
              )}
              <span>ذخیره فرم</span>
            </button>
          </div>
        </div>

        <div className="px-5 pt-4 flex gap-1.5 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-secondary text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {tab === 'texts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5">نشان بالای عنوان</label>
                <input
                  className={fieldCls}
                  value={draft.badge}
                  onChange={(e) => patch({ badge: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">عنوان مودال</label>
                <input
                  className={fieldCls}
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1.5">متن معرفی فرم</label>
                <textarea
                  rows={3}
                  className={fieldCls}
                  value={draft.intro}
                  onChange={(e) => patch({ intro: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">متن دکمه ارسال</label>
                <input
                  className={fieldCls}
                  value={draft.submitLabel}
                  onChange={(e) => patch({ submitLabel: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">نشان نتیجه</label>
                <input
                  className={fieldCls}
                  value={draft.resultBadge}
                  onChange={(e) => patch({ resultBadge: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">عنوان نتیجه</label>
                <input
                  className={fieldCls}
                  value={draft.resultTitle}
                  onChange={(e) => patch({ resultTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">توضیح نتیجه</label>
                <input
                  className={fieldCls}
                  value={draft.resultHint}
                  onChange={(e) => patch({ resultHint: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">متن دکمه تغییر گزینه‌ها</label>
                <input
                  className={fieldCls}
                  value={draft.changeOptionsLabel}
                  onChange={(e) => patch({ changeOptionsLabel: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">الگوی دکمه رزرو</label>
                <input
                  className={fieldCls}
                  value={draft.bookLabelTemplate}
                  onChange={(e) => patch({ bookLabelTemplate: e.target.value })}
                  dir="rtl"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  از {'{name}'} برای نام کوتاه و {'{fullName}'} برای نام کامل استفاده کنید
                </p>
              </div>
            </div>
          )}

          {tab === 'fields' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-3">
                <p className="text-xs text-on-surface-variant">
                  سوال‌های فرم را اضافه، حذف یا جابه‌جا کنید. هر سوال می‌تواند دکمه‌ای یا کشویی باشد.
                </p>
                <button
                  type="button"
                  onClick={() => patch({ fields: [...draft.fields, newFreeGuideField()] })}
                  className="shrink-0 px-3 py-2 text-xs font-bold rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  سوال جدید
                </button>
              </div>

              {draft.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-on-surface-variant bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border">
                        #{index + 1}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={(e) => updateField(field.id, { enabled: e.target.checked })}
                          className="w-4 h-4 accent-secondary"
                        />
                        نمایش در فرم
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center disabled:opacity-30"
                        title="بالا"
                      >
                        <span className="material-symbols-outlined text-base">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(index, 1)}
                        disabled={index === draft.fields.length - 1}
                        className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center disabled:opacity-30"
                        title="پایین"
                      >
                        <span className="material-symbols-outlined text-base">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        disabled={draft.fields.length <= 1}
                        className="w-8 h-8 rounded-lg border border-rose-200 text-rose-600 flex items-center justify-center disabled:opacity-30"
                        title="حذف"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="block font-bold mb-1">متن سوال</label>
                      <input
                        className={fieldCls}
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">نوع نمایش</label>
                      <select
                        className={fieldCls}
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, {
                            type: e.target.value === 'select' ? 'select' : 'buttons',
                          })
                        }
                      >
                        <option value="buttons">دکمه‌های انتخابی</option>
                        <option value="select">لیست کشویی</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">گزینه‌ها</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(field.id, {
                            options: [...field.options, newFreeGuideOption()],
                          })
                        }
                        className="text-[11px] font-bold text-secondary flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        گزینه
                      </button>
                    </div>
                    {field.options.map((opt) => (
                      <div key={opt.id} className="flex gap-2 items-center">
                        <input
                          className={fieldCls}
                          value={opt.label}
                          onChange={(e) => updateOption(field.id, opt.id, e.target.value)}
                        />
                        <code
                          className="text-[10px] text-on-surface-variant shrink-0 px-2 py-2 bg-white dark:bg-slate-950 rounded-lg border max-w-[7rem] truncate"
                          title={opt.id}
                        >
                          {opt.id}
                        </code>
                        <button
                          type="button"
                          onClick={() => removeOption(field.id, opt.id)}
                          disabled={field.options.length <= 1}
                          className="w-9 h-9 shrink-0 rounded-lg border border-rose-200 text-rose-600 flex items-center justify-center disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'rules' && (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                قوانین از بالا به پایین بررسی می‌شوند؛ اولین قانونی که همه شرط‌هایش با پاسخ کاربر
                جور باشد، تخصص‌های همان قانون برای پیشنهاد درمانگر استفاده می‌شود.
              </p>

              <div className="rounded-2xl border border-outline-variant/30 p-4 space-y-3">
                <h3 className="text-xs font-black">تخصص‌های پیش‌فرض (اگر هیچ قانونی جور نشد)</h3>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_CATALOG.map((s) => (
                    <label
                      key={s.id}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        draft.fallbackSpecialtyKeys.includes(s.id)
                          ? 'border-secondary bg-secondary/10 text-secondary'
                          : 'border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={draft.fallbackSpecialtyKeys.includes(s.id)}
                        onChange={() => toggleFallback(s.id)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    patch({ matchRules: [...draft.matchRules, newFreeGuideMatchRule()] })
                  }
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  قانون جدید
                </button>
              </div>

              {draft.matchRules.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-6">
                  قانونی تعریف نشده — فقط تخصص‌های پیش‌فرض استفاده می‌شوند.
                </p>
              )}

              {draft.matchRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      className={`${fieldCls} max-w-md text-xs font-bold`}
                      value={rule.label}
                      onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                      placeholder="عنوان قانون"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveRule(index, -1)}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-base">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRule(index, 1)}
                        disabled={index === draft.matchRules.length - 1}
                        className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-base">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patch({
                            matchRules: draft.matchRules.filter((r) => r.id !== rule.id),
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-rose-200 text-rose-600 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">شرط‌ها (همه باید برقرار باشند)</span>
                      <button
                        type="button"
                        onClick={() => {
                          const first = draft.fields[0];
                          if (!first?.options[0]) return;
                          updateRule(rule.id, {
                            conditions: [
                              ...rule.conditions,
                              { fieldId: first.id, optionId: first.options[0].id },
                            ],
                          });
                        }}
                        className="text-[11px] font-bold text-secondary flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        شرط
                      </button>
                    </div>
                    {rule.conditions.map((cond, ci) => {
                      const field = draft.fields.find((f) => f.id === cond.fieldId);
                      return (
                        <div key={`${cond.fieldId}-${ci}`} className="flex flex-wrap gap-2 items-center">
                          <select
                            className={`${fieldCls} max-w-[14rem]`}
                            value={cond.fieldId}
                            onChange={(e) => {
                              const f = draft.fields.find((x) => x.id === e.target.value);
                              const next = [...rule.conditions];
                              next[ci] = {
                                fieldId: e.target.value,
                                optionId: f?.options[0]?.id || '',
                              };
                              updateRule(rule.id, { conditions: next });
                            }}
                          >
                            {draft.fields.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-on-surface-variant">=</span>
                          <select
                            className={`${fieldCls} max-w-[14rem]`}
                            value={cond.optionId}
                            onChange={(e) => {
                              const next = [...rule.conditions];
                              next[ci] = { ...cond, optionId: e.target.value };
                              updateRule(rule.id, { conditions: next });
                            }}
                          >
                            {(field?.options || []).map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              updateRule(rule.id, {
                                conditions: rule.conditions.filter((_, i) => i !== ci),
                              })
                            }
                            className="w-9 h-9 rounded-lg border border-rose-200 text-rose-600 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      );
                    })}
                    {rule.conditions.length === 0 && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        بدون شرط این قانون هرگز اجرا نمی‌شود — حداقل یک شرط اضافه کنید.
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-bold block mb-2">تخصص‌های پیشنهادی (به ترتیب اولویت)</span>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTY_CATALOG.map((s) => (
                        <label
                          key={s.id}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                            rule.specialtyKeys.includes(s.id)
                              ? 'border-secondary bg-secondary/10 text-secondary'
                              : 'border-outline-variant text-on-surface-variant'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={rule.specialtyKeys.includes(s.id)}
                            onChange={() => toggleSpecialty(rule.id, s.id)}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
