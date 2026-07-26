import React, { useMemo, useState } from 'react';
import { writeAuthHeaders } from '../../lib/dbService';

type EntityKey =
  | 'pages'
  | 'articles'
  | 'article_categories'
  | 'doctors'
  | 'services'
  | 'faqs'
  | 'forms'
  | 'form_submissions'
  | 'settings'
  | 'users'
  | 'appointments';

const ENTITY_OPTIONS: Array<{ key: EntityKey; label: string; hint: string }> = [
  { key: 'pages', label: 'صفحات سایت', hint: 'صفحات صفحه‌ساز' },
  { key: 'articles', label: 'مقالات', hint: 'بلاگ و مجله' },
  { key: 'article_categories', label: 'دسته‌بندی مقالات', hint: 'دسته‌ها' },
  { key: 'doctors', label: 'پرسنل', hint: 'درمانگران' },
  { key: 'services', label: 'خدمات', hint: 'دپارتمان‌ها' },
  { key: 'faqs', label: 'سوالات متداول', hint: 'FAQ' },
  { key: 'forms', label: 'تعاریف فرم', hint: 'فرم‌ساز مرکزی' },
  { key: 'form_submissions', label: 'ارسال فرم‌ها', hint: 'اینباکس فرم' },
  { key: 'settings', label: 'تنظیمات', hint: 'هویت و کروم سایت' },
  { key: 'users', label: 'کاربران', hint: 'حساب‌ها (رمز اختیاری)' },
  { key: 'appointments', label: 'نوبت‌ها', hint: 'رزروها' },
];

type IoMode = 'zhino-export' | 'zhino-import' | 'wordpress';

