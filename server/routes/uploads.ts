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
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac', '.oga', '.opus']);
const DOCUMENT_EXT = new Set([
  '.pdf',
  '.zip',
  '.epub',
  '.doc',
  '.docx',
  '.txt',
  '.rtf',
]);

const DOCUMENT_MIME = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/epub+zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'application/octet-stream',
]);

type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'other';

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
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.epub': 'application/epub+zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.oga': 'audio/ogg',
    '.opus': 'audio/opus',
  };
  return map[ext] || 'application/octet-stream';
}

function kindFromExt(ext: string): MediaKind {
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  if (AUDIO_EXT.has(ext)) return 'audio';
  if (DOCUMENT_EXT.has(ext)) return 'document';
  return 'other';
}

function isAudioUpload(file: Express.Multer.File): boolean {
  if (/^audio\//.test(file.mimetype)) return true;
  const ext = path.extname(file.originalname).toLowerCase();
  return AUDIO_EXT.has(ext);
}

function listDirMedia(
  dir: string,
  urlPrefix: string,
  source: 'uploads' | 'staff',
  includeDocuments = false
): Array<{
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  kind: MediaKind;
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
      if (kind === 'document' && !includeDocuments) return null;
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
    kind: MediaKind;
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

function createUpload(allowDocuments: boolean) {
  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (/^(image\/|video\/)/.test(file.mimetype) || isAudioUpload(file)) {
        cb(null, true);
        return;
      }
      if (allowDocuments) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (DOCUMENT_EXT.has(ext) || DOCUMENT_MIME.has(file.mimetype) || AUDIO_EXT.has(ext)) {
          cb(null, true);
          return;
        }
      }
      cb(
        new Error(
          allowDocuments
            ? 'Unsupported file type'
            : 'Only image, video, and audio uploads are allowed'
        )
      );
    },
  });
}

const uploadMedia = createUpload(false);
const uploadWithDocs = createUpload(true);

export const uploadsRouter = Router();

uploadsRouter.get('/', (req, res) => {
  try {
    const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';
    const includeDocuments = kind === 'document' || kind === 'all-files';
    const uploads = listDirMedia(uploadsDir, '/uploads', 'uploads', includeDocuments);
    const staff = listDirMedia(staffDir, '/staff', 'staff', false);
    let items = [...uploads, ...staff].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    if (kind === 'image' || kind === 'video' || kind === 'audio' || kind === 'document') {
      items = items.filter((i) => i.kind === kind);
    }
    res.json(items);
  } catch (err) {
    console.error('GET /uploads error:', err);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

uploadsRouter.post('/', (req, res) => {
  const purpose = typeof req.query.purpose === 'string' ? req.query.purpose : '';
  const allowDocuments = purpose === 'shop' || purpose === 'document';
  const uploader = allowDocuments ? uploadWithDocs : uploadMedia;

  uploader.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Upload failed' });
      return;
    }
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
});

uploadsRouter.delete('/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const full = path.join(uploadsDir, filename);
    if (!fs.existsSync(full)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    fs.unlinkSync(full);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /uploads error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});
