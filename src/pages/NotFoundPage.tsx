import React from 'react';
import type { PageScreen } from '../types';

interface NotFoundPageProps {
  onNavigate: (screen: PageScreen) => void;
  /** Optional short explanation for context (e.g. custom page missing) */
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  message = 'آدرسی که وارد کرده‌اید وجود ندارد یا منتقل شده است. می‌توانید به صفحه اصلی برگردید یا از منوی سایت مسیر درست را پیدا کنید.',
}) => {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-4 py-16 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-36 -left-16 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl text-center">
        <p
          className="font-black leading-none select-none mb-4"
          style={{
            fontSize: 'clamp(5.5rem, 18vw, 8.5rem)',
            background: 'linear-gradient(135deg, var(--color-primary, #b5106a) 0%, var(--color-secondary, #2c694e) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            opacity: 0.9,
          }}
          aria-hidden
        >
          ۴۰۴
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary mb-5">
          <span className="material-symbols-outlined text-sm">search_off</span>
          صفحه پیدا نشد
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mb-3">
          این مسیر در سایت وجود ندارد
        </h1>
        <p className="text-sm sm:text-[15px] leading-8 text-on-surface-variant max-w-md mx-auto font-medium">
          {message}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/25 hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-base">home</span>
            بازگشت به خانه
          </button>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs font-bold hover:border-primary/40 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-base">call</span>
            تماس با ما
          </button>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs font-bold hover:border-primary/40 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-base">medical_services</span>
            خدمات کلینیک
          </button>
        </div>
      </div>
    </div>
  );
};