export const ImportExportPanel: React.FC = () => {
  const [mode, setMode] = useState<IoMode>('zhino-export');
  const [selected, setSelected] = useState<EntityKey[]>([
    'pages',
    'articles',
    'article_categories',
    'doctors',
    'services',
    'faqs',
    'forms',
    'form_submissions',
    'settings',
  ]);
  const [includeUserSecrets, setIncludeUserSecrets] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'skipExisting'>('merge');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [wpFile, setWpFile] = useState<File | null>(null);
  const [wpPosts, setWpPosts] = useState(true);
  const [wpPages, setWpPages] = useState(true);
  const [wpMedia, setWpMedia] = useState(true);
  const [wpStatus, setWpStatus] = useState<'keep' | 'draft' | 'published'>('keep');
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  const allSelected = selected.length === ENTITY_OPTIONS.length;

  const toggleEntity = (key: EntityKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelected(ENTITY_OPTIONS.map((e) => e.key));
  const selectNone = () => setSelected([]);

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setLastResult(null);
    try {
      if (!selected.length) throw new Error('حداقل یک بخش را انتخاب کنید.');
      const res = await fetch('/api/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...writeAuthHeaders() },
        body: JSON.stringify({ entities: selected, includeUserSecrets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'برون‌ریزی ناموفق بود.');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadJson(data, `zhino-backup-${stamp}.json`);
      setMessage('فایل پشتیبان با موفقیت دانلود شد.');
      setLastResult({
        exportedAt: data.exportedAt,
        counts: Object.fromEntries(
          Object.entries(data.entities || {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
        ),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در برون‌ریزی');
    } finally {
      setBusy(false);
    }
  };

  const handleZhinoImport = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setLastResult(null);
    try {
      if (!importFile) throw new Error('فایل JSON پشتیبان را انتخاب کنید.');
      if (!selected.length) throw new Error('حداقل یک بخش را برای درون‌ریزی انتخاب کنید.');
      const text = await importFile.text();
      const backup = JSON.parse(text);
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...writeAuthHeaders() },
        body: JSON.stringify({ backup, entities: selected, mode: importMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'درون‌ریزی ناموفق بود.');
      setMessage('درون‌ریزی ژینو انجام شد. صفحه را یک‌بار رفرش کنید تا داده‌ها دیده شوند.');
      setLastResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در درون‌ریزی');
    } finally {
      setBusy(false);
    }
  };

  const handleWordpressImport = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setLastResult(null);
    try {
      if (!wpFile) throw new Error('فایل وردپرس (JSON یا XML/WXR) را انتخاب کنید.');
      const form = new FormData();
      form.append('file', wpFile);
      form.append('importPosts', String(wpPosts));
      form.append('importPages', String(wpPages));
      form.append('downloadMedia', String(wpMedia));
      form.append('statusMode', wpStatus);
      const res = await fetch('/api/backup/wordpress', {
        method: 'POST',
        headers: writeAuthHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'درون‌ریزی وردپرس ناموفق بود.');
      setMessage(
        `وردپرس درون‌ریزی شد: ${data.posts || 0} مقاله، ${data.pages || 0} صفحه، ${data.mediaDownloaded || 0} رسانه دانلود شد.`
      );
      setLastResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در درون‌ریزی وردپرس');
    } finally {
      setBusy(false);
    }
  };

  const modes = useMemo(
    () =>
      [
        { id: 'zhino-export' as const, label: 'برون‌ریزی ژینو', icon: 'download' },
        { id: 'zhino-import' as const, label: 'درون‌ریزی ژینو', icon: 'upload' },
        { id: 'wordpress' as const, label: 'درون‌ریزی وردپرس', icon: 'wordpress' },
      ] as const,
    []
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-teal-600 text-3xl">import_export</span>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              درونریزی و برونریزی
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
              از داده‌های سایت نسخهٔ JSON اختصاصی ژینو بگیرید یا برگردانید. همچنین می‌توانید خروجی
              استاندارد وردپرس (JSON یا WXR/XML) را وارد کنید؛ تصاویر و ویدیوهای داخل مطالب هنگام
              درون‌ریزی به هاست شما دانلود و به‌صورت محلی ذخیره می‌شوند.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setError(null);
                setMessage(null);
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-right transition-all ${
                mode === m.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'
              }`}
            >
                            <span className="material-symbols-outlined text-teal-700">{m.icon === 'wordpress' ? 'language' : m.icon}</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(mode === 'zhino-export' || mode === 'zhino-import') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-black text-slate-900 dark:text-white">انتخاب بخش‌ها</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-bold text-teal-700 hover:underline"
              >
                انتخاب همه
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="text-[11px] font-bold text-slate-500 hover:underline"
              >
                هیچ‌کدام
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ENTITY_OPTIONS.map((opt) => {
              const on = selected.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  className={`flex items-start gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                    on
                      ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleEntity(opt.key)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <span>
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-100">
                      {opt.label}
                    </span>
                    <span className="block text-[10px] text-slate-500">{opt.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {mode === 'zhino-export' && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeUserSecrets}
                  onChange={(e) => setIncludeUserSecrets(e.target.checked)}
                />
                در برون‌ریزی کاربران، هش رمز عبور هم ذخیره شود (حساس)
              </label>
              <button
                type="button"
                disabled={busy || !selected.length}
                onClick={handleExport}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-xl"
              >
                <span className="material-symbols-outlined text-base">download</span>
                {busy ? 'در حال آماده‌سازی…' : 'دانلود فایل پشتیبان JSON'}
              </button>
              <p className="text-[10px] text-slate-500">
                ساختار فایل: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">zhino-backup</code>{' '}
                نسخه ۱ — {allSelected ? 'همه بخش‌ها' : `${selected.length} بخش`} انتخاب شده.
              </p>
            </div>
          )}

          {mode === 'zhino-import' && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-slate-600">فایل پشتیبان ژینو (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-800 file:font-bold"
                />
              </label>
              <label className="block space-y-1 max-w-md">
                <span className="text-[11px] font-bold text-slate-600">حالت درون‌ریزی</span>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'skipExisting')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="merge">ادغام / جایگزینی با همان شناسه</option>
                  <option value="skipExisting">رد کردن موارد موجود</option>
                </select>
              </label>
              <button
                type="button"
                disabled={busy || !importFile || !selected.length}
                onClick={handleZhinoImport}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-xl"
              >
                <span className="material-symbols-outlined text-base">upload</span>
                {busy ? 'در حال درون‌ریزی…' : 'شروع درون‌ریزی ژینو'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'wordpress' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-3 text-[11px] text-amber-900 dark:text-amber-100 leading-relaxed">
            از وردپرس می‌توانید خروجی استاندارد Tools → Export (فایل XML/WXR) یا یک فایل JSON شامل
            پست‌ها/صفحات را وارد کنید. پست‌ها به «مقالات» و صفحات به «صفحات سایت» تبدیل می‌شوند. اگر
            دانلود رسانه فعال باشد، عکس‌ها و ویدیوهای داخل محتوا و تصویر شاخص روی سرور شما ذخیره
            می‌شوند (<code className="px-1 bg-white/60 rounded">/uploads</code>).
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-600">فایل وردپرس (.json / .xml)</span>
            <input
              type="file"
              accept=".json,.xml,application/json,text/xml,application/xml"
              onChange={(e) => setWpFile(e.target.files?.[0] || null)}
              className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-800 file:font-bold"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={wpPosts} onChange={(e) => setWpPosts(e.target.checked)} />
              درون‌ریزی پست‌ها → مقالات
            </label>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={wpPages} onChange={(e) => setWpPages(e.target.checked)} />
              درون‌ریزی صفحات → صفحات سایت
            </label>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={wpMedia} onChange={(e) => setWpMedia(e.target.checked)} />
              دانلود و انتقال رسانه به هاست محلی
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-600">وضعیت انتشار</span>
              <select
                value={wpStatus}
                onChange={(e) => setWpStatus(e.target.value as typeof wpStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <option value="keep">مطابق وردپرس</option>
                <option value="draft">همه پیش‌نویس</option>
                <option value="published">همه منتشرشده</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            disabled={busy || !wpFile || (!wpPosts && !wpPages)}
            onClick={handleWordpressImport}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-xl"
          >
            <span className="material-symbols-outlined text-base">cloud_download</span>
            {busy ? 'در حال پردازش و دانلود رسانه…' : 'شروع درون‌ریزی وردپرس'}
          </button>
        </div>
      )}

      {(message || error || lastResult) && (
        <div
          className={`rounded-2xl border p-4 text-xs space-y-2 ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-100'
              : 'border-teal-200 bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-100'
          }`}
        >
          {error && <p className="font-bold">{error}</p>}
          {message && <p className="font-bold">{message}</p>}
          {lastResult && (
            <pre className="overflow-x-auto text-[10px] bg-black/5 dark:bg-black/20 rounded-xl p-3 dir-ltr text-left">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
