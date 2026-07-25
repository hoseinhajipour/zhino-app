import React, { useState } from 'react';
import { UserProfile } from '../types';
import { loginUser, registerUser } from '../lib/dbService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  /** From clinic settings — shows demo quick-login when true */
  developmentMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  developmentMode = false,
}) => {
  if (!isOpen) return null;

  const [authCategory, setAuthCategory] = useState<'patient' | 'staff'>('patient');
  const [patientMode, setPatientMode] = useState<'login' | 'register'>('login');

  // Patient Login / Register State
  const [patientMobile, setPatientMobile] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientNationalId, setPatientNationalId] = useState('');

  // Staff State
  const [staffRole, setStaffRole] = useState<'admin' | 'doctor' | 'operator'>('doctor');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // UI status
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const finishLogin = (user: UserProfile) => {
    onLoginSuccess(user);
    onClose();
  };

  const handleDemoPatientLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const user = await loginUser({ mobile: '09121112233', password: 'zhino1403', role: 'patient' });
      finishLogin(user);
    } catch {
      setErrorMsg('ورود دموی مراجع ناموفق بود. سرور را بررسی کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoDoctorLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const user = await loginUser({ username: 'doctor', password: 'zhino1403', role: 'doctor' });
      finishLogin(user);
    } catch {
      setErrorMsg('ورود دموی پزشک ناموفق بود.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoOperatorLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const user = await loginUser({ username: 'operator', password: 'zhino1403', role: 'operator' });
      finishLogin(user);
    } catch {
      setErrorMsg('ورود دموی اپراتور ناموفق بود.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (patientMode === 'login') {
      if (!patientMobile.trim() || !patientPassword.trim()) {
        setErrorMsg('لطفاً موبایل و رمز عبور را وارد کنید.');
        return;
      }
      setIsLoading(true);
      try {
        const user = await loginUser({
          mobile: patientMobile.trim(),
          password: patientPassword,
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

    if (!patientName.trim() || !patientMobile.trim() || !patientPassword.trim()) {
      setErrorMsg('لطفاً نام، موبایل و رمز عبور را وارد کنید.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await registerUser({
        name: patientName.trim(),
        mobile: patientMobile.trim(),
        password: patientPassword,
        nationalId: patientNationalId.trim() || undefined,
      });
      finishLogin(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ثبت‌نام ناموفق بود');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!staffUsername.trim() || !staffPassword.trim()) {
      setErrorMsg('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser({
        username: staffUsername.trim(),
        password: staffPassword,
        role: staffRole,
      });
      finishLogin(user);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : developmentMode
            ? 'نام کاربری یا رمز عبور اشتباه است. (رمز پیش‌فرض: zhino1403)'
            : 'نام کاربری یا رمز عبور اشتباه است.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface-dim w-full max-w-lg rounded-[32px] shadow-2xl p-6 sm:p-8 text-right space-y-6 border border-outline-variant/30 relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-l from-primary via-secondary to-tertiary"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">account_circle</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-on-surface">ورود / عضویت در سامانه</h2>
              <p className="text-xs text-on-surface-variant">کلینیک روانشناسی و مشاوره ژینو</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Top Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthCategory('patient');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authCategory === 'patient'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>مراجعه‌کنندگان (کاربر عادی)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthCategory('staff');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authCategory === 'staff'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">medical_services</span>
            <span>کادر درمان (پزشک و اپراتور)</span>
          </button>
        </div>

        {/* Quick Demo Login Bar (Dev Mode Only) */}
        {developmentMode && (
          <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 text-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <span className="material-symbols-outlined text-base">flash_on</span>
                <span>ورود سریع آزمایشی (فقط حالت توسعه):</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                محیط Dev
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDemoPatientLogin}
                className="px-2.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl text-[11px] hover:bg-emerald-100 transition-all border border-emerald-200 text-center flex items-center justify-center gap-1"
              >
                <span>👤 مراجعه‌کننده</span>
              </button>
              <button
                type="button"
                onClick={handleDemoDoctorLogin}
                className="px-2.5 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold rounded-xl text-[11px] hover:bg-blue-100 transition-all border border-blue-200 text-center flex items-center justify-center gap-1"
              >
                <span>🩺 پزشک / درمانگر</span>
              </button>
              <button
                type="button"
                onClick={handleDemoOperatorLogin}
                className="px-2.5 py-2 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 font-bold rounded-xl text-[11px] hover:bg-purple-100 transition-all border border-purple-200 text-center flex items-center justify-center gap-1"
              >
                <span>💻 اپراتور / پذیرش</span>
              </button>
            </div>
          </div>
        )}

        {/* ERROR MSG */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM CATEGORY 1: PATIENT (CLIENT) */}
        {authCategory === 'patient' && (
          <div className="space-y-4">
            {/* Sub-toggle: Login vs Register */}
            <div className="flex justify-center gap-6 border-b border-outline-variant/20 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPatientMode('login')}
                className={`pb-2 transition-all relative ${
                  patientMode === 'login'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                ورود مراجعه‌کننده
              </button>
              <button
                type="button"
                onClick={() => setPatientMode('register')}
                className={`pb-2 transition-all relative ${
                  patientMode === 'register'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                ثبت‌نام جدید
              </button>
            </div>

            <form onSubmit={handlePatientSubmit} className="space-y-3">
              {patientMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="مثال: علیرضا رضایی"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  شماره همراه (موبایل) *
                </label>
                <input
                  type="tel"
                  required
                  value={patientMobile}
                  onChange={(e) => setPatientMobile(e.target.value)}
                  placeholder="09121112233"
                  dir="ltr"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {patientMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    کد ملی (جهت تشکیل پرونده)
                  </label>
                  <input
                    type="text"
                    value={patientNationalId}
                    onChange={(e) => setPatientNationalId(e.target.value)}
                    placeholder="0012345678"
                    dir="ltr"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  رمز عبور
                </label>
                <input
                  type="password"
                  value={patientPassword}
                  onChange={(e) => setPatientPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>در حال بررسی...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>{patientMode === 'login' ? 'ورود به پنل کاربری' : 'ثبت‌نام و ایجاد حساب'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* FORM CATEGORY 2: STAFF (DOCTOR / OPERATOR) */}
        {authCategory === 'staff' && (
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                انتخاب نقش پرسنل:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStaffRole('admin')}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    staffRole === 'admin'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  <span>مدیر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStaffRole('doctor')}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    staffRole === 'doctor'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">stethoscope</span>
                  <span>پزشک</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStaffRole('operator')}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    staffRole === 'operator'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">support_agent</span>
                  <span>اپراتور</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                نام کاربری پرسنل *
              </label>
              <input
                type="text"
                required
                value={staffUsername}
                onChange={(e) => setStaffUsername(e.target.value)}
                placeholder="مثال: admin یا نام کاربری پزشک"
                dir="ltr"
                className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                کلمه عبور *
              </label>
              <input
                type="password"
                required
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder={developmentMode ? '•••••••• (اطلاعات پیش‌فرض: zhino1403)' : '••••••••'}
                dir="ltr"
                className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>در حال تأیید اعتبار...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  <span>ورود به پنل ({staffRole === 'admin' ? 'مدیر' : staffRole === 'doctor' ? 'پزشک' : 'اپراتور'})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
