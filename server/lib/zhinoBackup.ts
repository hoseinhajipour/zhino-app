import { EntityTable, listEntities, upsertEntity } from '../db';

export const BACKUP_ENTITY_KEYS = [
  'pages',
  'articles',
  'article_categories',
  'doctors',
  'services',
  'faqs',
  'forms',
  'form_submissions',
  'settings',
  'users',
  'appointments',
] as const;

export type BackupEntityKey = (typeof BACKUP_ENTITY_KEYS)[number];

const TABLE_BY_KEY: Record<BackupEntityKey, EntityTable> = {
  pages: 'pages',
  articles: 'articles',
  article_categories: 'article_categories',
  doctors: 'doctors',
  services: 'services',
  faqs: 'faqs',
  forms: 'forms',
  form_submissions: 'form_submissions',
  settings: 'settings',
  users: 'users',
  appointments: 'appointments',
};

export type ZhinoBackupDocument = {
  format: 'zhino-backup';
  version: 1;
  exportedAt: string;
  app: string;
  entities: Partial<Record<BackupEntityKey, unknown[]>>;
};

function stripUserSecrets(user: Record<string, unknown>, includeSecrets: boolean) {
  if (includeSecrets) return user;
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}

export async function buildZhinoBackup(options: {
  entities: BackupEntityKey[];
  includeUserSecrets?: boolean;
}): Promise<ZhinoBackupDocument> {
  const entities: Partial<Record<BackupEntityKey, unknown[]>> = {};
  const includeSecrets = options.includeUserSecrets === true;

  for (const key of options.entities) {
    const table = TABLE_BY_KEY[key];
    const rows = await listEntities<Record<string, unknown> & { id: string }>(table);
    if (key === 'users') {
      entities.users = rows.map((u) => stripUserSecrets(u, includeSecrets));
    } else {
      entities[key] = rows;
    }
  }

  return {
    format: 'zhino-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'zhino-clinic-app',
    entities,
  };
}

export function isZhinoBackup(data: unknown): data is ZhinoBackupDocument {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.format === 'zhino-backup' && d.version === 1 && typeof d.entities === 'object';
}

export async function importZhinoBackup(
  doc: ZhinoBackupDocument,
  options: { entities: BackupEntityKey[]; mode: 'merge' | 'skipExisting' }
): Promise<{ imported: Record<string, number>; skipped: Record<string, number> }> {
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  for (const key of options.entities) {
    const items = (doc.entities?.[key] || []) as Array<Record<string, unknown> & { id?: string }>;
    imported[key] = 0;
    skipped[key] = 0;
    if (!Array.isArray(items) || !items.length) continue;

    const table = TABLE_BY_KEY[key];
    let existingIds = new Set<string>();
    if (options.mode === 'skipExisting') {
      const existing = await listEntities<{ id: string }>(table);
      existingIds = new Set(existing.map((e) => e.id));
    }

    for (const item of items) {
      const id = String(item.id || '');
      if (!id) {
        skipped[key] += 1;
        continue;
      }
      if (options.mode === 'skipExisting' && existingIds.has(id)) {
        skipped[key] += 1;
        continue;
      }

      if (key === 'users') {
        const existingUsers = await listEntities<Record<string, unknown> & { id: string }>('users');
        const prev = existingUsers.find((u) => u.id === id);
        const passwordHash =
          typeof item.passwordHash === 'string' && item.passwordHash
            ? item.passwordHash
            : typeof prev?.passwordHash === 'string'
              ? prev.passwordHash
              : '';
        if (!passwordHash) {
          // Cannot import user without a password hash and no existing account
          skipped[key] += 1;
          continue;
        }
        await upsertEntity(table, id, { ...item, id, passwordHash });
      } else {
        await upsertEntity(table, id, { ...item, id });
      }
      imported[key] += 1;
    }
  }

  return { imported, skipped };
}
