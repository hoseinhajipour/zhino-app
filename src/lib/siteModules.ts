import type {
  AutoTranslateModuleSettings,
  FeatureModuleSettings,
  SiteModulesSettings,
  TranslateLanguageOption,
} from '../types';

export const TRANSLATE_LANGUAGE_CATALOG: TranslateLanguageOption[] = [
  { code: 'fa', label: 'فارسی', nativeLabel: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', nativeLabel: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', nativeLabel: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'ku', label: 'کوردی', nativeLabel: 'کوردی', dir: 'rtl', flag: '☀️' },
  { code: 'az', label: 'Azərbaycan', nativeLabel: 'Azərbaycan', dir: 'ltr', flag: '🇦🇿' },
  { code: 'de', label: 'Deutsch', nativeLabel: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', nativeLabel: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'ru', label: 'Русский', nativeLabel: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'es', label: 'Español', nativeLabel: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', nativeLabel: 'Italiano', dir: 'ltr', flag: '🇮🇹' },
  { code: 'zh-CN', label: '中文', nativeLabel: '中文', dir: 'ltr', flag: '🇨🇳' },
];

export const DEFAULT_AUTO_TRANSLATE: AutoTranslateModuleSettings = {
  enabled: false,
  sourceLanguage: 'fa',
  defaultLanguage: 'fa',
  languages: ['fa', 'en', 'ar'],
  showFlags: true,
};

/** Enabled by default so existing installs keep appointments until admin turns it off */
export const DEFAULT_APPOINTMENTS_MODULE: FeatureModuleSettings = {
  enabled: true,
};

/** Off by default — admin opts in from Modules tab */
export const DEFAULT_SEO_OPTIMIZER_MODULE: FeatureModuleSettings = {
  enabled: false,
};

/** Off by default — admin opts in from Modules tab */
export const DEFAULT_SHOP_MODULE: FeatureModuleSettings = {
  enabled: false,
};

export const DEFAULT_SITE_MODULES: SiteModulesSettings = {
  autoTranslate: DEFAULT_AUTO_TRANSLATE,
  appointments: DEFAULT_APPOINTMENTS_MODULE,
  seoOptimizer: DEFAULT_SEO_OPTIMIZER_MODULE,
  shop: DEFAULT_SHOP_MODULE,
};

export function getTranslateLanguage(code?: string): TranslateLanguageOption | undefined {
  if (!code) return undefined;
  return TRANSLATE_LANGUAGE_CATALOG.find((l) => l.code === code);
}

export function mergeAutoTranslate(
  partial?: Partial<AutoTranslateModuleSettings> | null
): AutoTranslateModuleSettings {
  const base = DEFAULT_AUTO_TRANSLATE;
  const languages = Array.isArray(partial?.languages) && partial!.languages!.length
    ? partial!.languages!.filter((c) => TRANSLATE_LANGUAGE_CATALOG.some((l) => l.code === c))
    : base.languages;
  const sourceLanguage =
    partial?.sourceLanguage && TRANSLATE_LANGUAGE_CATALOG.some((l) => l.code === partial.sourceLanguage)
      ? partial.sourceLanguage
      : base.sourceLanguage;
  let defaultLanguage =
    partial?.defaultLanguage && languages.includes(partial.defaultLanguage)
      ? partial.defaultLanguage
      : languages.includes(sourceLanguage)
        ? sourceLanguage
        : languages[0] || base.defaultLanguage;
  if (!languages.includes(defaultLanguage)) defaultLanguage = languages[0] || 'fa';
  return {
    enabled: partial?.enabled ?? base.enabled,
    sourceLanguage,
    defaultLanguage,
    languages: languages.includes(sourceLanguage) ? languages : [sourceLanguage, ...languages],
    showFlags: partial?.showFlags ?? base.showFlags,
  };
}

export function mergeFeatureModule(
  partial: Partial<FeatureModuleSettings> | null | undefined,
  fallback: FeatureModuleSettings
): FeatureModuleSettings {
  return {
    enabled: partial?.enabled ?? fallback.enabled,
  };
}

export function mergeSiteModules(partial?: Partial<SiteModulesSettings> | null): SiteModulesSettings {
  return {
    autoTranslate: mergeAutoTranslate(partial?.autoTranslate),
    appointments: mergeFeatureModule(partial?.appointments, DEFAULT_APPOINTMENTS_MODULE),
    seoOptimizer: mergeFeatureModule(partial?.seoOptimizer, DEFAULT_SEO_OPTIMIZER_MODULE),
    shop: mergeFeatureModule(partial?.shop, DEFAULT_SHOP_MODULE),
  };
}

export function isAppointmentsModuleEnabled(
  modules?: Partial<SiteModulesSettings> | null
): boolean {
  return mergeSiteModules(modules).appointments.enabled;
}

export function isSeoOptimizerModuleEnabled(
  modules?: Partial<SiteModulesSettings> | null
): boolean {
  return mergeSiteModules(modules).seoOptimizer.enabled;
}

export function isShopModuleEnabled(
  modules?: Partial<SiteModulesSettings> | null
): boolean {
  return mergeSiteModules(modules).shop.enabled;
}

const LANG_STORAGE_KEY = 'zhino_site_lang';
const SCRIPT_ID = 'zhino-google-translate-script';
const ELEMENT_ID = 'zhino-google-translate-element';

type GoogleTranslateWindow = Window & {
  googleTranslateElementInit?: () => void;
  google?: {
    translate: {
      TranslateElement: new (
        options: {
          pageLanguage: string;
          includedLanguages?: string;
          autoDisplay?: boolean;
          multilanguagePage?: boolean;
        },
        elementId: string
      ) => void;
    };
  };
};

function getWin(): GoogleTranslateWindow {
  return window as GoogleTranslateWindow;
}

