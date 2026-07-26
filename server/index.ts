import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import {
  appointmentsRouter,
  doctorsRouter,
  servicesRouter,
  articlesRouter,
  faqsRouter,
  settingsRouter,
  pagesRouter,
  articleCategoriesRouter,
  formSubmissionsRouter,
  productsRouter,
  productCategoriesRouter,
  ordersRouter,
} from './routes/entities';
import { formsRouter } from './routes/forms';
import { uploadsRouter, uploadsDir } from './routes/uploads';
import { usersRouter } from './routes/users';
import { installRouter } from './routes/install';
import { systemRouter } from './routes/system';
import { backupRouter } from './routes/backup';
import { shopPaymentRouter } from './routes/shopPayment';
import { isInstallInProgress, isInstallLocked } from './lib/installLock';
import { isMaintenanceModeCached } from './lib/maintenanceCache';
import { logApiTokenStatus, requireApiTokenForWrites } from './middleware/apiToken';
import {
  seedIfEmpty,
  ensureServicePageBuilders,
  ensureSitePages,
  ensureDefaultUsers,
  ensureArticleCategories,
  ensureProductCategories,
  ensureDefaultForms,
} from './seed';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const PORT = Number(process.env.PORT || 3001);
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(uploadsDir));

// Install routes must work even when DB is down
app.use('/api/install', installRouter);

// Protect CMS writes when ZHINO_API_TOKEN is set (public GETs + form submit / login stay open)
app.use('/api', requireApiTokenForWrites);

app.use('/api/appointments', appointmentsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/article-categories', articleCategoriesRouter);
app.use('/api/faqs', faqsRouter);
app.use('/api/forms', formsRouter);
app.use('/api/form-submissions', formSubmissionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/product-categories', productCategoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shop/payment', shopPaymentRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/system', systemRouter);
app.use('/api/backup', backupRouter);

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

/**
 * Only connect/seed when install is finished, or mid-wizard (DB already created in step 1).
 * Never CREATE DATABASE from .env — that happens only in installer step 1.
 */
async function bootstrapDatabase(): Promise<boolean> {
  if (!isInstallLocked()) {
    if (!isInstallInProgress()) {
      // Fresh site: force installer — do not create DB or seed from .env
      return false;
    }
    // Steps 2–3 pending: reconnect so /site and /admin work after restart
    try {
      await initDatabase();
      return true;
    } catch (err) {
      console.error('Database reconnect during install failed:', err);
      return false;
    }
  }

  try {
    await initDatabase();
    await seedIfEmpty();
    await ensureServicePageBuilders();
    await ensureSitePages();
    await ensureDefaultUsers();
    await ensureArticleCategories();
    await ensureProductCategories();
    await ensureDefaultForms();
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
    logApiTokenStatus();
    if (!isInstallLocked()) {
      console.log(
        'Waiting for installer — open the site to complete setup (database is created only in the wizard).'
      );
    } else if (!dbOk) {
      console.log('Install lock present but database is unreachable — open the site to repair connection.');
    }
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
