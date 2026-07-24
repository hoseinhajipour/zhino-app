import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(__dirname, '../../uploads');
const staffDir = path.resolve(__dirname, '../../public/staff');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.ogg', '.mov']);

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
  };
  return map[ext] || 'application/octet-stream';
}

function kindFromExt(ext: string): 'image' | 'video' | 'other' {
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return 'other';
}

function listDirMedia(
  dir: string,
  urlPrefix: string,
  source: 'uploads' | 'staff'
): Array<{
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  kind: 'image' | 'video' | 'other';
  source: 'uploads' | 'staff';
  uploadedAt: string;
}> {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith('.') && name !== '.gitkeep')
    .map((filename) => {
      const full = path.join(dir, filename);
      const stat = fs.statSync(full);
      if (!stat.isFile()) return null;
      const ext = path.extname(filename).toLowerCase();
      const kind = kindFromExt(ext);
      if (kind === 'other') return null;
      return {
        url: `${urlPrefix}/${filename}`,
        filename,
        size: stat.size,
        mimetype: mimeFromExt(ext),
        kind,
        source,
        uploadedAt: stat.mtime.toISOString(),
      };
    })
    .filter(Boolean) as Array<{
    url: string;
    filename: string;
    size: number;
    mimetype: string;
    kind: 'image' | 'video' | 'other';
    source: 'uploads' | 'staff';
    uploadedAt: string;
  }>;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image\/|video\/)/;
    if (!allowed.test(file.mimetype)) {
      cb(new Error('Only image and video uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.get('/', (req, res) => {
  try {
    const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';
    const uploads = listDirMedia(uploadsDir, '/uploads', 'uploads');
    const staff = listDirMedia(staffDir, '/staff', 'staff');
    let items = [...uploads, ...staff].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    if (kind === 'image' || kind === 'video') {
      items = items.filter((i) => i.kind === kind);
    }
    res.json(items);
  } catch (err) {
    console.error('GET /uploads error:', err);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

uploadsRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const ext = path.extname(req.file.filename).toLowerCase();
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({
    url,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    kind: kindFromExt(ext),
    source: 'uploads',
    uploadedAt: new Date().toISOString(),
  });
});

uploadsRouter.delete('/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const full = path.join(uploadsDir, filename);
    if (!full.startsWith(uploadsDir) || !fs.existsSync(full)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    fs.unlinkSync(full);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /uploads error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});
