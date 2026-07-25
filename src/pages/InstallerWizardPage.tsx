import React, { useEffect, useMemo, useState } from 'react';
import { MediaField } from '../components/media/MediaField';
import {
  completeInstall,
  fetchInstallStatus,
  installAdmin,
  installDatabase,
  installSite,
} from '../lib/installApi';
import { THEME_PRESETS } from '../lib/themePresets';
import { applySiteTheme } from '../lib/siteChromeDefaults';
import { DEFAULT_SITE_CHROME } from '../lib/siteChromeDefaults';

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

type StepId = 1 | 2 | 3;

interface InstallerWizardPageProps {
  onComplete: () => void;
}

export const InstallerWizardPage: React.FC<InstallerWizardPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState<StepId>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Resume mid-wizard after refresh (DB done, site/admin still pending)
  useEffect(() => {
    let cancelled = false;
    fetchInstallStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.resumeStep === 2 || status.resumeStep === 3) {
          setStep(status.resumeStep as StepId);
        }
      })
      .catch(() => {
        /* stay on step 1 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 1
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('zhino_app');

  // Step 2
  const [siteName, setSiteName] = useState('کلینیک روانشناسی ژینو');
  const [tagline, setTagline] = useState(DEFAULT_SITE_CHROME.identity.tagline);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('/favicon.ico');
  const [presetId, setPresetId] = useState(THEME_PRESETS[0].id);
  const [primaryColor, setPrimaryColor] = useState(THEME_PRESETS[0].primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(THEME_PRESETS[0].secondaryColor);

  // Step 3
  const [adminName, setAdminName] = useState('مدیر سایت');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPassword2, setAdminPassword2] = useState('');

  const steps = useMemo(
    () => [
      { id: 1 as const, label: 'دیتابیس', icon: 'database' },
      { id: 2 as const, label: 'هویت سایت', icon: 'palette' },
      { id: 3 as const, label: 'ادمین', icon: 'admin_panel_settings' },
    ],
    []
  );

  const selectPreset = (id: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    applySiteTheme({
      ...DEFAULT_SITE_CHROME.identity,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      siteName,
    });
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setBusy(false);
    }
  };

  const submitDb = () =>
    run(async () => {
      const result = await installDatabase({
        host: host.trim() || '127.0.0.1',
        port: Number(port) || 3306,
        user: user.trim() || 'root',
        password,
        database: database.trim() || 'zhino_app',
      });
      // Only skip site/admin when repairing an already-completed install.
      if (result.alreadyInstalled) {
        onComplete();
        return;
      }
      setStep(2);
    });

  const submitSite = () =>
    run(async () => {
      if (!siteName.trim()) throw new Error('عنوان سایت الزامی است');
      await installSite({
        siteName: siteName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        faviconUrl: faviconUrl.trim() || '/favicon.ico',
        primaryColor,
        secondaryColor,
      });
      applySiteTheme({
        ...DEFAULT_SITE_CHROME.identity,
        siteName: siteName.trim(),
        primaryColor,
        secondaryColor,
        logoUrl: logoUrl.trim(),
        faviconUrl: faviconUrl.trim() || '/favicon.ico',
      });
      setStep(3);
    });

  const submitAdmin = () =>
    run(async () => {
      if (adminPassword.length < 6) throw new Error('رمز عبور حداقل ۶ کاراکتر باشد');
      if (adminPassword !== adminPassword2) throw new Error('تکرار رمز عبور یکسان نیست');
      await installAdmin({
        name: adminName.trim(),
        username: adminUsername.trim(),
        password: adminPassword,
      });
      await completeInstall();
      onComplete();
    });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fdf2f8_0%,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-900 font-vazir antialiased">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
            <span className="material-symbols-outlined text-3xl">rocket_launch</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">راه‌اندازی اولیه سایت</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            دیتابیس، هویت برند و حساب مدیر را در چند مرحله کوتاه پیکربندی کنید.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, idx) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <React.Fragment key={s.id}>
                {idx > 0 && (
                  <div className={`h-0.5 w-8 sm:w-12 rounded ${done ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : done
                        ? 'bg-primary/10 text-primary'
                        : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {done ? 'check' : s.icon}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 md:p-8 space-y-5">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold px-4 py-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-black">اتصال دیتابیس MySQL</h2>
                <p className="text-xs text-slate-500">اطلاعات دیتابیس هاست خود را وارد کنید.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500">هاست</span>
                  <input className={fieldClass} value={host} onChange={(e) => setHost(e.target.value)} dir="ltr" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">پورت</span>
                  <input className={fieldClass} value={port} onChange={(e) => setPort(e.target.value)} dir="ltr" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">نام دیتابیس</span>
                  <input
                    className={fieldClass}
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    dir="ltr"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">نام کاربری</span>
                  <input className={fieldClass} value={user} onChange={(e) => setUser(e.target.value)} dir="ltr" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">رمز عبور</span>
                  <input
                    type="password"
                    className={fieldClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={submitDb}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-extrabold text-sm shadow-lg shadow-primary/20 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    در حال اتصال...
                  </>
                ) : (
                  <>
                    تست و ادامه
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-black">هویت و ظاهر سایت</h2>
                <p className="text-xs text-slate-500">عنوان، لوگو و پالت رنگی برند را تنظیم کنید.</p>
              </div>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-slate-500">عنوان سایت</span>
                <input className={fieldClass} value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-slate-500">شعار / تگ‌لاین</span>
                <input className={fieldClass} value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MediaField label="لوگو" value={logoUrl} onChange={setLogoUrl} accept="image" aspect="square" />
                <MediaField
                  label="آیکون (Favicon)"
                  value={faviconUrl}
                  onChange={setFaviconUrl}
                  accept="image"
                  aspect="square"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-500">پالت رنگی پیشنهادی</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const selected = presetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectPreset(preset.id)}
                        className={`text-right p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                          selected
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="flex gap-1 shrink-0">
                          <span
                            className="w-8 h-8 rounded-lg shadow-inner"
                            style={{ background: preset.primaryColor }}
                          />
                          <span
                            className="w-8 h-8 rounded-lg shadow-inner"
                            style={{ background: preset.secondaryColor }}
                          />
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">رنگ اصلی</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setPresetId('custom');
                      }}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      className={fieldClass}
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setPresetId('custom');
                      }}
                      dir="ltr"
                    />
                  </div>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">رنگ ثانویه</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        setPresetId('custom');
                      }}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      className={fieldClass}
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        setPresetId('custom');
                      }}
                      dir="ltr"
                    />
                  </div>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submitSite}
                  className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-extrabold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {busy ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-black">حساب مدیر سیستم</h2>
                <p className="text-xs text-slate-500">با این حساب وارد داشبورد ادمین می‌شوید.</p>
              </div>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-slate-500">نام نمایشی</span>
                <input className={fieldClass} value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-slate-500">نام کاربری</span>
                <input
                  className={fieldClass}
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  dir="ltr"
                  autoComplete="username"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">رمز عبور</span>
                  <input
                    type="password"
                    className={fieldClass}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">تکرار رمز عبور</span>
                  <input
                    type="password"
                    className={fieldClass}
                    value={adminPassword2}
                    onChange={(e) => setAdminPassword2(e.target.value)}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submitAdmin}
                  className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-extrabold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      در حال تکمیل...
                    </>
                  ) : (
                    <>
                      تکمیل نصب
                      <span className="material-symbols-outlined text-lg">verified</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          پس از اتمام نصب، فایل <code className="font-mono">.installed</code> ایجاد می‌شود و این ویزارد قفل می‌گردد.
        </p>
      </div>
    </div>
  );
};
