import { apiRequest } from './client.js';

export type EntityMap = {
  pages: '/api/pages';
  services: '/api/services';
  articles: '/api/articles';
  doctors: '/api/doctors';
  faqs: '/api/faqs';
  forms: '/api/forms';
};

const PATHS: EntityMap = {
  pages: '/api/pages',
  services: '/api/services',
  articles: '/api/articles',
  doctors: '/api/doctors',
  faqs: '/api/faqs',
  forms: '/api/forms',
};

export type EntityName = keyof EntityMap;

export async function listEntities<T = Record<string, unknown>>(
  name: EntityName,
  query?: Record<string, string>
): Promise<T[]> {
  const base = PATHS[name];
  const qs = query
    ? `?${new URLSearchParams(query).toString()}`
    : '';
  return apiRequest<T[]>(`${base}${qs}`);
}

export async function getEntity<T = Record<string, unknown>>(
  name: EntityName,
  id: string
): Promise<T> {
  return apiRequest<T>(`${PATHS[name]}/${encodeURIComponent(id)}`);
}

export async function createEntity<T extends { id: string }>(
  name: EntityName,
  body: T
): Promise<T> {
  return apiRequest<T>(PATHS[name], {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function upsertEntity<T extends { id: string }>(
  name: EntityName,
  body: T
): Promise<T> {
  const id = body.id;
  try {
    await getEntity(name, id);
    return apiRequest<T>(`${PATHS[name]}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return createEntity(name, body);
    }
    // If get fails for other reasons, still try PUT (creates via upsert on server)
    return apiRequest<T>(`${PATHS[name]}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
}

export async function deleteEntity(name: EntityName, id: string): Promise<void> {
  await apiRequest(`${PATHS[name]}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function patchEntity<T = Record<string, unknown>>(
  name: EntityName,
  id: string,
  patch: Record<string, unknown>
): Promise<T> {
  return apiRequest<T>(`${PATHS[name]}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
