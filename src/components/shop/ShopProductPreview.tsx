import React, { useEffect, useMemo, useState } from 'react';
import type { ShopProduct } from '../../types';
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
} from '../../lib/shopDefaults';

interface ShopProductPreviewProps {
  product: ShopProduct;
  /** Compact for admin modal */
  compact?: boolean;
}

export const ShopProductPreview: React.FC<ShopProductPreviewProps> = ({
  product,
  compact = false,
}) => {
  const variations = getProductVariations(product);
  const variable = isVariableProduct(product);
  const [selectedVarId, setSelectedVarId] = useState(
    () => variations[0]?.id || ''
  );
  const selectedVar = variations.find((v) => v.id === selectedVarId) || null;
  const images = useMemo(
    () => getProductImages(product, selectedVar),
    [product, selectedVar]
  );
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedVarId, product.id]);

  useEffect(() => {
    if (variable && variations.length && !variations.some((v) => v.id === selectedVarId)) {
      setSelectedVarId(variations[0].id);
    }
  }, [variable, variations, selectedVarId]);

  const price = variable
    ? selectedVar
      ? selectedVar.price
      : getEffectivePrice(product)
    : product.price;
  const stock = getEffectiveStock(product, selectedVarId);
  const outOfStock = stock != null && stock <= 0;
  const descHtml =
    (selectedVar?.description && selectedVar.description.trim()) ||
    product.description ||
    '';
  const currentSrc = images[activeImage] || images[0];

  return (
    <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-2 gap-5' : 'lg:grid-cols-2 gap-8'}`}>
      <div className="space-y-3">
        <div
          className={`rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container relative ${
            compact ? 'aspect-square max-h-[320px]' : 'aspect-square'
          }`}
        >
          {currentSrc ? (
            <img src={currentSrc} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant min-h-[200px]">
              <span className="material-symbols-outlined text-5xl opacity-30">inventory_2</span>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${
                  idx === activeImage ? 'border-primary' : 'border-transparent opacity-70'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 text-right">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {SHOP_PRODUCT_TYPE_LABELS[product.type]}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              product.status === 'published'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            {product.status === 'published' ? 'منتشر شده' : 'پیش‌نمایش پیش‌نویس'}
          </span>
        </div>
        <h2 className={`font-black text-on-surface ${compact ? 'text-xl' : 'text-2xl'}`}>
          {product.name || 'بدون نام'}
        </h2>
        <p className="text-lg font-black text-primary">
          {variable && !selectedVar ? formatPriceRange(product) : formatShopPrice(price)}
        </p>

        {variable && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-on-surface-variant">انتخاب ویژگی</p>
            <div className="flex flex-wrap gap-2">
              {variations.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVarId(v.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedVarId === v.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {outOfStock ? (
          <p className="text-xs font-bold text-rose-600">ناموجود</p>
        ) : stock != null ? (
          <p className="text-[11px] text-on-surface-variant">
            موجودی: {stock.toLocaleString('fa-IR')}
          </p>
        ) : null}

        {descHtml ? (
          isRichHtml(descHtml) ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-on-surface text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: descHtml }}
            />
          ) : (
            <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{descHtml}</p>
          )
        ) : (
          <p className="text-xs text-on-surface-variant">توضیحاتی ثبت نشده است.</p>
        )}
      </div>
    </div>
  );
};
