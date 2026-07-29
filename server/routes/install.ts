import { Router, Request, Response, NextFunction } from 'express';
import {
  applyMysqlEnv,
  getEntity,
  getMysqlConfig,
  initDatabase,
  resetPool,
  testMysqlConnection,
  upsertEntity,
  type MysqlConnectionInput,
} from '../db';
import {
  isInstallInProgress,
  isInstallLocked,
  markInstallInProgress,
  writeEnvFile,
  writeInstallLock,
} from '../lib/installLock';
import { hashPassword } from '../lib/password';
import {
  DEFAULT_CLINIC_SETTINGS,
  ensureArticleCategories,
  ensureDefaultUsers,
  ensureServicePageBuilders,
  ensureWorkshopPageBuilders,
  ensureSitePages,
  seedIfEmpty,
} from '../seed';
import type { ClinicSettings, UserRecord } from '../../src/types';
import { mergeSiteChrome } from '../../src/lib/siteChromeDefaults';

export const installRouter = Router();

function blockIfLocked(_req: Request, res: Response, next: NextFunction) {
  if (isInstallLocked()) {
    res.status(403).json({ error: 'نصب قبلاً تکمیل شده است.' });
    return;
  }
  next();
}

async function probeDbConnected(): Promise<boolean> {
  try {
    const cfg = getMysqlConfig();
    await testMysqlConnection(
      {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
      },
      { createDb: false }
    );
    return true;
  } catch {
    return false;
  }
}

installRouter.get('/status', async (_req, res) => {
  const locked = isInstallLocked();
  const installing = isInstallInProgress();
  const dbConnected = await probeDbConnected();
  // Always show installer until .installed exists (even if .env MySQL already works).
  // Also show when lock exists but DB is down (reconnect via step 1).
  const needsInstall = !locked || !dbConnected;
  const resumeStep = locked ? 0 : installing && dbConnected ? 2 : 1;
  res.json({
    needsInstall,
    installed: locked,
    installing,
    dbConnected,
    resumeStep,
    steps: ['db', 'site', 'admin'],
  });
});

installRouter.post('/db', async (req, res) => {
  try {
    if (isInstallLocked()) {
      // Repair path only: verify credentials, rewrite .env, do not re-run wizard steps 2–3
      const body = req.body || {};
      const input: MysqlConnectionInput = {
        host: String(body.host || '127.0.0.1').trim() || '127.0.0.1',
        port: Number(body.port) || 3306,
        user: String(body.user || 'root').trim() || 'root',
        password: String(body.password ?? ''),
        database: String(body.database || 'zhino_app').trim().replace(/[^a-zA-Z0-9_]/g, '') || 'zhino_app',
      };
      await testMysqlConnection(input, { createDb: false });
      writeEnvFile({
        PORT: process.env.PORT || '3001',
        MYSQL_HOST: input.host,
        MYSQL_PORT: input.port,
        MYSQL_USER: input.user,
        MYSQL_PASSWORD: input.password,
        MYSQL_DATABASE: input.database,
      });
      applyMysqlEnv(input);
      await resetPool();
      await initDatabase();
      res.json({ ok: true, database: input.database, alreadyInstalled: true });
      return;
    }

    const body = req.body || {};
    const input: MysqlConnectionInput = {
      host: String(body.host || '127.0.0.1').trim() || '127.0.0.1',
      port: Number(body.port) || 3306,
      user: String(body.user || 'root').trim() || 'root',
      password: String(body.password ?? ''),
      database: String(body.database || 'zhino_app').trim().replace(/[^a-zA-Z0-9_]/g, '') || 'zhino_app',
    };

    // Create database ONLY from the installer wizard (never on server boot from .env)
    await testMysqlConnection(input, { createDb: true });

    writeEnvFile({
      PORT: process.env.PORT || '3001',
      MYSQL_HOST: input.host,
      MYSQL_PORT: input.port,
      MYSQL_USER: input.user,
      MYSQL_PASSWORD: input.password,
      MYSQL_DATABASE: input.database,
    });

    applyMysqlEnv(input);
    await resetPool();
    await initDatabase();

    await seedIfEmpty();
    await ensureServicePageBuilders();
    await ensureWorkshopPageBuilders();
    await ensureSitePages();
    await ensureArticleCategories();
    // Keep wizard open for site identity + admin steps
    markInstallInProgress();

    res.json({ ok: true, database: input.database, alreadyInstalled: false });
  } catch (err) {
    console.error('install/db failed:', err);
    res.status(400).json({
      error: err instanceof Error ? err.message : 'اتصال به دیتابیس ناموفق بود',
    });
  }
});

installRouter.post('/site', blockIfLocked, async (req, res) => {
  try {
    const body = req.body || {};
    const siteName = String(body.siteName || '').trim();
    if (!siteName) {
      res.status(400).json({ error: 'عنوان سایت الزامی است' });
      return;
    }

    const existingRaw = await getEntity<ClinicSettings & { id: string }>('settings', 'clinic_settings');
    const existing = existingRaw || DEFAULT_CLINIC_SETTINGS;
    const chrome = mergeSiteChrome(existing.site);
    const next: ClinicSettings = {
      ...existing,
      site: {
        ...chrome,
        identity: {
          ...chrome.identity,
          siteName,
          tagline: String(body.tagline ?? chrome.identity.tagline),
          logoUrl: String(body.logoUrl ?? chrome.identity.logoUrl),
          faviconUrl: String(body.faviconUrl ?? chrome.identity.faviconUrl),
          primaryColor: String(body.primaryColor || chrome.identity.primaryColor),
          secondaryColor: String(body.secondaryColor || chrome.identity.secondaryColor),
        },
      },
    };

    await upsertEntity('settings', 'clinic_settings', next);
    res.json({ ok: true, settings: next });
  } catch (err) {
    console.error('install/site failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'ذخیره تنظیمات سایت ناموفق بود',
    });
  }
});

installRouter.post('/admin', blockIfLocked, async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!name || !username || password.length < 6) {
      res.status(400).json({
        error: 'نام، نام کاربری و رمز حداقل ۶ کاراکتری الزامی است',
      });
      return;
    }

    // Ensure non-admin defaults exist; admin will be overwritten below
    await ensureDefaultUsers();

    const admin: UserRecord = {
      id: 'admin-01',
      name,
      mobile: String(body.mobile || '09120000000').trim() || '09120000000',
      username,
      role: 'admin',
      doctorTitle: 'مدیر سیستم',
      email: String(body.email || `${username}@local`).trim(),
      passwordHash: hashPassword(password),
    };
    await upsertEntity('users', admin.id, admin);

    res.json({
      ok: true,
      user: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('install/admin failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'ایجاد ادمین ناموفق بود',
    });
  }
});

installRouter.post('/complete', blockIfLocked, async (_req, res) => {
  try {
    const dbOk = await probeDbConnected();
    if (!dbOk) {
      res.status(400).json({ error: 'دیتابیس هنوز متصل نیست' });
      return;
    }
    const settings = await getEntity('settings', 'clinic_settings');
    if (!settings) {
      res.status(400).json({ error: 'تنظیمات سایت هنوز ذخیره نشده است' });
      return;
    }
    const admin = await getEntity<UserRecord & { id: string }>('users', 'admin-01');
    if (!admin) {
      res.status(400).json({ error: 'حساب ادمین هنوز ایجاد نشده است' });
      return;
    }
    writeInstallLock();
    res.json({ ok: true, installedAt: new Date().toISOString() });
  } catch (err) {
    console.error('install/complete failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'تکمیل نصب ناموفق بود',
    });
  }
});
