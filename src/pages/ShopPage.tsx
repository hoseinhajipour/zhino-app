import React, { useEffect, useMemo, useState } from 'react';
import type { PageScreen, ShopProduct, ShopProductCategory, ShopSettings } from '../types';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import { formatPriceRange, getProductThumb, SHOP_PRODUCT_TYPE_LABELS } from '../lib/shopDefaults';
import {
  normalizeClinicSettings,
  subscribeClinicSettings,
  subscribeProductCategories,
  subscribeProducts,
} from '../lib/dbService';
import { mergeShopSettings } from '../lib/shopSettingsDefaults';

interface ShopPageProps {
  onNavigate: (screen: PageScreen) => void;
  onSelectProduct: (slug: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, onSelectProduct }) => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopProductCategory[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => mergeShopSettings());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const u1 = subscribeProducts(setProducts);
    const u2 = subscribeProductCategories(setCategories);
    const u3 = subscribeClinicSettings((data) => {
      setShopSettings(mergeShopSettings(normalizeClinicSettings(data).shop));
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const activeCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => c.active !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const published = useMemo(() => {
    return products
      .filter((p) => p.status === 'published')
      .filter((p) => {
        if (categoryFilter === 'all') return true;
        return p.categoryId === categoryFilter || p.category === categoryFilter;
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [products, categoryFilter]);

  return (
    <div className={`${SITE_CONTAINER_CLASS} pb-16`}>
      <div className="mb-8">
        <p className="text-xs font-bold text-primary mb-2">فروشگاه</p>
        <h1 className="text-2xl md:text-3xl font-black text-on-surface">{shopSettings.storeName}</h1>
        <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
          {shopSettings.storeDescription}
        </p>
      </div>

      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === 'all'
                ? 'bg-primary text-white shadow'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            همه
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-primary text-white shadow'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {published.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/50 p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-primary/40">storefront</span>
          <p className="mt-3 text-sm font-bold">
            {categoryFilter === 'all'
              ? 'هنوز محصولی منتشر نشده است.'
              : 'در این دسته محصولی یافت نشد.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="mt-4 text-xs font-bold text-primary hover:underline"
          >
            بازگشت به خانه
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {published.map((p) => {
            const thumb = getProductThumb(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProduct(p.slug)}
                className="text-right group rounded-3xl overflow-hidden border border-outline-variant/30 bg-white dark:bg-slate-900 hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-surface-container overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl opacity-40">
                        inventory_2
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {SHOP_PRODUCT_TYPE_LABELS[p.type]}
                    </span>
                    {p.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        {p.category}
                      </span>
                    )}
                    {p.stock != null && p.stock <= 0 && (
                      <span className="text-[10px] font-bold text-rose-600">ناموجود</span>
                    )}
                  </div>
                  <h2 className="text-sm font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                    {p.name}
                  </h2>
                  {shopSettings.showPrices && (
                    <p className="text-sm font-black text-primary">{formatPriceRange(p)}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
