import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AiProviderId, AiSettings } from '../../types';
import {
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_SETTINGS,
  applyAiProviderPreset,
  mergeAiSettings,
} from '../../lib/aiSettingsDefaults';

interface AiSettingsPanelProps {
  value: AiSettings;
  onChange: (next: AiSettings) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
  saveMsg?: { type: 'success' | 'error'; msg: string } | null;
}

const fieldCls =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30';

export const AiSettingsPanel: React.FC<AiSettingsPanelProps> = ({
  value,
  onChange,
  onSave,
  saving,
  saveMsg,
}) => {
  const [draft, setDraft] = useState<AiSettings>(() => mergeAiSettings(value || DEFAULT_AI_SETTINGS));
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (dirtyRef.current) return;
    setDraft(mergeAiSettings(value || DEFAULT_AI_SETTINGS));
  }, [value]);

  const preset = AI_PROVIDER_PRESETS[draft.provider];

  const patch = (partial: Partial<AiSettings>) => {
    dirtyRef.current = true;
    const next = mergeAiSettings({ ...draft, ...partial });
    setDraft(next);
    onChange(next);
  };

  const selectProvider = (provider: AiProviderId) => {
    dirtyRef.current = true;
    const next = applyAiProviderPreset(draft, provider);
    setDraft(next);
    onChange(next);
  };

  const cursorSample = useMemo(
    () =>
      JSON.stringify(
        {
          openaiApiBaseUrl: draft.baseUrl || preset.baseUrl,
          openaiApiKey: draft.apiKey || 'YOUR_API_KEY',
          // Optional override model name used by OpenAI-compatible tools
          openaiDefaultModel: draft.defaultModel || preset.defaultModel,
        },
        null,
        2
      ),
    [draft.apiKey, draft.baseUrl, draft.defaultModel, preset.baseUrl, preset.defaultModel]
  );

  const copySample = async () => {
    await navigator.clipboard.writeText(cursorSample);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface">اتصال هوش مصنوعی</h2>
            <p className="mt-1 max-w-2xl text-[11px] font-medium leading-6 text-on-surface-variant">
              ارائه‌دهنده OpenAI-compatible مثل GapGPT را برای پروژه تنظیم و ذخیره کنید. این مقادیر
              برای ابزارهای AI، اتوماسیون و اتصال Cursor قابل استفاده هستند.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black ${
            draft.enabled
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {draft.enabled ? 'check_circle' : 'pause_circle'}
          </span>
          {draft.enabled ? 'فعال' : 'غیرفعال'}
        </span>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => patch({ enabled: !draft.enabled })}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-right transition-all ${
              draft.enabled
                ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                : 'border-outline-variant/40 bg-surface-container-low/40 hover:border-outline-variant'
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-black text-on-surface">فعال‌سازی اتصال AI</p>
              <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                وقتی خاموش باشد، کلید و آدرس ذخیره می‌مانند ولی نباید برای فراخوانی واقعی استفاده شوند.
              </p>
            </div>
            <span
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                draft.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              dir="ltr"
              aria-hidden
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  draft.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </button>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-on-surface-variant">ارائه‌دهنده</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(AI_PROVIDER_PRESETS) as AiProviderId[]).map((id) => {
                const item = AI_PROVIDER_PRESETS[id];
                const active = draft.provider === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectProvider(id)}
                    className={`rounded-2xl border px-3 py-3 text-right transition-all ${
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-outline-variant/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <p className="text-xs font-black text-on-surface">{item.label}</p>
                    <p className="mt-1 truncate text-[10px] text-on-surface-variant" dir="ltr">
                      {item.baseUrl || 'custom base URL'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant">کلید API</span>
            <div className="relative">
              <input
                dir="ltr"
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(e) => patch({ apiKey: e.target.value })}
                placeholder="sk-... یا کلید GapGPT"
                className={`${fieldCls} pe-12 text-left`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-on-surface-variant hover:bg-white/70 dark:hover:bg-slate-800"
                title={showKey ? 'مخفی کردن' : 'نمایش'}
              >
                <span className="material-symbols-outlined text-base">
                  {showKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant">آدرس Base URL</span>
            <input
              dir="ltr"
              value={draft.baseUrl}
              onChange={(e) => patch({ baseUrl: e.target.value })}
              placeholder="https://api.gapgpt.app/v1"
              className={`${fieldCls} text-left`}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant">مدل پیش‌فرض</span>
            <input
              dir="ltr"
              value={draft.defaultModel}
              onChange={(e) => patch({ defaultModel: e.target.value })}
              placeholder="gpt-4o"
              className={`${fieldCls} text-left`}
            />
            <span className="block text-[10px] leading-5 text-on-surface-variant">
              برای GapGPT می‌توانید مدل‌هایی مثل <span dir="ltr">gpt-4o</span>،{' '}
              <span dir="ltr">gemini-2.5-pro</span> یا سایر مدل‌های پنل را بگذارید.
            </span>
          </label>

          {preset.docsUrl && (
            <a
              href={preset.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              مستندات {preset.label}
            </a>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">save</span>
              {saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات AI'}
            </button>
            {saveMsg && (
              <span
                className={`text-[11px] font-bold ${
                  saveMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {saveMsg.msg}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-on-surface">نمونه اتصال Cursor / کلاینت OpenAI</h3>
              <p className="mt-1 text-[10px] text-on-surface-variant">
                این مقادیر را می‌توانید در تنظیمات مدل‌های سازگار با OpenAI در Cursor قرار دهید.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copySample()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 px-3 py-2 text-[11px] font-bold hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'کپی شد' : 'کپی'}
            </button>
          </div>
          <pre
            dir="ltr"
            className="max-h-[360px] overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-[11px] leading-6 text-violet-100"
          >
            <code>{cursorSample}</code>
          </pre>
          <div className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 text-[11px] leading-relaxed text-on-surface-variant dark:border-violet-900/40 dark:bg-violet-950/20">
            <p className="font-black text-on-surface">راهنمای سریع GapGPT</p>
            <ol className="mt-2 list-decimal space-y-1 pr-4">
              <li>در پنل GapGPT یک API Key بسازید.</li>
              <li>ارائه‌دهنده را روی GapGPT بگذارید و کلید را وارد کنید.</li>
              <li>ذخیره کنید؛ سپس در Cursor از Base URL و کلید بالا استفاده کنید.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};
