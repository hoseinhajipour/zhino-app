import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type EntityTable =
  | 'appointments'
  | 'doctors'
  | 'services'
  | 'articles'
  | 'faqs'
  | 'settings'
  | 'pages'
  | 'users'
  | 'article_categories'
  | 'forms'
  | 'form_submissions';

const TABLES: EntityTable[] = [
  'appointments',
  'doctors',
  'services',
  'articles',
  'faqs',
  'settings',
  'pages',
  'users',
  'article_categories',
  'forms',
  'form_submissions',
];

let pool: Pool | null = null;

function getConfig() {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'zhino',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  };
}

export function getMysqlConfig() {
  return getConfig();
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(getConfig());
  }
  return pool;
}

/** Lightweight connectivity probe for system status. */
export async function pingDatabase(): Promise<void> {
  await getPool().query('SELECT 1');
}

/** Close cached pool so next getPool() picks up new env. */
export async function resetPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore close errors
    }
    pool = null;
  }
}

export type MysqlConnectionInput = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

/** Test MySQL credentials (creates DB if missing when createDb=true). */
export async function testMysqlConnection(
  input: MysqlConnectionInput,
  options: { createDb?: boolean } = {}
): Promise<void> {
  const bootstrap = await mysql.createConnection({
    host: input.host,
    port: input.port,
    user: input.user,
    password: input.password,
    multipleStatements: true,
  });
  try {
    if (options.createDb) {
      const dbName = input.database.replace(/[^a-zA-Z0-9_]/g, '');
      if (!dbName) throw new Error('نام دیتابیس نامعتبر است');
      await bootstrap.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    }
    await bootstrap.query(`USE \`${input.database.replace(/[^a-zA-Z0-9_]/g, '')}\``);
    await bootstrap.query('SELECT 1');
  } finally {
    await bootstrap.end();
  }
}

/** Reload process.env MYSQL_* and reset pool. */
export function applyMysqlEnv(input: MysqlConnectionInput): void {
  process.env.MYSQL_HOST = input.host;
  process.env.MYSQL_PORT = String(input.port);
  process.env.MYSQL_USER = input.user;
  process.env.MYSQL_PASSWORD = input.password;
  process.env.MYSQL_DATABASE = input.database;
}

async function ensureUsersLookupColumns(): Promise<void> {
  const db = getPool();
  const needed = [
    { name: 'mobile', ddl: `ADD COLUMN \`mobile\` VARCHAR(32) NOT NULL DEFAULT '' AFTER \`payload\`` },
    { name: 'username', ddl: `ADD COLUMN \`username\` VARCHAR(128) NOT NULL DEFAULT '' AFTER \`mobile\`` },
    { name: 'role', ddl: `ADD COLUMN \`role\` VARCHAR(32) NOT NULL DEFAULT 'patient' AFTER \`username\`` },
  ];
  for (const col of needed) {
    const [cols] = await db.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = :name`,
      { name: col.name }
    );
    if (!cols.length) {
      await db.query(`ALTER TABLE \`users\` ${col.ddl}`);
    }
  }
  for (const idx of ['idx_users_mobile', 'idx_users_username', 'idx_users_role']) {
    try {
      if (idx === 'idx_users_mobile') {
        await db.query(`CREATE INDEX \`idx_users_mobile\` ON \`users\` (\`mobile\`)`);
      } else if (idx === 'idx_users_username') {
        await db.query(`CREATE INDEX \`idx_users_username\` ON \`users\` (\`username\`)`);
      } else {
        await db.query(`CREATE INDEX \`idx_users_role\` ON \`users\` (\`role\`)`);
      }
    } catch {
      // index may already exist
    }
  }
}

function mapUserRow(row: { id: string; payload: unknown; mobile?: string; username?: string; role?: string }) {
  const data = parsePayload(row.payload);
  return {
    ...data,
    id: row.id,
    mobile: row.mobile || data.mobile || '',
    username: row.username || data.username || '',
    role: row.role || data.role || 'patient',
  };
}

async function ensureArticlesCategoryColumn(): Promise<void> {
  const db = getPool();
  const [cols] = await db.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'articles' AND COLUMN_NAME = 'category'`
  );
  if (!cols.length) {
    await db.query(
      `ALTER TABLE \`articles\` ADD COLUMN \`category\` VARCHAR(128) NOT NULL DEFAULT '' AFTER \`payload\``
    );
  }
  try {
    await db.query(`CREATE INDEX \`idx_articles_category\` ON \`articles\` (\`category\`)`);
  } catch {
    // index may already exist
  }
}

