import React, { useState } from 'react';
import { loginUser } from '../lib/dbService';
import type { UserProfile } from '../types';

interface AdminLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onGoHome: () => void;
  /** From clinic settings — shows demo admin credentials when true */
  developmentMode?: boolean;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onGoHome,
  developmentMode = false,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('لطفاً نام کاربری و کلمه عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser({
        username: username.trim(),
        password,
        role: 'admin',
      });
      sessionStorage.setItem('zhino_admin_logged_in', 'true');
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : developmentMode
            ? 'نام کاربری یا کلمه عبور نادرست است. (اطلاعات پیش‌فرض: admin / zhino1403)'
            : 'نام کاربری یا کلمه عبور نادرست است.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          <span>بازگشت به سایت</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary shadow-sm">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">
            ورود به پنل مدیریت کلینیک
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            ورود مدیر سیستم — پس از ورود به داشبورد کامل دسترسی دارید
          </p>
        </div>

        {developmentMode && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 mb-6 text-xs text-on-surface-variant flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
            <div className="space-y-0.5">
              <p className="font-bold text-primary">ورود مدیر (نقش admin):</p>
              <p>
                نام کاربری: <span className="font-mono text-on-surface">admin</span> — رمز:{' '}
                <span className="font-mono text-on-surface">zhino1403</span>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold mb-1.5">نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm"
              placeholder={developmentMode ? 'admin' : 'نام کاربری'}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">رمز عبور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm pl-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-primary text-white font-black text-sm disabled:opacity-60"
          >
            {isLoading ? 'در حال ورود...' : 'ورود به پنل'}
          </button>
        </form>
      </div>
    </div>
  );
};
