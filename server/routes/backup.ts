import { Router } from 'express';
import multer from 'multer';
import {
  BACKUP_ENTITY_KEYS,
  BackupEntityKey,
  buildZhinoBackup,
  importZhinoBackup,
  isZhinoBackup,
} from '../lib/zhinoBackup';
import { importWordpressContent } from '../lib/wordpressImport';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

function parseEntityList(input: unknown): BackupEntityKey[] {
  if (!Array.isArray(input)) return [];
  return input.filter((k): k is BackupEntityKey =>
    (BACKUP_ENTITY_KEYS as readonly string[]).includes(String(k))
  );
}

export const backupRouter = Router();

backupRouter.get('/entities', (_req, res) => {
  res.json({
    entities: BACKUP_ENTITY_KEYS.map((key) => ({
      key,
      labelFa:
        (
          {
            pages: 'صفحات سایت',
            articles: 'مقالات',
            article_categories: 'دسته‌بندی مقالات',
            doctors: 'پرسنل / درمانگران',
            services: 'خدمات',
            faqs: 'سوالات متداول',
            forms: 'فرم‌ها',
            form_submissions: 'ارسال‌های فرم',
            settings: 'تنظیمات کلینیک',
            users: 'کاربران',
            appointments: 'نوبت‌ها',
            products: 'محصولات فروشگاه',
            product_categories: 'دسته‌بندی محصولات',
            orders: 'سفارش‌های فروشگاه',
          } as Record<BackupEntityKey, string>
        )[key],
    })),
  });
});

/** Export selected entities as Zhino JSON backup */
backupRouter.post('/export', async (req, res) => {
  try {
    const entities = parseEntityList(req.body?.entities);
    if (!entities.length) {
      res.status(400).json({ error: 'حداقل یک بخش را برای برون‌ریزی انتخاب کنید.' });
      return;
    }
    const includeUserSecrets = req.body?.includeUserSecrets === true;
    const doc = await buildZhinoBackup({ entities, includeUserSecrets });
    res.json(doc);
  } catch (err) {
    console.error('POST /backup/export', err);
    res.status(500).json({ error: 'برون‌ریزی ناموفق بود.' });
  }
});

/** Import Zhino JSON backup */
backupRouter.post('/import', async (req, res) => {
  try {
    const payload = req.body?.backup ?? req.body;
    if (!isZhinoBackup(payload)) {
      res.status(400).json({
        error: 'فایل معتبر نیست. باید خروجی با فرمت zhino-backup نسخه ۱ باشد.',
      });
      return;
    }
    const entities = parseEntityList(req.body?.entities);
    const selected =
      entities.length > 0
        ? entities
        : (Object.keys(payload.entities || {}) as BackupEntityKey[]).filter((k) =>
            (BACKUP_ENTITY_KEYS as readonly string[]).includes(k)
          );
    if (!selected.length) {
      res.status(400).json({ error: 'بخشی برای درون‌ریزی انتخاب نشده است.' });
      return;
    }
    const mode = req.body?.mode === 'skipExisting' ? 'skipExisting' : 'merge';
    const result = await importZhinoBackup(payload, { entities: selected, mode });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('POST /backup/import', err);
    res.status(500).json({ error: 'درون‌ریزی ناموفق بود.' });
  }
});

/** Import WordPress JSON or WXR (XML) export */
backupRouter.post('/wordpress', upload.single('file'), async (req, res) => {
  try {
    let raw = '';
    if (req.file?.buffer) {
      raw = req.file.buffer.toString('utf8');
    } else if (typeof req.body?.content === 'string') {
      raw = req.body.content;
    } else if (typeof req.body?.raw === 'string') {
      raw = req.body.raw;
    }

    if (!raw.trim()) {
      res.status(400).json({ error: 'فایل یا محتوای وردپرس ارسال نشده است.' });
      return;
    }

    const importPosts = req.body?.importPosts !== 'false' && req.body?.importPosts !== false;
    const importPages = req.body?.importPages !== 'false' && req.body?.importPages !== false;
    const downloadMedia = req.body?.downloadMedia !== 'false' && req.body?.downloadMedia !== false;
    const statusMode =
      req.body?.statusMode === 'draft' || req.body?.statusMode === 'published'
        ? req.body.statusMode
        : 'keep';

    const result = await importWordpressContent(raw, {
      importPosts,
      importPages,
      downloadMedia,
      statusMode,
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('POST /backup/wordpress', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'درون‌ریزی وردپرس ناموفق بود.',
    });
  }
});
