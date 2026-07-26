import React, { useEffect, useMemo, useState } from 'react';
import type { ShopProduct, ShopProductCategory } from '../../types';
import {
  deleteProductCategory,
  saveProduct,
  saveProductCategory,
  subscribeProductCategories,
  subscribeProducts,
} from '../../lib/dbService';
import { slugifyShopCategoryName } from '../../lib/shopSettingsDefaults';

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

export const ShopProductCategoriesPanel: React.FC = () => {
  const [categories, setCategories] = useState<ShopProductCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const u1 = subscribeProductCategories(setCategories);
    const u2 = subscribeProducts(setProducts);
    return () => {
      u1();
      u2();
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'fa')
      ),
    [categories]
  );

  const productCount = (cat: ShopProductCategory) =>
    products.filter((p) => p.categoryId === cat.id || p.category === cat.name).length;

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const nextSlug = (slug.trim() || slugifyShopCategoryName(trimmed)).toLowerCase();
      const cat: ShopProductCategory = {
        id: `pcat-${Date.now().toString(36)}`,
        name: trimmed,
        slug: nextSlug,
        sortOrder: sorted.length ? Math.max(...sorted.map((c) => c.sortOrder ?? 0)) + 1 : 1,
        active: true,
      };
      await saveProductCategory(cat);
      setName('');
      setSlug('');
      showMsg('success', 'دسته‌بندی افزوده شد');
    } catch {
      showMsg('error', 'ذخیره دسته‌بندی ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const next: ShopProductCategory = {
        ...cat,
        name: trimmed,
        slug: (editSlug.trim() || slugifyShopCategoryName(trimmed)).toLowerCase(),
      };
      await saveProductCategory(next);
      // Sync display name on products that use this category
      for (const p of products) {
        if (p.categoryId === id && p.category !== trimmed) {
          await saveProduct({ ...p, category: trimmed, categoryId: id });
        }
      }
      setEditingId(null);
      showMsg('success', 'دسته‌بندی به‌روز شد');
    } catch {
      showMsg('error', 'ویرایش ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    const orderA = a.sortOrder ?? index + 1;
    const orderB = b.sortOrder ?? target + 1;
    setSaving(true);
    try {
      await saveProductCategory({ ...a, sortOrder: orderB });
      await saveProductCategory({ ...b, sortOrder: orderA });
    } catch {
      showMsg('error', 'جابه‌جایی ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: ShopProductCategory) => {
    try {
      await saveProductCategory({ ...cat, active: cat.active === false });
    } catch {
      showMsg('error', 'تغییر وضعیت ناموفق بود');
    }
  };

  const handleDelete = async (cat: ShopProductCategory) => {
    const count = productCount(cat);
    if (
      !window.confirm(
        count
          ? `دسته «${cat.name}» روی ${count} محصول است. حذف شود؟ (محصولات بدون دسته می‌مانند)`
          : `حذف دسته «${cat.name}»؟`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      if (count) {
        for (const p of products) {
          if (p.categoryId === cat.id || p.category === cat.name) {
            await saveProduct({ ...p, categoryId: '', category: '' });
          }
        }
      }
      await deleteProductCategory(cat.id);
      showMsg('success', 'دسته‌بندی حذف شد');
    } catch {
      showMsg('error', 'حذف ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {msg && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft p-5 space-y-4">
        <div>
          <h3 className="text-sm font-black text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            افزودن دسته‌بندی جدید
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-1">
            دسته‌ها در ویرایش محصول و فیلتر صفحه فروشگاه استفاده می‌شوند.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">نام دسته *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slug || slug === slugifyShopCategoryName(name)) {
                  setSlug(slugifyShopCategoryName(v));
                }
              }}
              placeholder="مثال: کتاب و محتوا"
              className={fieldCls}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">نامک (Slug)</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugifyShopCategoryName(e.target.value))}
              dir="ltr"
              className={`${fieldCls} font-mono text-left`}
            />
          </label>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void handleAdd()}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'ذخیره...' : 'افزودن دسته'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <h3 className="text-sm font-black text-on-surface">فهرست دسته‌بندی‌ها</h3>
          <span className="text-[11px] text-on-surface-variant font-bold">{sorted.length} مورد</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="p-3 font-bold">ترتیب</th>
                <th className="p-3 font-bold">نام</th>
                <th className="p-3 font-bold">Slug</th>
                <th className="p-3 font-bold">محصولات</th>
                <th className="p-3 font-bold">وضعیت</th>
                <th className="p-3 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className="border-t border-outline-variant/15 hover:bg-surface-container-low/40"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0 || saving}
                        onClick={() => void move(idx, -1)}
                        className="w-7 h-7 rounded-lg border border-outline-variant/30 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx >= sorted.length - 1 || saving}
                        onClick={() => void move(idx, 1)}
                        className="w-7 h-7 rounded-lg border border-outline-variant/30 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    {editingId === cat.id ? (
                      <input
                        className={fieldCls}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      <span className="font-bold text-on-surface">{cat.name}</span>
                    )}
                  </td>
                  <td className="p-3" dir="ltr">
                    {editingId === cat.id ? (
                      <input
                        className={`${fieldCls} font-mono text-left`}
                        value={editSlug}
                        onChange={(e) => setEditSlug(slugifyShopCategoryName(e.target.value))}
                      />
                    ) : (
                      <span className="font-mono text-on-surface-variant">{cat.slug}</span>
                    )}
                  </td>
                  <td className="p-3 font-bold">{productCount(cat)}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(cat)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                        cat.active === false
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {cat.active === false ? 'غیرفعال' : 'فعال'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {editingId === cat.id ? (
                        <>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleSaveEdit(cat.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-[10px] font-bold"
                          >
                            ذخیره
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
                          >
                            انصراف
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditName(cat.name);
                              setEditSlug(cat.slug);
                            }}
                            className="w-8 h-8 rounded-lg border border-outline-variant/30 flex items-center justify-center"
                            title="ویرایش"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(cat)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"
                            title="حذف"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!sorted.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    هنوز دسته‌بندی‌ای تعریف نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
