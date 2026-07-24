import React from 'react';
import type { SiteIdentitySettings } from '../types';

interface MaintenancePageProps {
  identity: SiteIdentitySettings;
  message?: string;
  onStaffLogin?: () => void;
}

const DEFAULT_MESSAGE =
  'سایت موقتاً در دست به‌روزرسانی و تعمیر است. از صبوری و همراهی شما صمیمانه سپاسگزاریم؛ به‌زودی با تجربه‌ای بهتر در خدمت شما خواهیم بود.';

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  identity,
  message,
  onStaffLogin,
}) => {
  const primary = identity.primaryColor || '#b5106a';
  const secondary = identity.secondaryColor || '#2c694e';
  const text = message?.trim() || DEFAULT_MESSAGE;

  return (
    <div
      className="notranslate min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, ${primary}22, transparent 55%),
          radial-gradient(ellipse 70% 50% at 90% 80%, ${secondary}28, transparent 50%),
          linear-gradient(165deg, #f7f4f1 0%, #eef2f0 45%, #f5eef2 100%)
        `,
      }}
    >
      {/* Soft pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div
          className="mx-auto mb-8 w-28 h-28 rounded-[2rem] bg-white/80 backdrop-blur-md shadow-xl border border-white/60 flex items-center justify-center p-4"
          style={{ boxShadow: `0 20px 50px ${primary}18` }}
        >
          {identity.logoUrl ? (
            <img
              src={identity.logoUrl}
              alt={identity.siteName || 'لوگو'}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="material-symbols-outlined text-5xl" style={{ color: primary }}>
              psychology
            </span>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 text-[11px] font-bold mb-5 shadow-sm"
          style={{ color: primary }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ backgroundColor: primary }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: primary }} />
          </span>
          در دست تعمیر
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-3">
          {identity.siteName || 'سایت'} به‌زودی بازمی‌گردد
        </h1>
        <p className="text-sm sm:text-[15px] leading-8 text-slate-600 max-w-md mx-auto font-medium">
          {text}
        </p>

        <div
          className="mt-8 mx-auto h-1 w-16 rounded-full opacity-80"
          style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
        />

        <p className="mt-6 text-[11px] text-slate-500 font-bold">
          از همراهی شما متشکریم
        </p>

        {onStaffLogin && (
          <button
            type="button"
            onClick={onStaffLogin}
            className="mt-8 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors underline-offset-4 hover:underline"
          >
            ورود کارکنان
          </button>
        )}
      </div>
    </div>
  );
};
