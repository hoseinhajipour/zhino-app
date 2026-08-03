import React, { useEffect, useMemo, useState } from 'react';
import type { Workshop } from '../../types';
import { MediaField } from '../media/MediaField';
import { deleteWorkshop, saveWorkshop, subscribeWorkshops } from '../../lib/dbService';
import {
  createDefaultWorkshopBlocks,
  getWorkshopPath,
  slugifyWorkshopTitle,
} from '../../lib/workshopDefaults';

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

function blankWorkshop(sortOrder: number): Workshop {
  const id = `workshop-${Date.now().toString(36)}`;
  return {
    id,
    title: '',
    slug: '',
    description: '',
    posterUrl: '',
    active: true,
    sortOrder,
    pageBuilder: { version: 1, blocks: [] },
  };
}

interface WorkshopsAdminPanelProps {
  onOpenPageBuilder: (workshop: Workshop) => void;
}

export const WorkshopsAdminPanel: React.FC<WorkshopsAdminPanelProps> = ({ onOpenPageBuilder }) => {
  const [items, setItems] = useState<Workshop[]>([]);
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => subscribeWorkshops(setItems), []);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.title.localeCompare(b.title, 'fa')
      ),
    [items]
  );

  const openNew = () => {
    const nextOrder = sorted.length
      ? Math.max(...sorted.map((w) => w.sortOrder ?? 0)) + 1
      : 1;
    setEditing(blankWorkshop(nextOrder));
    setMsg(null);
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const title = editing.title.trim();
    if (!title) {
      setMsg({ type: 'error', text: 'عنوان کارگاه الزامی است.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const posterUrl = (editing.posterUrl || '').trim();
      const slug =
        (editing.slug || '').trim() || slugifyWorkshopTitle(title);
      const existing = items.find((w) => w.id === editing.id);
      const pageBuilder =
        existing?.pageBuilder?.blocks?.length
          ? existing.pageBuilder
          : editing.pageBuilder?.blocks?.length
            ? editing.pageBuilder
            : {
                version: 1 as const,
                blocks: createDefaultWorkshopBlocks({
                  title,
                  description: editing.description,
                  posterUrl,
                }),
              };

      const payload: Workshop = {
        ...editing,
        title,
        slug,
        description: (editing.description || '').trim(),
        posterUrl,
        registrationPhone: (editing.registrationPhone || '').trim(),
        registrationPhoneClean: (editing.registrationPhoneClean || '').trim(),
        active: editing.active !== false,
        sortOrder: Number(editing.sortOrder) || 0,
        pageBuilder,
      };
      await saveWorkshop(payload);
      setEditing(null);
      setMsg({ type: 'success', text: 'اطلاعات کارگاه ذخیره شد.' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در ذخیره کارگاه',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('این کارگاه حذف شود؟')) return;
    try {
      await deleteWorkshop(id);
      if (editing?.id === id) setEditing(null);
      setMsg({ type: 'success', text: 'کارگاه حذف شد.' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در حذف کارگاه',
      });
    }
  };

  const toggleActive = async (w: Workshop) => {
    try {
      await saveWorkshop({ ...w, active: !(w.active !== false) });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در تغییر وضعیت',
      });
    }
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-on-surface">مدیریت کارگاه‌ها</h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            هر کارگاه صفحه اختصاصی با صفحه‌ساز دارد — پوستر، معرفی و جزئیات را جداگانه طراحی کنید
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">add</span>
          کارگاه جدید
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSaveMeta}
          className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-primary">
              {items.some((w) => w.id === editing.id) ? 'ویرایش مشخصات' : 'کارگاه جدید'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-bold text-on-surface-variant hover:text-primary"
            >
              انصراف
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1">عنوان *</label>
              <input
                className={fieldCls}
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          title,
                          slug: prev.slug ? prev.slug : slugifyWorkshopTitle(title),
                        }
                      : prev
                  );
                }}
                placeholder="مثلاً کارگاه والدگری در عصر دیجیتال"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">نامک (slug)</label>
              <input
                className={fieldCls}
                dir="ltr"
                value={editing.slug || ''}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, slug: e.target.value.trim().toLowerCase() } : prev
                  )
                }
                placeholder="workshop-slug"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1">توضیح کوتاه (کارت فهرست)</label>
              <textarea
                className={fieldCls}
                rows={2}
                value={editing.description || ''}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">شماره ثبت‌نام کارگاه</label>
              <input
                className={fieldCls}
                dir="ltr"
                value={editing.registrationPhone || ''}
                onChange={(e) => {
                  const registrationPhone = e.target.value;
                  const registrationPhoneClean = registrationPhone.replace(/\D/g, '');
                  setEditing((prev) =>
                    prev ? { ...prev, registrationPhone, registrationPhoneClean } : prev
                  );
                }}
                placeholder="۰۲۱-۸۸۷۷۶۶۵۵"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ترتیب نمایش</label>
              <input
                type="number"
                className={fieldCls}
                value={editing.sortOrder ?? 1}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, sortOrder: Number(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer pt-6">
              <input
                type="checkbox"
                checked={editing.active !== false}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, active: e.target.checked } : prev))
                }
                className="w-4 h-4 accent-primary rounded"
              />
              فعال در سایت
            </label>
            <div className="md:col-span-2">
              <MediaField
                label="تصویر شاخص / پوستر"
                value={editing.posterUrl || ''}
                onChange={(url) =>
                  setEditing((prev) => (prev ? { ...prev, posterUrl: url } : prev))
                }
                accept="image"
                aspect="portrait"
                helperText="پس از انتخاب از کتابخانه، حتماً ذخیره کنید"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 border border-outline-variant rounded-xl text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره…' : 'ذخیره مشخصات'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.length === 0 && !editing && (
          <div className="col-span-full text-center py-12 rounded-3xl border border-dashed border-outline-variant bg-surface-container-low">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">event</span>
            <p className="text-sm font-bold mt-2">هنوز کارگاهی ثبت نشده است</p>
          </div>
        )}
        {sorted.map((w) => (
          <article
            key={w.id}
            className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 overflow-hidden shadow-soft flex flex-col"
          >
            {w.posterUrl ? (
              <img src={w.posterUrl} alt={w.title} className="w-full aspect-[4/5] object-cover" />
            ) : (
              <div className="w-full aspect-[4/5] bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">image</span>
              </div>
            )}
            <div className="p-4 space-y-2 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-black text-on-surface">{w.title}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    w.active !== false
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {w.active !== false ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              {w.description && (
                <p className="text-[11px] text-on-surface-variant line-clamp-2 flex-1">{w.description}</p>
              )}
              <p className="text-[10px] text-on-surface-variant font-mono" dir="ltr">
                {getWorkshopPath(w)}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenPageBuilder(w)}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-[11px] font-bold"
                >
                  طراحی صفحه
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing({ ...w, posterUrl: w.posterUrl || '' });
                    setMsg(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-primary text-primary text-[11px] font-bold"
                >
                  مشخصات
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(w)}
                  className="px-3 py-2 rounded-xl border border-outline-variant text-[11px] font-bold"
                >
                  {w.active !== false ? 'غیرفعال' : 'فعال'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(w.id)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold"
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
