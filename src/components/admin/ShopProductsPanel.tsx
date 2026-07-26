import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  ShopProduct,
  ShopProductCategory,
  ShopProductKind,
  ShopProductStatus,
  ShopProductType,
  ShopProductVariation,
} from '../../types';
import { MediaField } from '../media/MediaField';
import { MediaPicker } from '../media/MediaPicker';
import { RichTextEditor } from '../page-builder/RichTextEditor';
import { ShopProductPreview } from '../shop/ShopProductPreview';
import {
  createBlankProduct,
  createBlankVariation,
  formatPriceRange,
  formatShopPrice,
  getProductThumb,
  SHOP_PRODUCT_KIND_LABELS,
  SHOP_PRODUCT_STATUS_LABELS,
  SHOP_PRODUCT_TYPE_LABELS,
  slugifyProductName,
} from '../../lib/shopDefaults';
import {
  deleteProduct,
  saveProduct,
  subscribeProductCategories,
  subscribeProducts,
  uploadShopDocument,
} from '../../lib/dbService';

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

type EditorSection = 'general' | 'media' | 'pricing' | 'variations' | 'description';

function normalizeGallery(urls: string[] | undefined, cover?: string): string[] {
  const coverTrim = (cover || '').trim();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls || []) {
    const v = (u || '').trim();
    if (!v || v === coverTrim || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function SectionCard({
  title,
  icon,
  hint,
  children,
  actions,
}: {
  title: string;
  icon: string;
  hint?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-on-surface">{title}</h3>
            {hint && <p className="text-[10px] text-on-surface-variant mt-0.5">{hint}</p>}
          </div>
        </div>
        {actions}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

export const ShopProductsPanel: React.FC = () => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopProductCategory[]>([]);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [section, setSection] = useState<EditorSection>('general');
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | ShopProductStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedVarId, setExpandedVarId] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeProducts(setProducts);
    const u2 = subscribeProductCategories(setCategories);
    return () => {
      u1();
      u2();
    };
  }, []);

  const activeCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => c.active !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const list = useMemo(() => {
    return [...products]
      .filter((p) => (filter === 'all' ? true : p.status === filter))
      .filter((p) => {
        if (categoryFilter === 'all') return true;
        if (categoryFilter === 'none') return !p.categoryId && !p.category;
        return p.categoryId === categoryFilter || p.category === categoryFilter;
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [products, filter, categoryFilter]);

  useEffect(() => {
    if (!previewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [previewOpen]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const startNew = () => {
    setEditing(createBlankProduct());
    setSection('general');
    setExpandedVarId(null);
  };

  const openEdit = (p: ShopProduct) => {
    setEditing(
      createBlankProduct({
        ...p,
        kind: p.kind || 'simple',
        galleryUrls: Array.isArray(p.galleryUrls) ? p.galleryUrls : [],
        variations: Array.isArray(p.variations) ? p.variations : [],
      })
    );
    setSection('general');
    setExpandedVarId(null);
  };

  const patch = (partial: Partial<ShopProduct>) => {
    if (!editing) return;
    setEditing({ ...editing, ...partial });
  };

  const patchGallery = (galleryUrls: string[]) => {
    if (!editing) return;
    patch({ galleryUrls: normalizeGallery(galleryUrls, editing.imageUrl) });
  };

  const setKind = (kind: ShopProductKind) => {
    if (!editing) return;
    if (kind === 'variable') {
      const variations =
        editing.variations && editing.variations.length
          ? editing.variations
          : [createBlankVariation({ name: 'پیش‌فرض', price: editing.price })];
      patch({ kind, variations });
      setSection('variations');
      setExpandedVarId(variations[0]?.id || null);
    } else {
      patch({ kind });
    }
  };

  const updateVariation = (id: string, partial: Partial<ShopProductVariation>) => {
    if (!editing) return;
    const variations = (editing.variations || []).map((v) =>
      v.id === id ? { ...v, ...partial } : v
    );
    patch({ variations });
  };

  const addVariation = () => {
    if (!editing) return;
    const v = createBlankVariation({
      name: `ویژگی ${(editing.variations?.length || 0) + 1}`,
      price: editing.price,
    });
    patch({ variations: [...(editing.variations || []), v] });
    setExpandedVarId(v.id);
    setSection('variations');
  };

  const removeVariation = (id: string) => {
    if (!editing) return;
    const variations = (editing.variations || []).filter((v) => v.id !== id);
    patch({ variations });
    if (expandedVarId === id) setExpandedVarId(variations[0]?.id || null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      showMsg('error', 'نام محصول الزامی است');
      setSection('general');
      return;
    }
    if (editing.kind === 'variable') {
      const vars = editing.variations || [];
      if (!vars.length) {
        showMsg('error', 'حداقل یک ویژگی برای محصول متغیر لازم است');
        setSection('variations');
        return;
      }
      if (vars.some((v) => !v.name.trim())) {
        showMsg('error', 'نام همه ویژگی‌ها الزامی است');
        setSection('variations');
        return;
      }
    } else if (editing.price < 0 || Number.isNaN(editing.price)) {
      showMsg('error', 'قیمت نامعتبر است');
      setSection('pricing');
      return;
    }
    if (
      editing.type === 'digital' &&
      editing.kind !== 'variable' &&
      !editing.digitalFileUrl?.trim()
    ) {
      showMsg('error', 'برای محصول دیجیتال ساده، فایل یا لینک دانلود لازم است');
      setSection('pricing');
      return;
    }
    setSaving(true);
    try {
      const slug = editing.slug.trim() || slugifyProductName(editing.name);
      const kind = editing.kind || 'simple';
      const variations =
        kind === 'variable'
          ? (editing.variations || []).map((v) => ({
              ...v,
              name: v.name.trim(),
              price: Number(v.price) || 0,
            }))
          : [];
      const basePrice =
        kind === 'variable' && variations.length
          ? Math.min(...variations.map((v) => v.price))
          : editing.price;
      const next: ShopProduct = {
        ...editing,
        name: editing.name.trim(),
        slug,
        kind,
        price: basePrice,
        variations,
        galleryUrls: normalizeGallery(editing.galleryUrls, editing.imageUrl),
        updatedAt: new Date().toISOString(),
      };
      await saveProduct(next);
      setEditing(null);
      setPreviewOpen(false);
      showMsg('success', 'محصول ذخیره شد');
    } catch (e) {
      console.error(e);
      showMsg('error', 'ذخیره محصول ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('این محصول حذف شود؟')) return;
    try {
      await deleteProduct(id);
      if (editing?.id === id) setEditing(null);
      showMsg('success', 'محصول حذف شد');
    } catch (e) {
      console.error(e);
      showMsg('error', 'حذف ناموفق بود');
    }
  };

  const handleDigitalUpload = async (file: File | null, target: 'product' | string) => {
    if (!file || !editing) return;
    setUploadingFile(true);
    try {
      const { url } = await uploadShopDocument(file);
      if (target === 'product') patch({ digitalFileUrl: url });
      else updateVariation(target, { digitalFileUrl: url });
      showMsg('success', 'فایل آپلود شد');
    } catch (e) {
      console.error(e);
      showMsg('error', e instanceof Error ? e.message : 'آپلود ناموفق بود');
    } finally {
      setUploadingFile(false);
    }
  };

  const gallery = editing ? normalizeGallery(editing.galleryUrls, editing.imageUrl) : [];
  const isVariable = editing?.kind === 'variable';

  const navItems: { id: EditorSection; label: string; icon: string; show?: boolean }[] = [
    { id: 'general', label: 'عمومی', icon: 'info' },
    { id: 'media', label: 'رسانه', icon: 'imagesmode' },
    { id: 'pricing', label: 'قیمت', icon: 'payments', show: !isVariable },
    { id: 'variations', label: 'ویژگی‌ها', icon: 'tune', show: !!isVariable },
    { id: 'description', label: 'توضیحات', icon: 'notes' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined">
            {msg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {msg.text}
        </div>
      )}

      {!editing && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-on-surface">محصولات فروشگاه</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                محصولات ساده و متغیر — {products.length.toLocaleString('fa-IR')} مورد
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="all">همه دسته‌ها</option>
                <option value="none">بدون دسته</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | ShopProductStatus)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="all">همه</option>
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
              </select>
              <button
                type="button"
                onClick={startNew}
                className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                محصول جدید
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {list.length === 0 ? (
              <div className="p-10 text-center text-sm text-on-surface-variant">
                هنوز محصولی ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-surface-container-low text-[11px] text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3 font-bold">محصول</th>
                      <th className="px-4 py-3 font-bold">نوع</th>
                      <th className="px-4 py-3 font-bold">قیمت</th>
                      <th className="px-4 py-3 font-bold">وضعیت</th>
                      <th className="px-4 py-3 font-bold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => {
                      const thumb = getProductThumb(p);
                      return (
                        <tr
                          key={p.id}
                          className="border-t border-slate-100 dark:border-slate-800 hover:bg-surface-container-low/40"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-container shrink-0">
                                {thumb ? (
                                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-lg">
                                      inventory_2
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-on-surface truncate">{p.name}</div>
                                <div className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                                  <span>
                                    {SHOP_PRODUCT_KIND_LABELS[p.kind || 'simple']}
                                  </span>
                                  <span>·</span>
                                  <span className="dir-ltr truncate">/shop/{p.slug}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {SHOP_PRODUCT_TYPE_LABELS[p.type]}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {p.kind === 'variable' ? formatPriceRange(p) : formatShopPrice(p.price)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                p.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {SHOP_PRODUCT_STATUS_LABELS[p.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="p-2 rounded-lg hover:bg-primary/10 text-primary"
                                title="ویرایش"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              {p.status === 'published' && (
                                <a
                                  href={`/shop/${encodeURIComponent(p.slug)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-lg hover:bg-sky-50 text-sky-700"
                                  title="مشاهده در سایت"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    open_in_new
                                  </span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => void handleDelete(p.id)}
                                className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                                title="حذف"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {editing && (
        <div className="space-y-4">
          {/* Sticky editor chrome */}
          <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setPreviewOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant"
                  title="بازگشت به فهرست"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-on-surface truncate">
                    {products.some((p) => p.id === editing.id)
                      ? 'ویرایش محصول'
                      : 'محصول جدید'}
                  </h2>
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {editing.name || 'بدون عنوان'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-on-surface hover:border-primary/40 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  پیش‌نمایش
                </button>
                {editing.status === 'published' && editing.slug && (
                  <a
                    href={`/shop/${encodeURIComponent(editing.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-sky-200 text-sky-800 bg-sky-50 hover:bg-sky-100 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    در سایت
                  </a>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  {saving ? 'در حال ذخیره…' : 'ذخیره محصول'}
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
              {navItems
                .filter((n) => n.show !== false)
                .map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSection(n.id)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      section === n.id
                        ? 'bg-primary text-white shadow'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{n.icon}</span>
                    {n.label}
                  </button>
                ))}
            </div>
          </div>

          {section === 'general' && (
            <div className="space-y-4">
              <SectionCard title="اطلاعات پایه" icon="badge" hint="نام، اسلاگ و وضعیت انتشار">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block space-y-1 md:col-span-2">
                    <span className="text-[11px] font-bold text-on-surface-variant">نام محصول</span>
                    <input
                      className={fieldCls}
                      value={editing.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        patch({
                          name,
                          slug:
                            !editing.slug || editing.slug === slugifyProductName(editing.name)
                              ? slugifyProductName(name)
                              : editing.slug,
                        });
                      }}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">اسلاگ (URL)</span>
                    <input
                      className={fieldCls}
                      dir="ltr"
                      value={editing.slug}
                      onChange={(e) => patch({ slug: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">دسته‌بندی</span>
                    <select
                      className={fieldCls}
                      value={editing.categoryId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        const cat = activeCategories.find((c) => c.id === id);
                        patch({
                          categoryId: id,
                          category: cat?.name || '',
                        });
                      }}
                    >
                      <option value="">بدون دسته</option>
                      {editing.categoryId &&
                        !activeCategories.some((c) => c.id === editing.categoryId) && (
                          <option value={editing.categoryId}>
                            {editing.category || editing.categoryId} (غیرفعال)
                          </option>
                        )}
                      {activeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">وضعیت</span>
                    <select
                      className={fieldCls}
                      value={editing.status}
                      onChange={(e) =>
                        patch({ status: e.target.value as ShopProductStatus })
                      }
                    >
                      {(Object.keys(SHOP_PRODUCT_STATUS_LABELS) as ShopProductStatus[]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {SHOP_PRODUCT_STATUS_LABELS[s]}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">
                      نوع کالا (فیزیکی / دیجیتال)
                    </span>
                    <select
                      className={fieldCls}
                      value={editing.type}
                      onChange={(e) => patch({ type: e.target.value as ShopProductType })}
                    >
                      {(Object.keys(SHOP_PRODUCT_TYPE_LABELS) as ShopProductType[]).map((t) => (
                        <option key={t} value={t}>
                          {SHOP_PRODUCT_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editing.type === 'physical' && editing.kind !== 'variable' && (
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant">وزن (گرم)</span>
                      <input
                        type="number"
                        min={0}
                        className={fieldCls}
                        value={editing.weightGrams ?? ''}
                        onChange={(e) =>
                          patch({
                            weightGrams:
                              e.target.value === '' ? undefined : Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="ساختار محصول"
                icon="category"
                hint="ساده با یک قیمت، یا متغیر با چند ویژگی"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(SHOP_PRODUCT_KIND_LABELS) as ShopProductKind[]).map((k) => {
                    const active = (editing.kind || 'simple') === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        className={`text-right p-4 rounded-2xl border-2 transition-all ${
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined ${
                              active ? 'text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            {k === 'simple' ? 'inventory_2' : 'tune'}
                          </span>
                          <span className="text-sm font-black">{SHOP_PRODUCT_KIND_LABELS[k]}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                          {k === 'simple'
                            ? 'یک قیمت، یک موجودی و یک توضیح برای کل محصول.'
                            : 'هر ویژگی قیمت، توضیح و تصویر جداگانه دارد (مثل سایز یا پکیج).'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          )}

          {section === 'media' && (
            <SectionCard
              title="تصاویر محصول"
              icon="photo_library"
              hint="کاور اصلی و گالری اضافی"
              actions={
                <button
                  type="button"
                  onClick={() => setGalleryPickerOpen(true)}
                  className="px-3 py-1.5 text-[11px] font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                  افزودن به گالری
                </button>
              }
            >
              <div className="max-w-sm">
                <MediaField
                  label="تصویر اصلی (کاور)"
                  value={editing.imageUrl || ''}
                  onChange={(url) =>
                    patch({
                      imageUrl: url,
                      galleryUrls: normalizeGallery(editing.galleryUrls, url),
                    })
                  }
                  accept="image"
                  aspect="square"
                />
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant mb-2">گالری</p>
                {gallery.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant text-center py-8 border border-dashed border-outline-variant/40 rounded-xl">
                    هنوز تصویری در گالری نیست.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {gallery.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="relative group rounded-xl overflow-hidden border border-outline-variant/40 aspect-square"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end gap-1 p-1.5">
                          <button
                            type="button"
                            className="text-[9px] font-bold bg-white text-slate-800 rounded-lg py-1"
                            onClick={() => {
                              const nextGallery = gallery.filter((_, i) => i !== idx);
                              patch({
                                imageUrl: url,
                                galleryUrls: normalizeGallery(
                                  [editing.imageUrl || '', ...nextGallery].filter(Boolean),
                                  url
                                ),
                              });
                            }}
                          >
                            کاور
                          </button>
                          <button
                            type="button"
                            className="text-[9px] font-bold bg-rose-600 text-white rounded-lg py-1"
                            onClick={() => patchGallery(gallery.filter((_, i) => i !== idx))}
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {section === 'pricing' && !isVariable && (
            <SectionCard title="قیمت و موجودی" icon="sell" hint="برای محصول ساده">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">قیمت (تومان)</span>
                  <input
                    type="number"
                    min={0}
                    className={fieldCls}
                    value={editing.price}
                    onChange={(e) => patch({ price: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    موجودی (خالی = نامحدود)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className={fieldCls}
                    value={editing.stock ?? ''}
                    placeholder="نامحدود"
                    onChange={(e) => {
                      const v = e.target.value;
                      patch({
                        stock: v === '' ? null : Math.max(0, Math.floor(Number(v) || 0)),
                      });
                    }}
                  />
                </label>
                {editing.type === 'digital' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant">
                        لینک فایل دیجیتال
                      </span>
                      <input
                        className={fieldCls}
                        dir="ltr"
                        value={editing.digitalFileUrl || ''}
                        onChange={(e) => patch({ digitalFileUrl: e.target.value })}
                        placeholder="/uploads/file.pdf"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-primary cursor-pointer">
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      {uploadingFile ? 'در حال آپلود…' : 'آپلود فایل'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.zip,.epub,.doc,.docx,.txt,.rtf,.mp3,.wav"
                        disabled={uploadingFile}
                        onChange={(e) =>
                          void handleDigitalUpload(e.target.files?.[0] || null, 'product')
                        }
                      />
                    </label>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {section === 'variations' && isVariable && (
            <SectionCard
              title="ویژگی‌های محصول"
              icon="tune"
              hint="هر ویژگی قیمت، توضیح و تصویر جداگانه دارد"
              actions={
                <button
                  type="button"
                  onClick={addVariation}
                  className="px-3 py-1.5 text-[11px] font-bold bg-primary text-white rounded-xl flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  ویژگی جدید
                </button>
              }
            >
              {(editing.variations || []).length === 0 ? (
                <p className="text-[11px] text-on-surface-variant text-center py-8">
                  هنوز ویژگی‌ای تعریف نشده است.
                </p>
              ) : (
                <div className="space-y-3">
                  {(editing.variations || []).map((v, idx) => {
                    const open = expandedVarId === v.id;
                    return (
                      <div
                        key={v.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-surface-container-low/50 text-right"
                          onClick={() => setExpandedVarId(open ? null : v.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container shrink-0">
                              {v.imageUrl ? (
                                <img
                                  src={v.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                  <span className="material-symbols-outlined text-base">
                                    label
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black truncate">
                                {v.name || `ویژگی ${idx + 1}`}
                              </div>
                              <div className="text-[10px] text-primary font-bold mt-0.5">
                                {formatShopPrice(v.price)}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                              open ? 'rotate-180' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </button>
                        {open && (
                          <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <label className="block space-y-1">
                                <span className="text-[11px] font-bold text-on-surface-variant">
                                  نام ویژگی
                                </span>
                                <input
                                  className={fieldCls}
                                  value={v.name}
                                  onChange={(e) =>
                                    updateVariation(v.id, { name: e.target.value })
                                  }
                                  placeholder="مثلاً سایز بزرگ / پکیج طلایی"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[11px] font-bold text-on-surface-variant">
                                  قیمت (تومان)
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  className={fieldCls}
                                  value={v.price}
                                  onChange={(e) =>
                                    updateVariation(v.id, {
                                      price: Number(e.target.value) || 0,
                                    })
                                  }
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[11px] font-bold text-on-surface-variant">
                                  موجودی (خالی = نامحدود)
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  className={fieldCls}
                                  value={v.stock ?? ''}
                                  placeholder="نامحدود"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateVariation(v.id, {
                                      stock:
                                        val === ''
                                          ? null
                                          : Math.max(0, Math.floor(Number(val) || 0)),
                                    });
                                  }}
                                />
                              </label>
                              <div className="md:col-span-2 max-w-xs">
                                <MediaField
                                  label="تصویر این ویژگی"
                                  value={v.imageUrl || ''}
                                  onChange={(url) => updateVariation(v.id, { imageUrl: url })}
                                  accept="image"
                                  aspect="square"
                                  compact
                                />
                              </div>
                              {editing.type === 'digital' && (
                                <div className="md:col-span-2 space-y-2">
                                  <label className="block space-y-1">
                                    <span className="text-[11px] font-bold text-on-surface-variant">
                                      فایل دیجیتال این ویژگی
                                    </span>
                                    <input
                                      className={fieldCls}
                                      dir="ltr"
                                      value={v.digitalFileUrl || ''}
                                      onChange={(e) =>
                                        updateVariation(v.id, {
                                          digitalFileUrl: e.target.value,
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="inline-flex items-center gap-2 text-xs font-bold text-primary cursor-pointer">
                                    <span className="material-symbols-outlined text-base">
                                      upload_file
                                    </span>
                                    آپلود فایل
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.zip,.epub,.doc,.docx,.txt,.rtf,.mp3,.wav"
                                      disabled={uploadingFile}
                                      onChange={(e) =>
                                        void handleDigitalUpload(
                                          e.target.files?.[0] || null,
                                          v.id
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                              )}
                              <div className="md:col-span-2 space-y-1">
                                <span className="text-[11px] font-bold text-on-surface-variant block">
                                  توضیحات این ویژگی
                                </span>
                                <RichTextEditor
                                  value={v.description || ''}
                                  onChange={(html) =>
                                    updateVariation(v.id, { description: html })
                                  }
                                  compact
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeVariation(v.id)}
                                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                حذف این ویژگی
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {section === 'description' && (
            <SectionCard
              title="توضیحات محصول"
              icon="article"
              hint="ویرایشگر متن غنی — برای محصول متغیر می‌توانید توضیح جدا هم روی هر ویژگی بگذارید"
            >
              <RichTextEditor
                value={editing.description || ''}
                onChange={(html) => patch({ description: html })}
              />
            </SectionCard>
          )}

          <MediaPicker
            open={galleryPickerOpen}
            onClose={() => setGalleryPickerOpen(false)}
            multiple
            accept="image"
            title="افزودن تصاویر به گالری"
            onSelectMany={(urls) => {
              patchGallery([...gallery, ...urls]);
              setGalleryPickerOpen(false);
            }}
          />
        </div>
      )}

      {previewOpen &&
        editing &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setPreviewOpen(false)}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  <h3 className="text-sm font-black">پیش‌نمایش محصول</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-5 md:p-7">
                <ShopProductPreview product={editing} compact />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
