import React, { useEffect, useRef, useState } from 'react';
import type { SiteSeoSettings } from '../../types';
import { MediaField } from '../media/MediaField';
import {
  DEFAULT_SITE_SEO,
  isGoogleVerificationFilename,
  mergeSiteSeo,
} from '../../lib/seoSettingsDefaults';
import {
  deleteGoogleVerificationFile,
  fetchGoogleVerificationFile,
  uploadGoogleVerificationFile,
  type SeoVerificationFileInfo,
} from '../../lib/dbService';

interface SeoSettingsPanelProps {
  value: SiteSeoSettings;
  onChange: (next: SiteSeoSettings) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
  saveMsg?: { type: 'success' | 'error'; msg: string } | null;
}

const fieldCls =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30';

const DEFAULT_ROBOTS_TEMPLATE = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /user-panel

Sitemap: https://zhinopsy.com/sitemap.xml
`;

const DEFAULT_SITEMAP_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zhinopsy.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-on-surface">{title}</h2>
          <p className="mt-1 text-[11px] font-medium leading-6 text-on-surface-variant">{hint}</p>
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export const SeoSettingsPanel: React.FC<SeoSettingsPanelProps> = ({
  value,
  onChange,
  onSave,
  saving,
  saveMsg,
}) => {
  const [draft, setDraft] = useState<SiteSeoSettings>(() => mergeSiteSeo(value || DEFAULT_SITE_SEO));
  const [verifyFile, setVerifyFile] = useState<SeoVerificationFileInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const dirtyRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dirtyRef.current) return;
    setDraft(mergeSiteSeo(value || DEFAULT_SITE_SEO));
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    void fetchGoogleVerificationFile().then((info) => {
      if (!cancelled) setVerifyFile(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (partial: Partial<SiteSeoSettings>) => {
    dirtyRef.current = true;
    const next = mergeSiteSeo({ ...draft, ...partial });
    setDraft(next);
    onChange(next);
  };

  const handleUpload = async (file: File) => {
    setUploadMsg(null);
    if (!isGoogleVerificationFilename(file.name)) {
      setUploadMsg({
        type: 'error',
        msg: 'نام فایل باید شبیه googleXXXX.html باشد (همان فایلی که گوگل می‌دهد).',
      });
      return;
    }
    setUploading(true);
    try {
      const info = await uploadGoogleVerificationFile(file);
      setVerifyFile(info);
      patch({ googleHtmlVerificationFilename: info.filename });
      setUploadMsg({
        type: 'success',
        msg: `فایل در ریشه سایت قرار گرفت: ${info.url} — دکمه VERIFY را در Search Console بزنید.`,
      });
    } catch (err) {
      setUploadMsg({
        type: 'error',
        msg: err instanceof Error ? err.message : 'آپلود ناموفق بود',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveVerify = async () => {
    setUploadMsg(null);
    setUploading(true);
    try {
      await deleteGoogleVerificationFile(verifyFile?.filename || draft.googleHtmlVerificationFilename);
      setVerifyFile(null);
      patch({ googleHtmlVerificationFilename: '' });
      setUploadMsg({ type: 'success', msg: 'فایل تأیید گوگل حذف شد.' });
    } catch (err) {
      setUploadMsg({
        type: 'error',
        msg: err instanceof Error ? err.message : 'حذف ناموفق بود',
      });
    } finally {
      setUploading(false);
    }
  };

  const activeVerifyName = verifyFile?.filename || draft.googleHtmlVerificationFilename;
  const verifyUrl = activeVerifyName
    ? `${draft.siteUrl || ''}/${activeVerifyName}`.replace(/([^:]\/)\/+/g, '$1')
    : '';

  return (
    <div className="space-y-6">
      {saveMsg && (
        <div
          className={`flex items-center gap-2 rounded-2xl border p-4 text-xs font-bold ${
            saveMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span className="material-symbols-outlined">
            {saveMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{saveMsg.msg}</span>
        </div>
      )}

      <Section
        icon="verified"
        title="تأیید مالکیت گوگل (Search Console)"
        hint="فایل HTML یا تگ متا را از Google Search Console بگیرید تا ایندکس و گزارش جستجو فعال شود. فایل باید بعد از تأیید هم روی سایت بماند."
      >
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-on-surface">روش فایل HTML</p>
              <p className="mt-1 text-[11px] text-on-surface-variant leading-5">
                فایل دانلودشده از گوگل (مثلاً{' '}
                <code className="rounded bg-white/80 px-1 text-[10px]" dir="ltr">
                  google93f7….html
                </code>
                ) را آپلود کنید تا در ریشه سایت سرو شود.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,text/html"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              {uploading ? 'در حال آپلود…' : 'آپلود فایل گوگل'}
            </button>
          </div>

          {activeVerifyName ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="min-w-0 text-[11px]">
                <p className="font-black text-emerald-800 dark:text-emerald-300">فایل فعال</p>
                <a
                  href={`/${activeVerifyName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate font-mono text-emerald-700 underline dark:text-emerald-400"
                  dir="ltr"
                >
                  {verifyUrl || `/${activeVerifyName}`}
                </a>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => void handleRemoveVerify()}
                className="shrink-0 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                حذف فایل
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-on-surface-variant">هنوز فایلی آپلود نشده است.</p>
          )}

          {uploadMsg && (
            <p
              className={`text-[11px] font-bold ${
                uploadMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {uploadMsg.msg}
            </p>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-on-surface-variant">
            تگ متا HTML (جایگزین یا مکمل فایل)
          </span>
          <input
            className={fieldCls}
            dir="ltr"
            placeholder="محتوای content از google-site-verification"
            value={draft.googleSiteVerification}
            onChange={(e) => patch({ googleSiteVerification: e.target.value })}
          />
          <p className="text-[10px] text-on-surface-variant leading-5">
            فقط مقدار content را وارد کنید؛ تگ کامل در صفحه اصلی درج می‌شود.
          </p>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-on-surface-variant">تأیید بینگ (Bing)</span>
          <input
            className={fieldCls}
            dir="ltr"
            placeholder="msvalidate.01 content"
            value={draft.bingSiteVerification}
            onChange={(e) => patch({ bingSiteVerification: e.target.value })}
          />
        </label>
      </Section>

      <Section
        icon="travel_explore"
        title="متای پیش‌فرض سایت"
        hint="عنوان، توضیحات و کلمات کلیدی پایه برای صفحه اصلی و اشتراک‌گذاری شبکه‌های اجتماعی."
      >
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-on-surface-variant">آدرس اصلی سایت (Canonical)</span>
          <input
            className={fieldCls}
            dir="ltr"
            placeholder="https://zhinopsy.com"
            value={draft.siteUrl}
            onChange={(e) => patch({ siteUrl: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-on-surface-variant">عنوان پیش‌فرض (Title)</span>
          <input
            className={fieldCls}
            placeholder="خالی = عنوان فعلی صفحه اصلی"
            value={draft.defaultTitle}
            onChange={(e) => patch({ defaultTitle: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-on-surface-variant">توضیحات متا (Description)</span>
          <textarea
            rows={3}
            className={fieldCls}
            placeholder="خلاصه ۱۵۰–۱۶۰ کاراکتری برای نتایج جستجو"
            value={draft.defaultDescription}
            onChange={(e) => patch({ defaultDescription: e.target.value })}
          />
          <p className="text-[10px] text-on-surface-variant" dir="ltr">
            {draft.defaultDescription.length} chars
          </p>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold text-on-surface-variant">کلمات کلیدی</span>
          <input
            className={fieldCls}
            placeholder="کلینیک روانشناسی, مشاوره آنلاین, …"
            value={draft.defaultKeywords}
            onChange={(e) => patch({ defaultKeywords: e.target.value })}
          />
        </label>
        <MediaField
          label="تصویر Open Graph پیش‌فرض"
          value={draft.ogImage}
          onChange={(v) => patch({ ogImage: v })}
          accept="image"
          aspect="video"
          helperText="برای اشتراک در واتساپ، تلگرام و شبکه‌های اجتماعی (حدود ۱۲۰۰×۶۳۰)"
        />
      </Section>

      <Section
        icon="monitoring"
        title="آنالیتیکس و تگ منیجر"
        hint="شناسه‌های Google Analytics 4 و Google Tag Manager برای اندازه‌گیری ترافیک و رویدادها."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant">Google Analytics (GA4)</span>
            <input
              className={fieldCls}
              dir="ltr"
              placeholder="G-XXXXXXXXXX"
              value={draft.googleAnalyticsId}
              onChange={(e) => patch({ googleAnalyticsId: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant">Google Tag Manager</span>
            <input
              className={fieldCls}
              dir="ltr"
              placeholder="GTM-XXXXXXX"
              value={draft.googleTagManagerId}
              onChange={(e) => patch({ googleTagManagerId: e.target.value })}
            />
          </label>
        </div>
      </Section>

      <Section
        icon="policy"
        title="robots.txt"
        hint="اگر خالی باشد، فایل پیش‌فرض سایت استفاده می‌شود. پس از ویرایش، ذخیره کنید تا در /robots.txt اعمال شود."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => patch({ robotsTxt: DEFAULT_ROBOTS_TEMPLATE })}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-[11px] font-bold hover:bg-surface-container"
          >
            بارگذاری الگوی پایه
          </button>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-outline-variant/40 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/5"
          >
            مشاهده /robots.txt
          </a>
        </div>
        <textarea
          rows={10}
          className={`${fieldCls} font-mono text-[11px] leading-5`}
          dir="ltr"
          placeholder="خالی = فایل استاتیک پیش‌فرض"
          value={draft.robotsTxt}
          onChange={(e) => patch({ robotsTxt: e.target.value })}
        />
      </Section>

      <Section
        icon="account_tree"
        title="sitemap.xml"
        hint="نقشه سایت برای خزنده‌ها. اگر خالی باشد، sitemap استاتیک فعلی سرو می‌شود."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => patch({ sitemapXml: DEFAULT_SITEMAP_TEMPLATE })}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-[11px] font-bold hover:bg-surface-container"
          >
            بارگذاری الگوی پایه
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-outline-variant/40 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/5"
          >
            مشاهده /sitemap.xml
          </a>
        </div>
        <textarea
          rows={12}
          className={`${fieldCls} font-mono text-[11px] leading-5`}
          dir="ltr"
          placeholder="خالی = فایل استاتیک پیش‌فرض"
          value={draft.sitemapXml}
          onChange={(e) => patch({ sitemapXml: e.target.value })}
        />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات سئو'}
        </button>
      </div>
    </div>
  );
};
