import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEntity, upsertEntity } from '../db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Dedicated dir for Google/Bing HTML verification files served at site root */
export const seoRootDir = path.resolve(__dirname, '../../uploads/seo-root');

if (!fs.existsSync(seoRootDir)) {
  fs.mkdirSync(seoRootDir, { recursive: true });
}

const GOOGLE_HTML_RE = /^google[a-z0-9]+\.html$/i;

function isSafeGoogleFilename(name: string): boolean {
  return GOOGLE_HTML_RE.test(path.basename(name));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, seoRootDir),
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).trim();
    if (!isSafeGoogleFilename(safe)) {
      cb(new Error('نام فایل باید شبیه googleXXXX.html باشد (فایل تأیید گوگل)'), '');
      return;
    }
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 64 * 1024 },
  fileFilter: (_req, file, cb) => {
    const safe = path.basename(file.originalname).trim();
    if (!isSafeGoogleFilename(safe)) {
      cb(new Error('فقط فایل HTML تأیید مالکیت گوگل مجاز است (google….html)'));
      return;
    }
    if (
      file.mimetype &&
      file.mimetype !== 'text/html' &&
      file.mimetype !== 'application/octet-stream' &&
      file.mimetype !== 'text/plain'
    ) {
      cb(new Error('نوع فایل باید HTML باشد'));
      return;
    }
    cb(null, true);
  },
});

async function patchSeoFilename(filename: string | '') {
  const current =
    ((await getEntity('settings', 'clinic_settings')) as Record<string, unknown> | null) || {};
  const seo = {
    ...((current.seo as Record<string, unknown>) || {}),
    googleHtmlVerificationFilename: filename,
  };
  await upsertEntity('settings', 'clinic_settings', {
    ...current,
    id: 'clinic_settings',
    seo,
  });
}

function listVerificationFiles(): Array<{
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}> {
  if (!fs.existsSync(seoRootDir)) return [];
  return fs
    .readdirSync(seoRootDir)
    .filter((name) => isSafeGoogleFilename(name))
    .map((filename) => {
      const full = path.join(seoRootDir, filename);
      const stat = fs.statSync(full);
      if (!stat.isFile()) return null;
      return {
        filename,
        url: `/${filename}`,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
      };
    })
    .filter(Boolean) as Array<{
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>;
}

export const seoRouter = Router();

seoRouter.get('/google-verification', (_req, res) => {
  try {
    const files = listVerificationFiles();
    res.json(files[0] || null);
  } catch (err) {
    console.error('GET /api/seo/google-verification error:', err);
    res.status(500).json({ error: 'Failed to list verification file' });
  }
});

seoRouter.post('/google-verification', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Upload failed' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    try {
      // Remove older verification HTML files so only one remains
      for (const existing of listVerificationFiles()) {
        if (existing.filename !== req.file.filename) {
          const full = path.join(seoRootDir, existing.filename);
          if (fs.existsSync(full)) fs.unlinkSync(full);
        }
      }
      await patchSeoFilename(req.file.filename);
      res.status(201).json({
        filename: req.file.filename,
        url: `/${req.file.filename}`,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('POST /api/seo/google-verification error:', e);
      res.status(500).json({ error: 'Failed to save verification file' });
    }
  });
});

seoRouter.delete('/google-verification', async (req, res) => {
  try {
    const requested =
      typeof req.query.filename === 'string' ? path.basename(req.query.filename) : '';
    const files = listVerificationFiles();
    const targets = requested
      ? files.filter((f) => f.filename === requested)
      : files;
    for (const f of targets) {
      const full = path.join(seoRootDir, f.filename);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
    await patchSeoFilename('');
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/seo/google-verification error:', err);
    res.status(500).json({ error: 'Failed to delete verification file' });
  }
});

/** Serve a Google verification HTML from seo-root if present */
export function trySendGoogleVerification(
  filename: string,
  res: import('express').Response,
  next: import('express').NextFunction
) {
  const safe = path.basename(filename);
  if (!isSafeGoogleFilename(safe)) {
    next();
    return;
  }
  const full = path.join(seoRootDir, safe);
  if (!fs.existsSync(full)) {
    next();
    return;
  }
  res.type('text/html; charset=utf-8');
  res.sendFile(full, (err) => {
    if (err) next();
  });
}
