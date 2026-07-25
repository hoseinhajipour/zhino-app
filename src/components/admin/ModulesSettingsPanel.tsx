import React, { useEffect, useState } from 'react';
import type {
  AutoTranslateModuleSettings,
  FeatureModuleSettings,
  SiteModulesSettings,
} from '../../types';
import {
  DEFAULT_SITE_MODULES,
  TRANSLATE_LANGUAGE_CATALOG,
  mergeAutoTranslate,
  mergeFeatureModule,
  mergeSiteModules,
  DEFAULT_APPOINTMENTS_MODULE,
  DEFAULT_SEO_OPTIMIZER_MODULE,
} from '../../lib/siteModules';

interface ModulesSettingsPanelProps {
  value: SiteModulesSettings;
  onChange: (next: SiteModulesSettings) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
  saveMsg?: { type: 'success' | 'error'; msg: string } | null;
}

export const ModulesSettingsPanel: React.FC<ModulesSettingsPanelProps> = ({
  value,
  onChange,
  onSave,
  saving,
  saveMsg,
}) => {
  const [draft, setDraft] = useState<SiteModulesSettings>(() =>
    mergeSiteModules(value || DEFAULT_SITE_MODULES)
  );

  useEffect(() => {
    setDraft(mergeSiteModules(value || DEFAULT_SITE_MODULES));
  }, [value]);

  const auto = mergeAutoTranslate(draft.autoTranslate);
  const appointments = mergeFeatureModule(draft.appointments, DEFAULT_APPOINTMENTS_MODULE);
  const seoOptimizer = mergeFeatureModule(draft.seoOptimizer, DEFAULT_SEO_OPTIMIZER_MODULE);

  const patchAuto = (partial: Partial<AutoTranslateModuleSettings>) => {
    const next = mergeSiteModules({
      ...draft,
      autoTranslate: { ...auto, ...partial },
    });
    setDraft(next);
    onChange(next);
  };

  const patchAppointments = (partial: Partial<FeatureModuleSettings>) => {
    const next = mergeSiteModules({
      ...draft,
      appointments: { ...appointments, ...partial },
    });
    setDraft(next);
    onChange(next);
  };

  const patchSeoOptimizer = (partial: Partial<FeatureModuleSettings>) => {
    const next = mergeSiteModules({
      ...draft,
      seoOptimizer: { ...seoOptimizer, ...partial },
    });
    setDraft(next);
    onChange(next);
  };

  const toggleLanguage = (code: string) => {
    const source = auto.sourceLanguage;
    let languages = [...auto.languages];
    if (languages.includes(code)) {
      if (code === source) return; // source always stays
      languages = languages.filter((c) => c !== code);
    } else {
      languages = [...languages, code];
    }
    if (!languages.includes(source)) languages = [source, ...languages];
    const defaultLanguage = languages.includes(auto.defaultLanguage)
      ? auto.defaultLanguage
      : source;
    patchAuto({ languages, defaultLanguage });
  };

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
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">extension</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">ماژول‌های سایت</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                قابلیت‌های اختیاری — فقط برای مدیر سیستم
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'در حال ذخیره…' : 'ذخیره ماژول‌ها'}
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Module card: Appointments */}
          <section className="rounded-2xl border border-outline-variant/40 overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-4 bg-surface-container-low/60">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-on-surface">نوبت‌دهی آنلاین</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      هسته کلینیک
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    با فعال‌سازی، آیتم «نوبت‌ها» در سایدبار داشبورد برای ادمین، اپراتور و پزشک نمایش
                    داده می‌شود و رزرو آنلاین در فرانت (در صورت روشن بودن تنظیمات رزرو) در دسترس است.
                    با خاموش کردن ماژول، منوی نوبت‌ها و دکمه‌های رزرو سایت مخفی می‌شوند.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={appointments.enabled}
                  onChange={(e) => patchAppointments({ enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            <div
              className={`px-4 pb-4 text-[11px] leading-relaxed border-t border-outline-variant/30 pt-3 ${
                appointments.enabled ? 'text-on-surface-variant' : 'text-amber-800 bg-amber-50/50'
              }`}
            >
              {appointments.enabled ? (
                <p className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600 shrink-0">
                    check_circle
                  </span>
                  ماژول فعال است — پس از ذخیره، منوی «نوبت‌ها» و تنظیمات زرین‌پال/کاوه‌نگار در همان
                  بخش در دسترس خواهند بود. کنترل ریز «رزرو آنلاین روشن/خاموش» همچنان داخل تب نوبت‌هاست.
                </p>
              ) : (
                <p className="flex items-start gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm shrink-0">visibility_off</span>
                  ماژول خاموش است — منوی نوبت‌ها از سایدبار حذف و رزرو عمومی سایت غیرفعال می‌شود.
                </p>
              )}
            </div>
          </section>

          {/* Module card: Auto Translate */}
          <section className="rounded-2xl border border-outline-variant/40 overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-4 bg-surface-container-low/60">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">translate</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-on-surface">ترجمهٔ خودکار</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      رایگان · Google Translate
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    با فعال‌سازی، دکمهٔ زبان در هدر سایت نمایش داده می‌شود و کل متن‌های فرانت با
                    سرویس رایگان گوگل ترنسلیت ترجمه می‌شوند. تگ{' '}
                    <code className="text-[10px] bg-surface-container px-1 rounded" dir="ltr">
                      html lang
                    </code>{' '}
                    و جهت صفحه (RTL/LTR) هم هماهنگ می‌شود.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={auto.enabled}
                  onChange={(e) => patchAuto({ enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            <div
              className={`p-4 space-y-4 border-t border-outline-variant/30 transition-opacity ${
                auto.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    زبان اصلی محتوا (منبع)
                  </span>
                  <select
                    value={auto.sourceLanguage}
                    onChange={(e) => {
                      const sourceLanguage = e.target.value;
                      const languages = auto.languages.includes(sourceLanguage)
                        ? auto.languages
                        : [sourceLanguage, ...auto.languages];
                      patchAuto({
                        sourceLanguage,
                        languages,
                        defaultLanguage: languages.includes(auto.defaultLanguage)
                          ? auto.defaultLanguage
                          : sourceLanguage,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-white dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {TRANSLATE_LANGUAGE_CATALOG.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag ? `${l.flag} ` : ''}
                        {l.nativeLabel} ({l.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    زبان پیش‌فرض بازدیدکننده
                  </span>
                  <select
                    value={auto.defaultLanguage}
                    onChange={(e) => patchAuto({ defaultLanguage: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-white dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {auto.languages.map((code) => {
                      const l = TRANSLATE_LANGUAGE_CATALOG.find((x) => x.code === code);
                      return (
                        <option key={code} value={code}>
                          {l ? `${l.flag || ''} ${l.nativeLabel}` : code}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant mb-2">
                  زبان‌های قابل انتخاب در هدر
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {TRANSLATE_LANGUAGE_CATALOG.map((lang) => {
                    const checked = auto.languages.includes(lang.code);
                    const locked = lang.code === auto.sourceLanguage;
                    return (
                      <label
                        key={lang.code}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          checked
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant'
                        } ${locked ? 'ring-1 ring-primary/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant"
                          checked={checked}
                          disabled={locked}
                          onChange={() => toggleLanguage(lang.code)}
                        />
                        <span className="leading-none">{lang.flag}</span>
                        <span className="truncate">{lang.nativeLabel}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-on-surface-variant mt-2">
                  زبان منبع همیشه فعال می‌ماند تا بتوان به نسخهٔ اصلی برگشت.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={auto.showFlags !== false}
                  onChange={(e) => patchAuto({ showFlags: e.target.checked })}
                />
                نمایش پرچم کنار نام زبان در سوئیچر
              </label>

              <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800 p-3 text-[11px] text-sky-900 dark:text-sky-200 leading-relaxed space-y-1">
                <p className="font-black flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  نکات اجرا
                </p>
                <ul className="list-disc pr-4 space-y-0.5 text-sky-800/90 dark:text-sky-300/90">
                  <li>بدون API Key — از ویجت رایگان Google Website Translator استفاده می‌شود.</li>
                  <li>هنگام تغییر زبان، یک لودینگ کوتاه «در حال ترجمه» نمایش داده می‌شود.</li>
                  <li>بازگشت به زبان اصلی ممکن است صفحه را یک‌بار رفرش کند تا متن‌ها تمیز برگردند.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Module card: SEO Optimizer */}
          <section className="rounded-2xl border border-outline-variant/40 overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-4 bg-surface-container-low/60">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">troubleshoot</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-on-surface">بهینه‌ساز سئو</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      مشابه Rank Math
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    امتیاز سه‌رقمی (۰۰۰ تا ۱۰۰) برای مقالات و صفحات بر اساس کلمهٔ کلیدی کانونی، عنوان و
                    توضیحات متا، ساختار محتوا و تگ‌ها. در داشبورد ادمین روی کارت‌ها نمایش داده می‌شود و در
                    ویرایشگر مقاله/صفحه چک‌لیست زنده دارد.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={seoOptimizer.enabled}
                  onChange={(e) => patchSeoOptimizer({ enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            <div
              className={`px-4 pb-4 text-[11px] leading-relaxed border-t border-outline-variant/30 pt-3 ${
                seoOptimizer.enabled ? 'text-on-surface-variant' : 'text-amber-800 bg-amber-50/50'
              }`}
            >
              {seoOptimizer.enabled ? (
                <p className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600 shrink-0">
                    check_circle
                  </span>
                  ماژول فعال است — پس از ذخیره، امتیاز سئو در فهرست مقالات و صفحات و پنل تحلیل داخل
                  ویرایشگر در دسترس است.
                </p>
              ) : (
                <p className="flex items-start gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm shrink-0">visibility_off</span>
                  ماژول خاموش است — ابزار سئو در داشبورد و ویرایشگرها نمایش داده نمی‌شود.
                </p>
              )}
            </div>
          </section>

          <p className="text-[11px] text-on-surface-variant text-center">
            ماژول‌های بیشتر به‌مرور از همین بخش اضافه می‌شوند.
          </p>
        </div>
      </div>
    </div>
  );
};