async function backfillArticleCategories(): Promise<void> {
  const db = getPool();
  const [rows] = await db.query<(RowDataPacket & { id: string; payload: unknown; category: string })[]>(
    `SELECT id, payload, category FROM \`articles\``
  );
  for (const row of rows) {
    if (row.category) continue;
    const data = parsePayload(row.payload);
    const category = String(data.category || '');
    if (!category) continue;
    await db.query(`UPDATE \`articles\` SET category = :category WHERE id = :id`, {
      id: row.id,
      category,
    });
  }
}

/**
 * Ensure app tables exist on the configured database.
 * Does NOT create the database itself — that only happens in the installer wizard
 * via testMysqlConnection(..., { createDb: true }).
 */
export async function initDatabase(): Promise<void> {
  const db = getPool();
  // Fail fast if the database from env does not exist (no auto-CREATE).
  await db.query('SELECT 1');
  for (const table of TABLES) {
    if (table === 'articles') {
      await db.query(`
        CREATE TABLE IF NOT EXISTS \`articles\` (
          id VARCHAR(128) NOT NULL PRIMARY KEY,
          payload JSON NOT NULL,
          category VARCHAR(128) NOT NULL DEFAULT '',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_articles_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else if (table === 'users') {
      await db.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          id VARCHAR(128) NOT NULL PRIMARY KEY,
          payload JSON NOT NULL,
          mobile VARCHAR(32) NOT NULL DEFAULT '',
          username VARCHAR(128) NOT NULL DEFAULT '',
          role VARCHAR(32) NOT NULL DEFAULT 'patient',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users_mobile (mobile),
          INDEX idx_users_username (username),
          INDEX idx_users_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS \`${table}\` (
          id VARCHAR(128) NOT NULL PRIMARY KEY,
          payload JSON NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  await ensureArticlesCategoryColumn();
  await backfillArticleCategories();
  await ensureUsersLookupColumns();
}

function parsePayload(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return {};
}

export async function listEntities<T extends { id: string }>(
  table: EntityTable,
  options?: { category?: string }
): Promise<T[]> {
  if (table === 'articles' && options?.category) {
    const [rows] = await getPool().query<(RowDataPacket & { id: string; payload: unknown; category?: string })[]>(
      `SELECT id, payload, category FROM \`articles\` WHERE category = :category`,
      { category: options.category }
    );
    return rows.map((row) => {
      const data = parsePayload(row.payload);
      return { ...data, id: row.id, category: row.category || data.category || '' } as unknown as T;
    });
  }

  if (table === 'articles') {
    const [rows] = await getPool().query<(RowDataPacket & { id: string; payload: unknown; category?: string })[]>(
      `SELECT id, payload, category FROM \`articles\``
    );
    return rows.map((row) => {
      const data = parsePayload(row.payload);
      return { ...data, id: row.id, category: row.category || data.category || '' } as unknown as T;
    });
  }

  if (table === 'users') {
    const [rows] = await getPool().query<
      (RowDataPacket & { id: string; payload: unknown; mobile?: string; username?: string; role?: string })[]
    >(`SELECT id, payload, mobile, username, role FROM \`users\``);
    return rows.map((row) => mapUserRow(row) as unknown as T);
  }

  const [rows] = await getPool().query<(RowDataPacket & { id: string; payload: unknown })[]>(
    `SELECT id, payload FROM \`${table}\``
  );
  return rows.map((row) => {
    const data = parsePayload(row.payload);
    return { ...data, id: row.id } as T;
  });
}

export async function listArticleCategories(): Promise<
  Array<{ id: string; name: string; slug: string; sortOrder?: number; active?: boolean }>
> {
  const [rows] = await getPool().query<(RowDataPacket & { id: string; payload: unknown })[]>(
    `SELECT id, payload FROM \`article_categories\``
  );
  const items = rows.map((row) => {
    const data = parsePayload(row.payload);
    return {
      id: row.id,
      name: String(data.name || ''),
      slug: String(data.slug || row.id),
      sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
      active: data.active !== false,
    };
  });
  return items
    .filter((c) => c.active !== false && c.name)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'fa'));
}

