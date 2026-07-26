export type ZarinpalConfig = {
  merchantId: string;
  isSandbox?: boolean;
};

function apiBase(isSandbox?: boolean) {
  return isSandbox
    ? 'https://sandbox.zarinpal.com/pg/v4/payment'
    : 'https://payment.zarinpal.com/pg/v4/payment';
}

function startPayBase(isSandbox?: boolean) {
  return isSandbox
    ? 'https://sandbox.zarinpal.com/pg/StartPay'
    : 'https://www.zarinpal.com/pg/StartPay';
}

export async function zarinpalRequestPayment(input: {
  config: ZarinpalConfig;
  /** Amount in toman */
  amountToman: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
}): Promise<{ authority: string; paymentUrl: string }> {
  const merchant_id = input.config.merchantId?.trim();
  if (!merchant_id) throw new Error('ZarinPal merchant ID is missing');
  const amount = Math.round(input.amountToman);
  if (amount < 1000) throw new Error('Minimum ZarinPal amount is 1000 toman');

  const res = await fetch(`${apiBase(input.config.isSandbox)}/request.json`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      merchant_id,
      amount,
      currency: 'IRT',
      description: input.description.slice(0, 255),
      callback_url: input.callbackUrl,
      metadata: {
        mobile: input.mobile || undefined,
        email: input.email || undefined,
      },
    }),
  });

  const json = (await res.json()) as {
    data?: { code?: number; authority?: string; message?: string };
    errors?: unknown;
  };

  const code = json?.data?.code;
  const authority = json?.data?.authority;
  if ((code !== 100 && code !== 101) || !authority) {
    const errMsg =
      typeof json?.errors === 'object' && json.errors
        ? JSON.stringify(json.errors)
        : json?.data?.message || `ZarinPal request failed (code ${code ?? 'unknown'})`;
    throw new Error(errMsg);
  }

  return {
    authority,
    paymentUrl: `${startPayBase(input.config.isSandbox)}/${authority}`,
  };
}

export async function zarinpalVerifyPayment(input: {
  config: ZarinpalConfig;
  amountToman: number;
  authority: string;
}): Promise<{ refId: string; cardPan?: string }> {
  const merchant_id = input.config.merchantId?.trim();
  if (!merchant_id) throw new Error('ZarinPal merchant ID is missing');

  const res = await fetch(`${apiBase(input.config.isSandbox)}/verify.json`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      merchant_id,
      amount: Math.round(input.amountToman),
      authority: input.authority,
    }),
  });

  const json = (await res.json()) as {
    data?: { code?: number; ref_id?: number | string; card_pan?: string; message?: string };
    errors?: unknown;
  };

  const code = json?.data?.code;
  if (code !== 100 && code !== 101) {
    const errMsg =
      typeof json?.errors === 'object' && json.errors
        ? JSON.stringify(json.errors)
        : json?.data?.message || `ZarinPal verify failed (code ${code ?? 'unknown'})`;
    throw new Error(errMsg);
  }

  return {
    refId: String(json.data?.ref_id ?? ''),
    cardPan: json.data?.card_pan,
  };
}