export function getStoredSiteLanguage(fallback: string): string {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function setStoredSiteLanguage(code: string) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

function clearGoogTransCookies() {
  const host = window.location.hostname;
  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const paths = ['/', window.location.pathname];
  const domains = ['', host, `.${host}`];
  for (const path of paths) {
    for (const domain of domains) {
      const domainPart = domain ? `; domain=${domain}` : '';
      document.cookie = `googtrans=; ${expires}; path=${path}${domainPart}`;
      document.cookie = `googtrans=/; ${expires}; path=${path}${domainPart}`;
    }
  }
}

function setGoogTransCookie(source: string, target: string) {
  clearGoogTransCookies();
  if (!target || target === source) return;
  const value = `/${source}/${target}`;
  document.cookie = `googtrans=${value}; path=/`;
  const host = window.location.hostname;
  if (host && host !== 'localhost') {
    document.cookie = `googtrans=${value}; path=/; domain=.${host}`;
  }
}

function ensureTranslateElementHost() {
  let el = document.getElementById(ELEMENT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = ELEMENT_ID;
    el.className = 'zhino-gt-host';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function getTranslateCombo(): HTMLSelectElement | null {
  return document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
}

function waitFor(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitForCombo(timeoutMs = 8000): Promise<HTMLSelectElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const combo = getTranslateCombo();
    if (combo && combo.options.length > 1) return combo;
    await waitFor(80);
  }
  return getTranslateCombo();
}

let initPromise: Promise<void> | null = null;

export function ensureGoogleTranslateReady(sourceLanguage: string, languages: string[]): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const included = Array.from(new Set([sourceLanguage, ...languages])).join(',');
  const win = getWin();

  if (getTranslateCombo()) return Promise.resolve();

  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve, reject) => {
    ensureTranslateElementHost();

    const finishInit = () => {
      try {
        if (!win.google?.translate?.TranslateElement) {
          reject(new Error('Google Translate unavailable'));
          return;
        }
        // Re-init only if combo missing
        if (!getTranslateCombo()) {
          // eslint-disable-next-line no-new
          new win.google.translate.TranslateElement(
            {
              pageLanguage: sourceLanguage,
              includedLanguages: included,
              autoDisplay: false,
              multilanguagePage: true,
            },
            ELEMENT_ID
          );
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    win.googleTranslateElementInit = finishInit;

    if (document.getElementById(SCRIPT_ID)) {
      if (win.google?.translate?.TranslateElement) finishInit();
      else {
        // Script present but not ready yet — wait briefly
        const t0 = Date.now();
        const poll = () => {
          if (win.google?.translate?.TranslateElement) finishInit();
          else if (Date.now() - t0 > 8000) reject(new Error('Google Translate timeout'));
          else setTimeout(poll, 100);
        };
        poll();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => {
      initPromise = null;
      reject(new Error('Failed to load Google Translate'));
    };
    document.head.appendChild(script);
  }).catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

export function applyDocumentLocale(langCode: string) {
  const meta = getTranslateLanguage(langCode);
  const html = document.documentElement;
  html.lang = langCode === 'zh-CN' ? 'zh-CN' : langCode;
  html.dir = meta?.dir || (langCode === 'fa' || langCode === 'ar' || langCode === 'ku' ? 'rtl' : 'ltr');
}

async function setComboValue(target: string): Promise<boolean> {
  const combo = await waitForCombo();
  if (!combo) return false;
  const value = target || '';
  if (combo.value === value) {
    combo.dispatchEvent(new Event('change'));
    return true;
  }
  // Prefer exact option match
  const opt = Array.from(combo.options).find((o) => o.value === value);
  if (!opt && value) return false;
  combo.value = value;
  combo.dispatchEvent(new Event('change'));
  return true;
}

export type SwitchLanguageResult = 'ok' | 'reload' | 'error';

/**
 * Switch site language via free Google Website Translator (no API key).
 * Restoring the source language may trigger a soft reload for a clean DOM.
 */
export async function switchSiteLanguage(options: {
  sourceLanguage: string;
  targetLanguage: string;
  languages: string[];
  wasTranslated?: boolean;
}): Promise<SwitchLanguageResult> {
  const { sourceLanguage, targetLanguage, languages, wasTranslated } = options;
  if (!targetLanguage) return 'error';

  setStoredSiteLanguage(targetLanguage);
  applyDocumentLocale(targetLanguage);

  // Back to original language
  if (targetLanguage === sourceLanguage) {
    setGoogTransCookie(sourceLanguage, sourceLanguage);
    clearGoogTransCookies();
    const combo = getTranslateCombo();
    if (combo) {
      combo.value = '';
      combo.dispatchEvent(new Event('change'));
    }
    // Google often leaves translated text until reload
    if (wasTranslated || document.body.classList.contains('translated-ltr') || document.body.classList.contains('translated-rtl')) {
      await waitFor(120);
      window.location.reload();
      return 'reload';
    }
    return 'ok';
  }

  try {
    setGoogTransCookie(sourceLanguage, targetLanguage);
    await ensureGoogleTranslateReady(sourceLanguage, languages);
    const ok = await setComboValue(targetLanguage);
    if (!ok) {
      // Cookie is set — reload forces Google to apply translation
      window.location.reload();
      return 'reload';
    }
    // Give the widget a moment to rewrite the DOM
    await waitFor(700);
    applyDocumentLocale(targetLanguage);
    return 'ok';
  } catch {
    return 'error';
  }
}

export function getActiveTranslateLanguages(
  settings: AutoTranslateModuleSettings
): TranslateLanguageOption[] {
  return settings.languages
    .map((code) => getTranslateLanguage(code))
    .filter((l): l is TranslateLanguageOption => !!l);
}
