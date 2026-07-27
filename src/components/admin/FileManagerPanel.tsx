import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteMediaFile,
  fetchMediaLibrary,
  MediaLibraryItem,
  uploadManagedFile,
} from '../../lib/dbService';

type KindFilter = 'all-files' | 'image' | 'video' | 'audio' | 'document';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function kindIcon(kind: MediaLibraryItem['kind']) {
  if (kind === 'image') return 'image';
  if (kind === 'video') return 'movie';
  if (kind === 'audio') return 'audio_file';
  if (kind === 'document') return 'description';
  return 'draft';
}

function kindLabel(kind: MediaLibraryItem['kind']) {
  if (kind === 'image') return 'تصویر';
  if (kind === 'video') return 'ویدیو';
  if (kind === 'audio') return 'صوت';
  if (kind === 'document') return 'سند';
  return 'سایر';
}

const FILTERS: Array<{ id: KindFilter; label: string }> = [
  { id: 'all-files', label: 'همه' },
  { id: 'image', label: 'تصویر' },
  { id: 'video', label: 'ویدیو' },
  { id: 'audio', label: 'صوت' },
  { id: 'document', label: 'سند' },
];

export const FileManagerPanel: React.FC = () => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<KindFilter>('all-files');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async (kind: KindFilter = filter) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMediaLibrary(kind);
      setItems(data);
    } catch {
      setError('خطا در بارگذاری فهرست فایل‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filter changes
  }, [filter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.filename.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.source.includes(q)
    );
  }, [items, search]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      let count = 0;
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`حجم «${file.name}» بیشتر از ۵۰ مگابایت است`);
        }
        await uploadManagedFile(file);
        count += 1;
      }
      setMessage(`${count} فایل با موفقیت آپلود شد.`);
      await load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در آپلود');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: MediaLibraryItem) => {
    if (item.source !== 'uploads') {
      alert('فایل‌های پوشه پرسنل فقط از طریق فایل‌سیستم قابل حذف هستند.');
      return;
    }
    if (!window.confirm(`حذف «${item.filename}» از سرور؟ این عمل قابل بازگشت نیست.`)) return;
    setError('');
    setMessage('');
    try {
      await deleteMediaFile(item.filename);
      setMessage(`«${item.filename}» حذف شد.`);
      await load(filter);
    } catch {
      setError('حذف فایل ناموفق بود');
    }
  };

  const handleDownload = (item: MediaLibraryItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.filename;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('آدرس فایل کپی شد.');
    } catch {
      setError('کپی آدرس ناموفق بود');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {(error || message) && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            error
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span className="material-symbols-outlined">
            {error ? 'error' : 'check_circle'}
          </span>
          <span>{error || message}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">مدیریت فایل‌های سرور</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                مشاهده، آپلود، ذخیره و حذف فایل‌های پوشه uploads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load(filter)}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              بروزرسانی
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {uploading ? 'hourglass_top' : 'upload_file'}
              </span>
              {uploading ? 'در حال آپلود…' : 'آپلود فایل'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.zip,.epub,.doc,.docx,.txt,.rtf"
              onChange={(e) => void handleUpload(e.target.files)}
            />
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                filter === f.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="relative flex-1 min-w-[160px] max-w-xs mr-auto">
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام فایل…"
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div
          className="mx-5 mt-4 mb-2 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-low/40 px-4 py-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!uploading) void handleUpload(e.dataTransfer.files);
          }}
        >
          <span className="material-symbols-outlined text-3xl text-primary/70">cloud_upload</span>
          <p className="text-xs font-bold text-on-surface mt-1">
            فایل را بکشید و رها کنید یا برای انتخاب کلیک کنید
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            تصویر، ویدیو، صوت و اسناد (PDF، ZIP و…) تا ۵۰ مگابایت
          </p>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-on-surface-variant gap-2">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              در حال بارگذاری…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">folder_off</span>
              <p className="text-xs font-bold">فایلی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[11px]">
                    <th className="text-right font-bold px-4 py-3">فایل</th>
                    <th className="text-right font-bold px-3 py-3 w-24">نوع</th>
                    <th className="text-right font-bold px-3 py-3 w-24">حجم</th>
                    <th className="text-right font-bold px-3 py-3 w-36">تاریخ</th>
                    <th className="text-right font-bold px-3 py-3 w-40">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={`${item.source}-${item.filename}`}
                      className="border-t border-outline-variant/20 hover:bg-surface-container-low/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                            {item.kind === 'image' ? (
                              <img
                                src={item.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant">
                                {kindIcon(item.kind)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface truncate" title={item.filename}>
                              {item.filename}
                            </p>
                            <p className="text-[10px] text-on-surface-variant truncate dir-ltr text-left" dir="ltr">
                              {item.url}
                              {item.source === 'staff' ? ' · پرسنل' : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-on-surface-variant font-bold">
                        {kindLabel(item.kind)}
                      </td>
                      <td className="px-3 py-3 text-on-surface-variant" dir="ltr">
                        {formatSize(item.size)}
                      </td>
                      <td className="px-3 py-3 text-on-surface-variant whitespace-nowrap">
                        {formatDate(item.uploadedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="ذخیره / دانلود"
                            onClick={() => handleDownload(item)}
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                          </button>
                          <button
                            type="button"
                            title="کپی آدرس"
                            onClick={() => void handleCopyUrl(item.url)}
                            className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">link</span>
                          </button>
                          {item.source === 'uploads' && (
                            <button
                              type="button"
                              title="حذف"
                              onClick={() => void handleDelete(item)}
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <p className="text-[10px] text-on-surface-variant mt-3 font-bold">
              {filtered.length} فایل
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
