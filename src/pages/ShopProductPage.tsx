import React, { useEffect, useMemo, useState } from 'react';
import type { PageScreen, ShopProduct } from '../types';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import {
  formatPriceRange,
  formatShopPrice,
  getEffectivePrice,
  getEffectiveStock,
  getProductImages,
  getProductVariations,
  isRichHtml,
  isVariableProduct,
  SHOP_PRODUCT_TYPE_LABELS,
} from '../lib/shopDefaults';
import { subscribeProducts } from '../lib/dbService';
import { addToShopCart } from '../lib/shopCart';

interface ShopProductPageProps {
  slug: string;
  onNavigate: (screen: PageScreen) => void;
  onBackToShop: () => void;
  onGoToCart: () => void;
}

export const ShopProductPage: React.FC<ShopProductPageProps> = ({
  slug,
  onNavigate,
  onBackToShop,
  onGoToCart,
}) => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeProducts(setProducts);
  }, []);

  const product = useMemo(
    () => products.find((p) => p.slug === slug && p.status === 'published') || null,
    [products, slug]
  );

  const variable = product ? isVariableProduct(product) : false;
  const variations = product ? getProductVariations(product) : [];
  const selectedVar = variations.find((v) => v.id === selectedVarId) || null;

  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setQty(1);
    setError(null);
    if (isVariableProduct(product)) {
      const first = getProductVariations(product)[0];
      setSelectedVarId(first?.id || '');
    } else {
      setSelectedVarId('');
    }
  }, [product?.id]);

  const images = useMemo(
    () => (product ? getProductImages(product, selectedVar) : []),
    [product, selectedVar]
  );

  useEffect(() => {
    setActiveImage(0);
  }, [selectedVarId]);

  if (products.length > 0 && !product) {
    return (
      <div className={`${SITE_CONTAINER_CLASS} py-16 text-center`}>
        <p className="text-sm font-bold text-on-surface-variant">محصول یافت نشد.</p>
        <button
          type="button"
          onClick={onBackToShop}
          className="mt-4 text-xs font-bold text-primary hover:underline"
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`${SITE_CONTAINER_CLASS} py-16 text-center text-sm text-on-surface-variant`}>
        در حال بارگذاری…
      </div>
    );
  }

  const price = getEffectivePrice(product, selectedVarId || null);
  const stock = getEffectiveStock(product, selectedVarId || null);
  const outOfStock = stock != null && stock <= 0;
  const maxQty = stock == null ? 99 : Math.max(1, stock);
  const currentSrc = images[activeImage] || images[0];
  const descHtml =
    (selectedVar?.description && selectedVar.description.trim()) || product.description || '';

  const handleAdd = () => {
    setError(null);
    if (variable && !selectedVarId) {
      setError('لطفاً یک ویژگی را انتخاب کنید');
      return;
    }
    if (outOfStock) return;
    addToShopCart(product.id, qty, selectedVarId || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className={`${SITE_CONTAINER_CLASS} pb-16`}>
      <button
        type="button"
        onClick={onBackToShop}
        className="text-xs font-bold text-on-surface-variant hover:text-primary flex items-center gap-1 mb-6"
      >
        <span className="material-symbols-outlined text-base">arrow_forward</span>
        بازگشت به فروشگاه
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-3">
          <div className="rounded-3xl overflow-hidden border border-outline-variant/30 bg-surface-container aspect-square relative">
            {currentSrc ? (
              <img src={currentSrc} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl opacity-30">inventory_2</span>
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="تصویر قبلی"
                  className="absolute top-1/2 start-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 shadow border border-outline-variant/30 flex items-center justify-center"
                  onClick={() =>
                    setActiveImage((i) => (i <= 0 ? images.length - 1 : i - 1))
                  }
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
                <button
                  type="button"
                  aria-label="تصویر بعدی"
                  className="absolute top-1/2 end-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 shadow border border-outline-variant/30 flex items-center justify-center"
                  onClick={() =>
                    setActiveImage((i) => (i >= images.length - 1 ? 0 : i + 1))
                  }
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === activeImage
                      ? 'border-primary shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {SHOP_PRODUCT_TYPE_LABELS[product.type]}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface mt-3">{product.name}</h1>
            <p className="text-xl font-black text-primary mt-3">
              {variable && !selectedVar ? formatPriceRange(product) : formatShopPrice(price)}
            </p>
          </div>

          {variable && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-on-surface-variant">انتخاب ویژگی</p>
              <div className="flex flex-wrap gap-2">
                {variations.map((v) => {
                  const vStock = getEffectiveStock(product, v.id);
                  const disabled = vStock != null && vStock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedVarId(v.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 ${
                        selectedVarId === v.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      {v.name}
                      <span className="block text-[10px] font-bold mt-0.5 opacity-80">
                        {formatShopPrice(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {descHtml ? (
            isRichHtml(descHtml) ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-on-surface leading-relaxed"
                dangerouslySetInnerHTML={{ __html: descHtml }}
              />
            ) : (
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {descHtml}
              </p>
            )
          ) : null}

          {product.type === 'physical' && product.weightGrams != null && !variable && (
            <p className="text-xs text-on-surface-variant">
              وزن تقریبی: {product.weightGrams.toLocaleString('fa-IR')} گرم
            </p>
          )}

          {product.type === 'digital' && (
            <p className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">download</span>
              پس از تأیید پرداخت توسط ادمین، لینک دانلود در دسترس قرار می‌گیرد.
            </p>
          )}

          {!outOfStock ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center border border-outline-variant/40 rounded-xl overflow-hidden">
                <button
                  type="button"
                  className="px-3 py-2 hover:bg-surface-container"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm font-bold min-w-[3rem] text-center">
                  {qty.toLocaleString('fa-IR')}
                </span>
                <button
                  type="button"
                  className="px-3 py-2 hover:bg-surface-container"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                افزودن به سبد
              </button>
              <button
                type="button"
                onClick={onGoToCart}
                className="px-4 py-3 text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5"
              >
                مشاهده سبد
              </button>
            </div>
          ) : (
            <p className="text-sm font-bold text-rose-600">این محصول فعلاً موجود نیست.</p>
          )}

          {error && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}

          {added && (
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              به سبد اضافه شد
              {selectedVar ? ` (${selectedVar.name})` : ''}.
            </p>
          )}

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-[11px] text-on-surface-variant hover:text-primary"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    </div>
  );
};
