import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getEntity, initDatabase } from './db';
import {
  seedIfEmpty,
  ensureServicePageBuilders,
  ensureSitePages,
  ensureDefaultUsers,
  ensureArticleCategories,
} from './seed';
import {
  appointmentsRouter,
  doctorsRouter,
  servicesRouter,
  articlesRouter,
  faqsRouter,
  settingsRouter,
  pagesRouter,
  articleCategoriesRouter,
} from './routes/entities';
import { uploadsRouter, uploadsDir } from './routes/uploads';
import { usersRouter } from './routes/users';
import { installRouter } from './routes/install';
import { systemRouter } from './routes/system';
import { isInstallLocked, writeInstallLock } from './lib/installLock';
import { isMaintenanceModeCached } from './lib/maintenanceCache';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 3001);
const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/uploads', express.static(uploadsDir));

// Install routes must work even when DB is down
app.use('/api/install', installRouter);

app.use('/api/appointments', appointmentsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/article-categories', articleCategoriesRouter);
app.use('/api/faqs', faqsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/system', systemRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, installed: isInstallLocked() });
});

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    next();
    return;
  }
  try {
    if (await isMaintenanceModeCached()) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
  } catch {
    /* ignore */
  }
  next();
});

app.get('/robots.txt', async (_req, res, next) => {
  try {
    if (await isMaintenanceModeCached()) {
      res
        .type('text/plain')
        .send(
          '# Maintenance mode — crawling disabled\nUser-agent: *\nDisallow: /\n'
        );
      return;
    }
  } catch {
    /* fall through to static */
  }
  next();
});

const distDir = path.resolve(__dirname, '../dist');
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});

async function bootstrapDatabase(): Promise<boolean> {
  try {
    await initDatabase();
    await seedIfEmpty();
    await ensureServicePageBuilders();
    await ensureSitePages();
    await ensureDefaultUsers();
    await ensureArticleCategories();

    // Legacy installs without .installed lock: auto-lock if settings exist
    if (!isInstallLocked()) {
      const settings = await getEntity('settings', 'clinic_settings');
      if (settings) {
        writeInstallLock();
        console.log('Created .installed lock for existing database.');
      }
    }
    return true;
  } catch (err) {
    console.error('Database bootstrap failed (installer available):', err);
    return false;
  }
}

async function main() {
  const dbOk = await bootstrapDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zhino server listening on http://0.0.0.0:${PORT}`);
    if (!dbOk) {
      console.log('Waiting for installer — open the site to complete setup.');
    } else if (!isInstallLocked()) {
      console.log('Database ready — complete the installer wizard in the browser.');
    }
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
