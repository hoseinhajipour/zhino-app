import React, { useEffect, useState } from 'react';
import { loginUser, registerUser } from '../lib/dbService';
import type { UserProfile } from '../types';

export type LoginMode = 'login' | 'register';

interface LoginPageProps {
  initialMode?: LoginMode;
  onLoginSuccess: (user: UserProfile) => void;
  onGoHome: () => void;
  onGoAdmin?: () => void;
  onModeChange?: (mode: LoginMode) => void;
  /** From clinic settings — shows demo quick-login when true */
  developmentMode?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onGoHome,
  onGoAdmin,
  onModeChange,
  developmentMode = false,
}) => {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setErrorMsg('');
    onModeChange?.(next);
  };

  const finishLogin = (user: UserProfile) => {
    onLoginSuccess(user);
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const user = await loginUser({
        mobile: '09121112233',
        password: 'zhino1403',
        role: 'patient',
      });
      finishLogin(user);
    } catch {
      setErrorMsg('ورود دمو ناموفق بود. سرور را بررسی کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!mobile.trim() || !password.trim()) {
        setErrorMsg('لطفاً موبایل و رمز عبور را وارد کنید.');
        return;
      }
      setIsLoading(true);
      try {
        const user = await loginUser({
          mobile: mobile.trim(),
          password,
          role: 'patient',
        });
        finishLogin(user);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'ورود ناموفق بود');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!name.trim() || !mobile.trim() || !password.trim()) {
      setErrorMsg('لطفاً نام، موبایل و رمز عبور را وارد کنید.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerUser({
        name: name.trim(),
        mobile: mobile.trim(),
        password,
        nationalId: nationalId.trim() || undefined,
      });
      finishLogin(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ثبت‌نام ناموفق بود');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-primary via-secondary to-tertiary" />

        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          <span>بازگشت به سایت</span>
        </button>

        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary shadow-sm">
            <span className="material-symbols-outlined text-3xl">account_circle</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">
            ورود / عضویت
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            برای پیگیری نوبت‌ها و پرونده شخصی وارد حساب شوید یا عضویت جدید بسازید
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1.5 mb-6 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-xs font-bold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>ورود</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>عضویت</span>
          </button>
        </div>

        {developmentMode && (
          <div className="mb-5 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <span className="material-symbols-outlined text-base">flash_on</span>
                <span>ورود سریع آزمایشی</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                Dev
              </span>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-60"
            >
              ورود با حساب دموی مراجعه‌کننده
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-right">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                نام و نام خانوادگی *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: علیرضا رضایی"
                autoComplete="name"
                className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              شماره همراه (موبایل) *
            </label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder={developmentMode ? '09121112233' : '09xxxxxxxxx'}
              dir="ltr"
              autoComplete="tel"
              className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm outline-none text-left focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                کد ملی (اختیاری)
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="0012345678"
                dir="ltr"
                className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm outline-none text-left focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">رمز عبور *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'حداقل ۶ کاراکتر' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm outline-none pl-11 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-3.5 rounded-2xl bg-primary hover:bg-primary-container text-white font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>لطفاً صبر کنید...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">
                  {mode === 'login' ? 'login' : 'person_add'}
                </span>
                <span>{mode === 'login' ? 'ورود به پنل کاربری' : 'ثبت‌نام و ایجاد حساب'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-outline-variant/20 text-center space-y-2">
          <p className="text-[11px] text-on-surface-variant">
            {mode === 'login' ? 'حساب ندارید؟' : 'قبلاً عضو شده‌اید؟'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-primary hover:underline"
            >
              {mode === 'login' ? 'عضویت رایگان' : 'ورود به حساب'}
            </button>
          </p>
          <p className="text-[11px] text-on-surface-variant">
            کادر درمان و مدیریت؟{' '}
            {onGoAdmin ? (
              <button
                type="button"
                onClick={onGoAdmin}
                className="font-bold text-primary hover:underline"
              >
                ورود به پنل مدیریت
              </button>
            ) : (
              <a href="/admin" className="font-bold text-primary hover:underline">
                ورود به پنل مدیریت
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
