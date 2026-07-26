import { Router, Request, Response } from 'express';
import { getEntity, listEntities, upsertEntity } from '../db';
import { zarinpalRequestPayment, zarinpalVerifyPayment } from '../lib/zarinpal';
import {
  MELLAT_START_PAY_URL,
  mellatPayRequest,
  mellatSettleRequest,
  mellatVerifyRequest,
} from '../lib/mellat';

type ShopOrderPayload = {
  id: string;
  orderNumber?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAuthority?: string;
  paymentRefId?: string;
  mellatOrderId?: number;
  total?: number;
  customer?: { name?: string; mobile?: string; email?: string };
  updatedAt?: string;
  [key: string]: unknown;
};

type ClinicSettingsPayload = {
  modules?: { shop?: { enabled?: boolean } };
  shop?: {
    paymentMethods?: { zarinpal?: boolean; mellat?: boolean };
  };
  zarinpal?: {
    enabled?: boolean;
    isSandbox?: boolean;
    merchantId?: string;
  };
  mellat?: {
    enabled?: boolean;
    terminalId?: string;
    username?: string;
    password?: string;
    callbackUrl?: string;
  };
};

async function loadSettings(): Promise<ClinicSettingsPayload> {
  return ((await getEntity('settings', 'clinic_settings')) || {}) as ClinicSettingsPayload;
}

async function isShopEnabled(settings: ClinicSettingsPayload): Promise<boolean> {
  return settings?.modules?.shop?.enabled === true;
}

function publicBaseUrl(req: Request, bodyBase?: string): string {
  if (bodyBase && /^https?:\/\//i.test(bodyBase)) return bodyBase.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`.replace(/\/$/, '');
}

function redirectHtml(url: string): string {
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${url}"/><title>در حال انتقال…</title></head><body style="font-family:tahoma;text-align:center;padding:40px">در حال انتقال به نتیجه پرداخت… <a href="${url}">ادامه</a></body></html>`;
}

export const shopPaymentRouter = Router();

/**
 * Start online payment for an order.
 * Body: { order, gateway: 'zarinpal'|'mellat', returnBaseUrl? }
 */
shopPaymentRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const settings = await loadSettings();
    if (!(await isShopEnabled(settings))) {
      res.status(403).json({ error: 'Shop module is disabled' });
      return;
    }

    const gateway = String(req.body?.gateway || '') as 'zarinpal' | 'mellat';
    const order = req.body?.order as ShopOrderPayload | undefined;
    if (!order?.id || !order.total || order.total <= 0) {
      res.status(400).json({ error: 'Valid order with total is required' });
      return;
    }
    if (gateway !== 'zarinpal' && gateway !== 'mellat') {
      res.status(400).json({ error: 'Unsupported gateway' });
      return;
    }

    const pm = settings.shop?.paymentMethods;
    if (gateway === 'zarinpal' && pm?.zarinpal !== true) {
      res.status(400).json({ error: 'ZarinPal is not enabled for shop' });
      return;
    }
    if (gateway === 'mellat' && pm?.mellat !== true) {
      res.status(400).json({ error: 'Mellat is not enabled for shop' });
      return;
    }

    const base = publicBaseUrl(req, req.body?.returnBaseUrl);
    const now = new Date().toISOString();
    let saved: ShopOrderPayload = {
      ...order,
      paymentMethod: gateway,
      paymentStatus: 'awaiting',
      status: order.status || 'pending',
      updatedAt: now,
    };

    if (gateway === 'zarinpal') {
      const zp = settings.zarinpal;
      if (!zp?.merchantId) {
        res.status(400).json({ error: 'ZarinPal merchant ID is not configured' });
        return;
      }
      const callbackUrl = `${base}/payment-callback?gateway=zarinpal&orderId=${encodeURIComponent(order.id)}`;
      const { authority, paymentUrl } = await zarinpalRequestPayment({
        config: { merchantId: zp.merchantId, isSandbox: zp.isSandbox },
        amountToman: Number(order.total),
        description: `سفارش ${order.orderNumber || order.id}`,
        callbackUrl,
        mobile: order.customer?.mobile,
        email: order.customer?.email,
      });
      saved = {
        ...saved,
        paymentAuthority: authority,
      };
      await upsertEntity('orders', saved.id, saved);
      res.json({ ok: true, gateway: 'zarinpal', paymentUrl, authority, orderId: saved.id });
      return;
    }

    // Mellat
    const mellat = settings.mellat;
    if (!mellat?.terminalId || !mellat.username || !mellat.password) {
      res.status(400).json({ error: 'Mellat credentials are not configured' });
      return;
    }
    const mellatOrderId = Number(String(Date.now()).slice(-12));
    const callbackUrl =
      (mellat.callbackUrl && mellat.callbackUrl.trim()) ||
      `${base}/api/shop/payment/callback/mellat`;
    const { refId } = await mellatPayRequest({
      config: {
        terminalId: mellat.terminalId,
        username: mellat.username,
        password: mellat.password,
      },
      orderId: mellatOrderId,
      amountToman: Number(order.total),
      callbackUrl,
    });
    saved = {
      ...saved,
      paymentAuthority: refId,
      mellatOrderId,
    };
    await upsertEntity('orders', saved.id, saved);
    res.json({
      ok: true,
      gateway: 'mellat',
      type: 'mellat_form',
      gatewayUrl: MELLAT_START_PAY_URL,
      refId,
      orderId: saved.id,
    });
  } catch (err) {
    console.error('POST /shop/payment/start error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to start payment',
    });
  }
});

