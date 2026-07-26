import React, { useEffect, useMemo, useState } from 'react';
import type { PageScreen, ShopCartItem, ShopProduct, ShopSettings } from '../types';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import {
  findVariation,
  formatShopPrice,
  getEffectivePrice,
  getProductThumb,
} from '../lib/shopDefaults';
import {
  normalizeClinicSettings,
  subscribeClinicSettings,
  subscribeProducts,
} from '../lib/dbService';
import {
  clearShopCart,
  removeFromShopCart,
  subscribeShopCart,
  updateShopCartQty,
} from '../lib/shopCart';
import { mergeShopSettings } from '../lib/shopSettingsDefaults';

interface CartPageProps {
  onNavigate: (screen: PageScreen) => void;
  onGoToShop: () => void;
  onCheckout: () => void;
}

type Line = ShopCartItem & { product: ShopProduct };

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onGoToShop, onCheckout }) => {
  const [cart, setCart] = useState<ShopCartItem[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => mergeShopSettings());

  useEffect(() => {
    const u1 = subscribeShopCart(setCart);
    const u2 = subscribeProducts(setProducts);
    const u3 = subscribeClinicSettings((data) => {
      setShopSettings(mergeShopSettings(normalizeClinicSettings(data).shop));
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const lines: Line[] = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId && p.status === 'published');
        if (!product) return null;
        return { ...item, product };
      })
      .filter(Boolean) as Line[];
  }, [cart, products]);

  const total = lines.reduce(
    (sum, l) => sum + getEffectivePrice(l.product, l.variationId) * l.qty,
    0
  );

  return (
    <div className={`${SITE_CONTAINER_CLASS} pb-16`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-on-surface">سبد خرید</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {lines.length.toLocaleString('fa-IR')} محصول در سبد
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToShop}
          className="text-xs font-bold text-primary hover:underline"
        >
          ادامه خرید
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/50 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-primary/40">shopping_cart</span>
          <p className="mt-3 text-sm font-bold text-on-surface-variant">{shopSettings.emptyCartMessage}</p>
          <button
            type="button"
            onClick={onGoToShop}
            className="mt-4 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl"
          >
            مشاهده فروشگاه
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {lines.map((line) => {
              const variation = findVariation(line.product, line.variationId);
              const unit = getEffectivePrice(line.product, line.variationId);
              const thumb = getProductThumb(line.product, variation);
              const lineKey = `${line.productId}::${line.variationId || ''}`;
              return (
                <div
                  key={lineKey}
                  className="flex gap-4 p-4 rounded-2xl border border-outline-variant/30 bg-white dark:bg-slate-900"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-black truncate">{line.product.name}</h2>
                    {variation && (
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{variation.name}</p>
                    )}
                    <p className="text-xs text-primary font-bold mt-1">{formatShopPrice(unit)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center border border-outline-variant/40 rounded-lg overflow-hidden text-xs">
                        <button
                          type="button"
                          className="px-2 py-1"
                          onClick={() =>
                            updateShopCartQty(line.productId, line.qty - 1, line.variationId)
                          }
                        >
                          −
                        </button>
                        <span className="px-3 py-1 font-bold">
                          {line.qty.toLocaleString('fa-IR')}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-1"
                          onClick={() =>
                            updateShopCartQty(line.productId, line.qty + 1, line.variationId)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromShopCart(line.productId, line.variationId)}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-black shrink-0">
                    {formatShopPrice(unit * line.qty)}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => clearShopCart()}
              className="text-[11px] font-bold text-on-surface-variant hover:text-rose-600"
            >
              خالی کردن سبد
            </button>
          </div>

          <div className="rounded-3xl border border-outline-variant/30 bg-white dark:bg-slate-900 p-5 h-fit space-y-4">
            <h3 className="text-sm font-black">خلاصه سفارش</h3>
            <div className="flex justify-between text-sm font-bold">
              <span>جمع کل</span>
              <span className="text-primary">{formatShopPrice(total)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl shadow"
            >
              ادامه تسویه حساب
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full text-[11px] font-bold text-on-surface-variant hover:text-primary"
            >
              بازگشت به خانه
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
