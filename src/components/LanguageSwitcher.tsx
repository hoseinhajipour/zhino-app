import React, { useEffect, useRef, useState } from 'react';
import { useSiteTranslate } from './SiteTranslateProvider';

interface LanguageSwitcherProps {
  /** Compact pill for header; full row for mobile drawer */
  variant?: 'header' | 'mobile';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { enabled, currentLang, languages, showFlags, translating, setLanguage } = useSiteTranslate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!enabled || languages.length < 2) return null;

  const current = languages.find((l) => l.code === currentLang) || languages[0];

  if (variant === 'mobile') {
    return (
      <div className="notranslate space-y-2" translate="no">
        <p className="text-[11px] font-bold text-on-surface-variant px-1">زبان / Language</p>
        <div className="grid grid-cols-2 gap-1.5">
          {languages.map((lang) => {
            const active = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                disabled={translating}
                onClick={() => void setLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  active
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface hover:border-primary/40'
                } disabled:opacity-60`}
              >
                {showFlags && lang.flag && <span className="text-sm leading-none">{lang.flag}</span>}
                <span className="truncate">{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="notranslate relative" ref={rootRef} translate="no">
      <button
        type="button"
        disabled={translating}
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30 transition-all active:scale-95 text-xs font-bold disabled:opacity-60"
        title="تغییر زبان / Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-base text-primary">translate</span>
        {showFlags && current?.flag && <span className="text-sm leading-none">{current.flag}</span>}
        <span className="uppercase tracking-wide">{current?.code === 'zh-CN' ? 'ZH' : current?.code}</span>
        <span className="material-symbols-outlined text-sm opacity-60">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Mobile: icon-only */}
      <button
        type="button"
        disabled={translating}
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden flex p-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30 transition-all active:scale-95 disabled:opacity-60"
        title="Language"
      >
        <span className="material-symbols-outlined text-xl text-primary">translate</span>
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 end-0 z-[70] min-w-[160px] rounded-2xl border border-outline-variant/40 bg-white dark:bg-slate-900 shadow-xl py-1.5 overflow-hidden"
          role="listbox"
        >
          {languages.map((lang) => {
            const active = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={active}
                disabled={translating}
                onClick={() => {
                  setOpen(false);
                  void setLanguage(lang.code);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-right transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                } disabled:opacity-60`}
              >
                {showFlags && lang.flag && <span className="text-base leading-none">{lang.flag}</span>}
                <span className="flex-1">{lang.nativeLabel}</span>
                {active && (
                  <span className="material-symbols-outlined text-sm text-primary">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
