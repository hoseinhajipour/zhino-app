import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// tools/zhino/src/core → repo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env'), quiet: true });

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getApiBase(): string {
  return (process.env.ZHINO_API_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '');
}

export function getApiToken(): string {
  return (process.env.ZHINO_API_TOKEN || '').trim();
}

export async function apiRequest<T = unknown>(
  apiPath: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-Zhino-Token'] = token;
  }

  const url = `${getApiBase()}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const res = await fetch(url, { ...init, method, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text().catch(() => '');
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && String((data as { error: unknown }).error)) ||
      (data && typeof data === 'object' && 'message' in data && String((data as { message: unknown }).message)) ||
      text ||
      `Request failed: ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export async function healthCheck(): Promise<{ ok: boolean; installed?: boolean }> {
  return apiRequest('/api/health');
}
