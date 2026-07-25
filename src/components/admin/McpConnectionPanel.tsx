import React, { useState } from 'react';

function defaultApiBase(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:3001';
  const url = new URL(window.location.origin);
  if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.port === '3000') {
    url.port = '3001';
  }
  return url.origin;
}

export const McpConnectionPanel: React.FC = () => {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [projectPath, setProjectPath] = useState('D:/path/to/zhino-app');
  const [apiToken, setApiToken] = useState('YOUR_ZHINO_API_TOKEN');
  const [copied, setCopied] = useState(false);

  const config = JSON.stringify(
    {
      mcpServers: {
        zhino: {
          command: 'npm',
          args: ['run', 'zhino-mcp'],
          cwd: projectPath,
          env: {
            ZHINO_API_BASE: apiBase,
            ZHINO_API_TOKEN: apiToken,
          },
        },
      },
    },
    null,
    2
  );

  const copyConfig = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadConfig = () => {
    const blob = new Blob([`${config}\n`], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'mcp.json';
    anchor.click();
    URL.revokeObjectURL(href);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6 md:py-5 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface md:text-base">اتصال MCP به Cursor</h2>
            <p className="mt-1 max-w-2xl text-[11px] font-medium leading-6 text-on-surface-variant">
              با این اتصال، Cursor می‌تواند صفحات، بلوک‌ها، تنظیمات، پزشکان، FAQ، فرم‌ها و رسانه‌های
              ژینو را از طریق ابزارهای MCP مدیریت کند.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          dir="ltr"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          zhino MCP 1.0
        </span>
      </div>

      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-black text-on-surface">اطلاعات اتصال</h3>
            <p className="mt-1 text-[11px] leading-5 text-on-surface-variant">
              پروژه باید روی رایانه‌ای که Cursor اجرا می‌شود موجود باشد و وابستگی‌های آن با{' '}
              <code dir="ltr">npm install</code> نصب شده باشند.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-surface-container-low/40 p-4 dark:border-slate-800">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant">آدرس API ژینو</span>
              <input
                dir="ltr"
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-3 py-2.5 text-left text-xs outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-950"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant">مسیر پروژه روی رایانه</span>
              <input
                dir="ltr"
                value={projectPath}
                onChange={(event) => setProjectPath(event.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-3 py-2.5 text-left text-xs outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-950"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant">توکن دسترسی API</span>
              <input
                dir="ltr"
                value={apiToken}
                onChange={(event) => setApiToken(event.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-3 py-2.5 text-left text-xs outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-950"
              />
              <span className="block text-[10px] leading-5 text-amber-700 dark:text-amber-300">
                مقدار این فیلد باید با <code dir="ltr">ZHINO_API_TOKEN</code> سرور یکسان باشد. فایل
                حاوی توکن را عمومی یا commit نکنید.
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
            <h3 className="mb-3 text-xs font-black text-on-surface">مراحل راه‌اندازی</h3>
            <ol className="space-y-2.5">
              {[
                'مقادیر بالا را تکمیل و فایل نمونه را دانلود کنید.',
                <>
                  فایل را با نام <code dir="ltr">.cursor/mcp.json</code> در ریشه پروژه ذخیره کنید.
                </>,
                'Cursor را Restart کنید و سرور «zhino» را در بخش MCP فعال کنید.',
                <>
                  ابزار <code dir="ltr">health_check</code> را اجرا کنید تا اتصال بررسی شود.
                </>,
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-[11px] leading-5 text-on-surface-variant">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-black text-primary">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-on-surface">فایل نمونه Cursor</h3>
              <p className="mt-1 text-[10px] text-on-surface-variant" dir="ltr">
                .cursor/mcp.json
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void copyConfig()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 px-3 py-2 text-[11px] font-bold transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'کپی شد' : 'کپی'}
              </button>
              <button
                type="button"
                onClick={downloadConfig}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white"
              >
                <span className="material-symbols-outlined text-base">download</span>
                دانلود فایل
              </button>
            </div>
          </div>
          <pre
            dir="ltr"
            className="min-h-[280px] flex-1 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-[11px] leading-6 text-sky-100"
          >
            <code>{config}</code>
          </pre>
          <p className="mt-3 text-[10px] leading-5 text-on-surface-variant">
            ابزارهای اصلی:{' '}
            <span dir="ltr">
              get_capabilities، list_pages، get_blocks، replace_blocks، update_settings،
              list_doctors، list_faqs و list_media
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
