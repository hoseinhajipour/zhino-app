import type { ShopCartItem } from '../types';

const CART_KEY = 'zhino_shop_cart';
export const SHOP_CART_EVENT = 'zhino-shop-cart-change';

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SHOP_CART_EVENT));
}

function cartKey(item: Pick<ShopCartItem, 'productId' | 'variationId'>): string {
  return `${item.productId}::${item.variationId || ''}`;
}

export function getShopCart(): ShopCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.productId === 'string' && Number(i.qty) > 0)
      .map((i) => ({
        productId: String(i.productId),
        variationId: i.variationId ? String(i.variationId) : undefined,
        qty: Math.max(1, Math.floor(Number(i.qty) || 1)),
      }));
  } catch {
    return [];
  }
}

export function setShopCart(items: ShopCartItem[]) {
  if (typeof window === 'undefined') return;
  const cleaned = items
    .filter((i) => i.productId && i.qty > 0)
    .map((i) => ({
      productId: i.productId,
      variationId: i.variationId || undefined,
      qty: Math.max(1, Math.floor(i.qty)),
    }));
  localStorage.setItem(CART_KEY, JSON.stringify(cleaned));
  emitChange();
}

export function addToShopCart(productId: string, qty = 1, variationId?: string) {
  const cart = getShopCart();
  const key = cartKey({ productId, variationId });
  const existing = cart.find((i) => cartKey(i) === key);
  if (existing) {
    existing.qty += Math.max(1, Math.floor(qty));
  } else {
    cart.push({
      productId,
      variationId: variationId || undefined,
      qty: Math.max(1, Math.floor(qty)),
    });
  }
  setShopCart(cart);
}

export function updateShopCartQty(productId: string, qty: number, variationId?: string) {
  if (qty <= 0) {
    removeFromShopCart(productId, variationId);
    return;
  }
  const key = cartKey({ productId, variationId });
  const cart = getShopCart().map((i) =>
    cartKey(i) === key ? { ...i, qty: Math.max(1, Math.floor(qty)) } : i
  );
  setShopCart(cart);
}

export function removeFromShopCart(productId: string, variationId?: string) {
  const key = cartKey({ productId, variationId });
  setShopCart(getShopCart().filter((i) => cartKey(i) !== key));
}

export function clearShopCart() {
  setShopCart([]);
}

export function getShopCartCount(): number {
  return getShopCart().reduce((sum, i) => sum + i.qty, 0);
}

export function subscribeShopCart(callback: (items: ShopCartItem[]) => void): () => void {
  const notify = () => callback(getShopCart());
  notify();
  window.addEventListener(SHOP_CART_EVENT, notify);
  window.addEventListener('storage', notify);
  return () => {
    window.removeEventListener(SHOP_CART_EVENT, notify);
    window.removeEventListener('storage', notify);
  };
}