/** @deprecated Prefer listArticleCategories — kept for name-only callers during transition */
export async function listArticleCategoryNames(): Promise<string[]> {
  const cats = await listArticleCategories();
  return cats.map((c) => c.name);
}

export async function getEntity<T extends { id: string }>(
  table: EntityTable,
  id: string
): Promise<T | null> {
  if (table === 'articles') {
    const [rows] = await getPool().query<(RowDataPacket & { id: string; payload: unknown; category?: string })[]>(
      `SELECT id, payload, category FROM \`articles\` WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return null;
    const data = parsePayload(rows[0].payload);
    return { ...data, id: rows[0].id, category: rows[0].category || data.category || '' } as unknown as T;
  }

  if (table === 'users') {
    const [rows] = await getPool().query<
      (RowDataPacket & { id: string; payload: unknown; mobile?: string; username?: string; role?: string })[]
    >(`SELECT id, payload, mobile, username, role FROM \`users\` WHERE id = :id LIMIT 1`, { id });
    if (!rows.length) return null;
    return mapUserRow(rows[0]) as unknown as T;
  }

  const [rows] = await getPool().query<(RowDataPacket & { id: string; payload: unknown })[]>(
    `SELECT id, payload FROM \`${table}\` WHERE id = :id LIMIT 1`,
    { id }
  );
  if (!rows.length) return null;
  const data = parsePayload(rows[0].payload);
  return { ...data, id: rows[0].id } as T;
}

export async function findUserByMobile(mobile: string): Promise<Record<string, unknown> | null> {
  const [rows] = await getPool().query<
    (RowDataPacket & { id: string; payload: unknown; mobile?: string; username?: string; role?: string })[]
  >(`SELECT id, payload, mobile, username, role FROM \`users\` WHERE mobile = :mobile LIMIT 1`, {
    mobile: mobile.trim(),
  });
  if (!rows.length) return null;
  return mapUserRow(rows[0]);
}

export async function findUserByUsername(username: string): Promise<Record<string, unknown> | null> {
  const [rows] = await getPool().query<
    (RowDataPacket & { id: string; payload: unknown; mobile?: string; username?: string; role?: string })[]
  >(
    `SELECT id, payload, mobile, username, role FROM \`users\` WHERE LOWER(username) = LOWER(:username) LIMIT 1`,
    { username: username.trim() }
  );
  if (!rows.length) return null;
  return mapUserRow(rows[0]);
}

export async function upsertEntity(table: EntityTable, id: string, data: object): Promise<void> {
  const merged = { ...data, id };
  const payload = JSON.stringify(merged);

  if (table === 'articles') {
    const category = String((merged as { category?: string }).category || '');
    await getPool().query<ResultSetHeader>(
      `INSERT INTO \`articles\` (id, payload, category)
       VALUES (:id, CAST(:payload AS JSON), :category)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), category = VALUES(category)`,
      { id, payload, category }
    );
    return;
  }

  if (table === 'users') {
    const row = merged as { mobile?: string; username?: string; role?: string };
    const mobile = String(row.mobile || '');
    const username = String(row.username || '');
    const role = String(row.role || 'patient');
    await getPool().query<ResultSetHeader>(
      `INSERT INTO \`users\` (id, payload, mobile, username, role)
       VALUES (:id, CAST(:payload AS JSON), :mobile, :username, :role)
       ON DUPLICATE KEY UPDATE
         payload = VALUES(payload),
         mobile = VALUES(mobile),
         username = VALUES(username),
         role = VALUES(role)`,
      { id, payload, mobile, username, role }
    );
    return;
  }

  await getPool().query<ResultSetHeader>(
    `INSERT INTO \`${table}\` (id, payload)
     VALUES (:id, CAST(:payload AS JSON))
     ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
    { id, payload }
  );
}

export async function patchEntity(
  table: EntityTable,
  id: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  const existing = await getEntity(table, id);
  if (!existing) return false;
  await upsertEntity(table, id, { ...existing, ...patch, id });
  return true;
}

export async function deleteEntity(table: EntityTable, id: string): Promise<boolean> {
  const [result] = await getPool().query<ResultSetHeader>(
    `DELETE FROM \`${table}\` WHERE id = :id`,
    { id }
  );
  return result.affectedRows > 0;
}

export async function countEntities(table: EntityTable): Promise<number> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM \`${table}\``
  );
  return Number(rows[0]?.cnt ?? 0);
}
