export type MellatConfig = {
  terminalId: string;
  username: string;
  password: string;
};

const WSDL_URL = 'https://bpm.shaparak.ir/pgwchannel/services/pgw';
export const MELLAT_START_PAY_URL = 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat';

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function soapEnvelope(bodyInner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:int="http://interfaces.core.sw.bps.com/">
  <soapenv:Header/>
  <soapenv:Body>
    ${bodyInner}
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function callMellatSoap(action: string, bodyInner: string): Promise<string> {
  const res = await fetch(WSDL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
    },
    body: soapEnvelope(bodyInner),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Mellat SOAP ${action} HTTP ${res.status}`);
  }
  return text;
}

function extractReturn(xml: string): string {
  const match =
    xml.match(/<return[^>]*>([\s\S]*?)<\/return>/i) ||
    xml.match(/<ns:?return[^>]*>([\s\S]*?)<\/ns:?return>/i);
  if (!match?.[1]) throw new Error('Mellat: empty SOAP return');
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

/** Convert toman (UI) to rials for Mellat */
export function tomanToRials(toman: number): number {
  return Math.round(Number(toman) || 0) * 10;
}

export async function mellatPayRequest(input: {
  config: MellatConfig;
  orderId: number;
  amountToman: number;
  callbackUrl: string;
  payerId?: string;
}): Promise<{ refId: string }> {
  const { config } = input;
  if (!config.terminalId || !config.username || !config.password) {
    throw new Error('Mellat credentials are incomplete');
  }
  const amount = tomanToRials(input.amountToman);
  if (amount < 10000) throw new Error('Minimum Mellat amount is 1000 toman');

  const localDate = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localDateStr = `${localDate.getFullYear()}${pad(localDate.getMonth() + 1)}${pad(localDate.getDate())}`;
  const localTimeStr = `${pad(localDate.getHours())}${pad(localDate.getMinutes())}${pad(localDate.getSeconds())}`;

  const body = `
    <int:bpPayRequest>
      <int:terminalId>${escapeXml(config.terminalId)}</int:terminalId>
      <int:userName>${escapeXml(config.username)}</int:userName>
      <int:userPassword>${escapeXml(config.password)}</int:userPassword>
      <int:orderId>${escapeXml(input.orderId)}</int:orderId>
      <int:amount>${escapeXml(amount)}</int:amount>
      <int:localDate>${escapeXml(localDateStr)}</int:localDate>
      <int:localTime>${escapeXml(localTimeStr)}</int:localTime>
      <int:additionalData></int:additionalData>
      <int:callBackUrl>${escapeXml(input.callbackUrl)}</int:callBackUrl>
      <int:payerId>${escapeXml(input.payerId || '0')}</int:payerId>
    </int:bpPayRequest>`;

  const xml = await callMellatSoap('bpPayRequest', body);
  const ret = extractReturn(xml);
  const [resCode, refId] = ret.split(',');
  if (resCode !== '0' || !refId) {
    throw new Error(`Mellat bpPayRequest failed (ResCode ${resCode || 'unknown'})`);
  }
  return { refId };
}

export async function mellatVerifyRequest(input: {
  config: MellatConfig;
  orderId: number;
  saleOrderId: number;
  saleReferenceId: number;
}): Promise<void> {
  const { config } = input;
  const body = `
    <int:bpVerifyRequest>
      <int:terminalId>${escapeXml(config.terminalId)}</int:terminalId>
      <int:userName>${escapeXml(config.username)}</int:userName>
      <int:userPassword>${escapeXml(config.password)}</int:userPassword>
      <int:orderId>${escapeXml(input.orderId)}</int:orderId>
      <int:saleOrderId>${escapeXml(input.saleOrderId)}</int:saleOrderId>
      <int:saleReferenceId>${escapeXml(input.saleReferenceId)}</int:saleReferenceId>
    </int:bpVerifyRequest>`;

  const xml = await callMellatSoap('bpVerifyRequest', body);
  const ret = extractReturn(xml);
  if (ret !== '0') {
    throw new Error(`Mellat verify failed (ResCode ${ret})`);
  }
}

export async function mellatSettleRequest(input: {
  config: MellatConfig;
  orderId: number;
  saleOrderId: number;
  saleReferenceId: number;
}): Promise<void> {
  const { config } = input;
  const body = `
    <int:bpSettleRequest>
      <int:terminalId>${escapeXml(config.terminalId)}</int:terminalId>
      <int:userName>${escapeXml(config.username)}</int:userName>
      <int:userPassword>${escapeXml(config.password)}</int:userPassword>
      <int:orderId>${escapeXml(input.orderId)}</int:orderId>
      <int:saleOrderId>${escapeXml(input.saleOrderId)}</int:saleOrderId>
      <int:saleReferenceId>${escapeXml(input.saleReferenceId)}</int:saleReferenceId>
    </int:bpSettleRequest>`;

  const xml = await callMellatSoap('bpSettleRequest', body);
  const ret = extractReturn(xml);
  // 0 success; 45 already settled — treat as ok
  if (ret !== '0' && ret !== '45') {
    throw new Error(`Mellat settle failed (ResCode ${ret})`);
  }
}
