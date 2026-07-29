import fs from 'fs';
import path from 'path';
import { ApiError, getApiBase, getApiToken } from './client.js';

export type UploadPurpose = 'shop' | 'document' | '';

export interface UploadedMedia {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  kind: string;
  source?: string;
  uploadedAt?: string;
}

/**
 * Upload a local file to POST /api/uploads (multipart/form-data).
 * Content-Type is intentionally left unset so fetch can add the multipart boundary.
 */
export async function uploadMedia(
  filePath: string,
  purpose?: UploadPurpose
): Promise<UploadedMedia> {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw new Error(`File not found: ${abs}`);
  }

  const buffer = fs.readFileSync(abs);
  const filename = path.basename(abs);
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);

  const qs = purpose ? `?purpose=${encodeURIComponent(purpose)}` : '';
  const url = `${getApiBase()}/api/uploads${qs}`;

  const headers: Record<string, string> = {};
  const token = getApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-Zhino-Token'] = token;
  }

  const res = await fetch(url, { method: 'POST', body: form, headers });
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
      text ||
      `Upload failed: ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as UploadedMedia;
}

export async function deleteMedia(filename: string): Promise<{ deleted: string }> {
  const name = path.basename(filename);
  const headers: Record<string, string> = {};
  const token = getApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-Zhino-Token'] = token;
  }

  const res = await fetch(`${getApiBase()}/api/uploads/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 204 || res.ok) {
    return { deleted: name };
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
  const message =
    (data && typeof data === 'object' && 'error' in data && String((data as { error: unknown }).error)) ||
    text ||
    `Delete failed: ${res.status}`;
  throw new ApiError(res.status, message, data);
}