/** Verify ZarinPal after user returns to /payment-callback */
shopPaymentRouter.post('/verify/zarinpal', async (req: Request, res: Response) => {
  try {
    const settings = await loadSettings();
    const authority = String(req.body?.authority || req.query.Authority || '');
    const status = String(req.body?.status || req.query.Status || '');
    const orderId = String(req.body?.orderId || req.query.orderId || '');
    if (!orderId || !authority) {
      res.status(400).json({ error: 'orderId and authority are required' });
      return;
    }

    const order = (await getEntity('orders', orderId)) as ShopOrderPayload | null;
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.json({
        ok: true,
        alreadyPaid: true,
        order,
        refId: order.paymentRefId,
      });
      return;
    }

    if (status && status.toUpperCase() !== 'OK') {
      const failed = {
        ...order,
        paymentStatus: 'failed',
        updatedAt: new Date().toISOString(),
      };
      await upsertEntity('orders', orderId, failed);
      res.json({ ok: false, error: 'Payment cancelled or failed', order: failed });
      return;
    }

    const zp = settings.zarinpal;
    if (!zp?.merchantId) {
      res.status(400).json({ error: 'ZarinPal is not configured' });
      return;
    }

    const verified = await zarinpalVerifyPayment({
      config: { merchantId: zp.merchantId, isSandbox: zp.isSandbox },
      amountToman: Number(order.total),
      authority,
    });

    const paid = {
      ...order,
      status: 'paid',
      paymentStatus: 'paid',
      paymentAuthority: authority,
      paymentRefId: verified.refId,
      updatedAt: new Date().toISOString(),
    };
    await upsertEntity('orders', orderId, paid);
    res.json({ ok: true, order: paid, refId: verified.refId, cardPan: verified.cardPan });
  } catch (err) {
    console.error('POST /shop/payment/verify/zarinpal error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Verify failed',
    });
  }
});

/** Bank Mellat posts here after payment */
shopPaymentRouter.post('/callback/mellat', async (req: Request, res: Response) => {
  const base = publicBaseUrl(req);
  const body = req.body || {};
  const resCode = String(body.ResCode ?? body.resCode ?? '');
  const refId = String(body.RefId ?? body.refId ?? '');
  const saleOrderId = Number(body.SaleOrderId ?? body.saleOrderId ?? 0);
  const saleReferenceId = Number(body.SaleReferenceId ?? body.saleReferenceId ?? 0);
  const orderIdParam = String(body.orderId || '');

  try {
    const settings = await loadSettings();
    const mellat = settings.mellat;
    if (!mellat?.terminalId || !mellat.username || !mellat.password) {
      res.status(400).send(redirectHtml(`${base}/payment-callback?gateway=mellat&ok=0&error=config`));
      return;
    }

    // Find order by mellatOrderId or paymentAuthority (RefId)
    const orders = (await listEntities('orders')) as ShopOrderPayload[];
    let order =
      orders.find((o) => o.mellatOrderId && Number(o.mellatOrderId) === saleOrderId) ||
      orders.find((o) => o.paymentAuthority && o.paymentAuthority === refId) ||
      (orderIdParam ? ((await getEntity('orders', orderIdParam)) as ShopOrderPayload | null) : null);

    if (!order) {
      res
        .status(404)
        .send(redirectHtml(`${base}/payment-callback?gateway=mellat&ok=0&error=order_not_found`));
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.send(
        redirectHtml(
          `${base}/payment-callback?gateway=mellat&ok=1&orderId=${encodeURIComponent(order.id)}&refId=${encodeURIComponent(String(order.paymentRefId || saleReferenceId))}`
        )
      );
      return;
    }

    if (resCode !== '0') {
      const failed = {
        ...order,
        paymentStatus: 'failed',
        updatedAt: new Date().toISOString(),
      };
      await upsertEntity('orders', order.id, failed);
      res.send(
        redirectHtml(
          `${base}/payment-callback?gateway=mellat&ok=0&orderId=${encodeURIComponent(order.id)}&error=res_${resCode}`
        )
      );
      return;
    }

    const config = {
      terminalId: mellat.terminalId,
      username: mellat.username,
      password: mellat.password,
    };
    const oid = Number(order.mellatOrderId || saleOrderId);
    await mellatVerifyRequest({
      config,
      orderId: oid,
      saleOrderId,
      saleReferenceId,
    });
    try {
      await mellatSettleRequest({
        config,
        orderId: oid,
        saleOrderId,
        saleReferenceId,
      });
    } catch (settleErr) {
      console.warn('Mellat settle warning:', settleErr);
    }

    const paid = {
      ...order,
      status: 'paid',
      paymentStatus: 'paid',
      paymentRefId: String(saleReferenceId),
      paymentAuthority: refId || order.paymentAuthority,
      updatedAt: new Date().toISOString(),
    };
    await upsertEntity('orders', order.id, paid);
    res.send(
      redirectHtml(
        `${base}/payment-callback?gateway=mellat&ok=1&orderId=${encodeURIComponent(order.id)}&refId=${encodeURIComponent(String(saleReferenceId))}`
      )
    );
  } catch (err) {
    console.error('Mellat callback error:', err);
    res
      .status(500)
      .send(
        redirectHtml(
          `${base}/payment-callback?gateway=mellat&ok=0&error=verify_failed`
        )
      );
  }
});

/** Fetch order for confirmation page */
shopPaymentRouter.get('/order/:id', async (req: Request, res: Response) => {
  try {
    const order = await getEntity('orders', req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load order' });
  }
});
