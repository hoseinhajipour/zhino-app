import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AutoTranslateModuleSettings, SiteModulesSettings } from '../types';
import {
  applyDocumentLocale,
  ensureGoogleTranslateReady,
  getActiveTranslateLanguages,
  getStoredSiteLanguage,
  mergeSiteModules,
  switchSiteLanguage,
} from '../lib/siteModules';

interface SiteTranslateContextValue {
  enabled: boolean;
  currentLang: string;
  sourceLang: string;
  translating: boolean;
  languages: ReturnType<typeof getActiveTranslateLanguages>;
  showFlags: boolean;
  setLanguage: (code: string) => Promise<void>;
}

const SiteTranslateContext = createContext<SiteTranslateContextValue | null>(null);

export function useSiteTranslate(): SiteTranslateContextValue {
  const ctx = useContext(SiteTranslateContext);
  if (!ctx) {
    return {
      enabled: false,
      currentLang: 'fa',
      sourceLang: 'fa',
      translating: false,
      languages: [],
      showFlags: true,
      setLanguage: async () => undefined,
    };
  }
  return ctx;
}

interface SiteTranslateProviderProps {
  modules?: SiteModulesSettings | null;
  /** Skip widget on admin surfaces */
  disabled?: boolean;
  children: React.ReactNode;
}

export const SiteTranslateProvider: React.FC<SiteTranslateProviderProps> = ({
  modules,
  disabled = false,
  children,
}) => {
  const merged = useMemo(() => mergeSiteModules(modules), [modules]);
  const auto: AutoTranslateModuleSettings = merged.autoTranslate;
  const enabled = !disabled && !!auto.enabled;
  const languages = useMemo(
    () => (enabled ? getActiveTranslateLanguages(auto) : []),
    [enabled, auto]
  );

  const [currentLang, setCurrentLang] = useState(() => {
    const fallback = auto.defaultLanguage || auto.sourceLanguage || 'fa';
    const stored = getStoredSiteLanguage(fallback);
    return auto.languages.includes(stored) ? stored : fallback;
  });
  const [translating, setTranslating] = useState(false);
  const translatedRef = useRef(false);
  const bootstrapped = useRef(false);

  // Keep lang in sync when admin changes available languages
  useEffect(() => {
    if (!enabled) {
      applyDocumentLocale(auto.sourceLanguage || 'fa');
      return;
    }
    if (!auto.languages.includes(currentLang)) {
      const next = auto.defaultLanguage || auto.sourceLanguage;
      setCurrentLang(next);
    }
  }, [enabled, auto.languages, auto.defaultLanguage, auto.sourceLanguage, currentLang]);

  const setLanguage = useCallback(
    async (code: string) => {
      if (!enabled || code === currentLang) return;
      setTranslating(true);
      try {
        const result = await switchSiteLanguage({
          sourceLanguage: auto.sourceLanguage,
          targetLanguage: code,
          languages: auto.languages,
          wasTranslated: translatedRef.current || code === auto.sourceLanguage,
        });
        if (result === 'reload') return;
        if (result === 'ok') {
          setCurrentLang(code);
          translatedRef.current = code !== auto.sourceLanguage;
        }
      } finally {
        setTranslating(false);
      }
    },
    [enabled, currentLang, auto.sourceLanguage, auto.languages]
  );

  // Bootstrap: apply stored non-source language once Google widget is ready
  useEffect(() => {
    if (!enabled || bootstrapped.current) return;
    bootstrapped.current = true;
    applyDocumentLocale(currentLang);

    if (currentLang === auto.sourceLanguage) return;

    let cancelled = false;
    (async () => {
      setTranslating(true);
      try {
        await ensureGoogleTranslateReady(auto.sourceLanguage, auto.languages);
        if (cancelled) return;
        const result = await switchSiteLanguage({
          sourceLanguage: auto.sourceLanguage,
          targetLanguage: currentLang,
          languages: auto.languages,
          wasTranslated: false,
        });
        if (result === 'ok') translatedRef.current = true;
      } catch {
        /* ignore — switcher still usable */
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once when enabled
  }, [enabled]);

  // Warm widget when module is on (faster first switch)
  useEffect(() => {
    if (!enabled) return;
    void ensureGoogleTranslateReady(auto.sourceLanguage, auto.languages).catch(() => undefined);
  }, [enabled, auto.sourceLanguage, auto.languages]);

  const value = useMemo<SiteTranslateContextValue>(
    () => ({
      enabled,
      currentLang,
      sourceLang: auto.sourceLanguage,
      translating,
      languages,
      showFlags: auto.showFlags !== false,
      setLanguage,
    }),
    [enabled, currentLang, auto.sourceLanguage, translating, languages, auto.showFlags, setLanguage]
  );

  return (
    <SiteTranslateContext.Provider value={value}>
      {children}
      {translating && (
        <div
          className="notranslate fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl px-6 py-5 flex flex-col items-center gap-3 min-w-[200px] border border-outline-variant/30">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-bold text-on-surface">در حال ترجمه…</p>
            <p className="text-[11px] text-on-surface-variant">Translating page</p>
          </div>
        </div>
      )}
    </SiteTranslateContext.Provider>
  );
};
