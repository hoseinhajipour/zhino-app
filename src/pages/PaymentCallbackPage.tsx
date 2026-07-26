import React, { useEffect, useState } from 'react';
import type { PageScreen, ShopOrder } from '../types';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import { formatShopPrice } from '../lib/shopDefaults';
import { fetchShopOrder, verifyZarinpalShopPayment } from '../lib/dbService';

interface PaymentCallbackPageProps {
  onNavigate: (screen: PageScreen) => void;
  onGoToShop: () => void;
  onOrderPaid: (order: ShopOrder) => void;
}

function readQuery(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export const PaymentCallbackPage: React.FC<PaymentCallbackPageProps> = ({
  onNavigate,
  onGoToShop,
  onOrderPaid,
}) => {
  const [phase, setPhase] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('در حال بررسی نتیجه پرداخت…');
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [refId, setRefId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const q = readQuery();
      const gateway = (q.get('gateway') || '').toLowerCase();
      const orderId = q.get('orderId') || '';

      try {
        if (gateway === 'zarinpal') {
          const authority = q.get('Authority') || q.get('authority') || '';
          const status = q.get('Status') || q.get('status') || '';
          if (!orderId || !authority) {
            throw new Error('پارامترهای بازگشت زرین‌پال ناقص است');
          }
          const result = await verifyZarinpalShopPayment({ orderId, authority, status });
          if (cancelled) return;
          if (result.ok && result.order) {
            setOrder(result.order);
            setRefId(result.refId || result.order.paymentRefId || '');
            setPhase('success');
            setMessage(
              result.alreadyPaid
                ? 'این پرداخت قبلاً تأیید شده بود.'
                : 'پرداخت با موفقیت تأیید شد.'
            );
            onOrderPaid(result.order);
            return;
          }
          if (result.order) setOrder(result.order);
          setPhase('failed');
          setMessage(result.error || 'پرداخت ناموفق بود یا توسط کاربر لغو شد.');
          return;
        }

        if (gateway === 'mellat') {
          const ok = q.get('ok') === '1';
          const err = q.get('error') || '';
          const rid = q.get('refId') || '';
          if (orderId) {
            const loaded = await fetchShopOrder(orderId);
            if (!cancelled && loaded) setOrder(loaded);
          }
          if (cancelled) return;
          if (ok) {
            setRefId(rid);
            setPhase('success');
            setMessage('پرداخت بانک ملت با موفقیت انجام شد.');
            if (orderId) {
              const loaded = await fetchShopOrder(orderId);
              if (loaded) {
                setOrder(loaded);
                onOrderPaid(loaded);
              }
            }
            return;
          }
          setPhase('failed');
          setMessage(
            err === 'order_not_found'
              ? 'سفارش متناظر یافت نشد.'
              : err === 'config'
                ? 'تنظیمات درگاه ملت ناقص است.'
                : 'پرداخت ناموفق بود یا تأیید نشد.'
          );
          return;
        }

        setPhase('failed');
        setMessage('درگاه بازگشت نامشخص است.');
      } catch (e) {
        if (cancelled) return;
        setPhase('failed');
        setMessage(e instanceof Error ? e.message : 'خطا در تأیید پرداخت');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`${SITE_CONTAINER_CLASS} pb-16 max-w-lg mx-auto`}>
      <div
        className={`rounded-3xl border p-8 text-center space-y-4 ${
          phase === 'success'
            ? 'border-emerald-200 bg-emerald-50/50'
            : phase === 'failed'
              ? 'border-rose-200 bg-rose-50/40'
              : 'border-outline-variant/40 bg-white dark:bg-slate-900'
        }`}
      >
        <span
          className={`material-symbols-outlined text-5xl ${
            phase === 'success'
              ? 'text-emerald-600'
              : phase === 'failed'
                ? 'text-rose-600'
                : 'text-primary animate-pulse'
          }`}
        >
          {phase === 'success' ? 'verified' : phase === 'failed' ? 'error' : 'sync'}
        </span>
        <h1 className="text-xl font-black text-on-surface">
          {phase === 'loading'
            ? 'بررسی پرداخت'
            : phase === 'success'
              ? 'پرداخت موفق'
              : 'پرداخت ناموفق'}
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        {order && (
          <div className="text-xs space-y-1 text-on-surface-variant">
            <p>
              شماره سفارش:{' '}
              <span className="font-black text-on-surface" dir="ltr">
                {order.orderNumber}
              </span>
            </p>
            <p>مبلغ: {formatShopPrice(order.total)}</p>
            {refId && (
              <p>
                کد پیگیری:{' '}
                <span className="font-mono font-bold" dir="ltr">
                  {refId}
                </span>
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {phase === 'success' && (
            <button
              type="button"
              onClick={() => onNavigate('order-confirmation')}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl"
            >
              جزئیات سفارش
            </button>
          )}
          <button
            type="button"
            onClick={onGoToShop}
            className="px-5 py-2.5 text-xs font-bold border border-outline-variant/40 rounded-xl"
          >
            فروشگاه
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 text-xs font-bold text-on-surface-variant"
          >
            خانه
          </button>
        </div>
      </div>
    </div>
  );
};
