import { Router, Request, Response } from 'express';
import {
  EntityTable,
  deleteEntity,
  getEntity,
  listArticleCategories,
  listEntities,
  patchEntity,
  upsertEntity,
} from '../db';
import { invalidateMaintenanceCache } from '../lib/maintenanceCache';

function createCrudRouter(table: EntityTable) {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const items = await listEntities(table, table === 'articles' ? { category } : undefined);
      res.json(items);
    } catch (err) {
      console.error(`GET /${table} error:`, err);
      res.status(500).json({ error: 'Failed to list items' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const item = await getEntity(table, req.params.id);
      if (!item) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(item);
    } catch (err) {
      console.error(`GET /${table}/:id error:`, err);
      res.status(500).json({ error: 'Failed to get item' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body?.id) {
        res.status(400).json({ error: 'id is required' });
        return;
      }
      await upsertEntity(table, String(body.id), body);
      res.status(201).json(body);
    } catch (err) {
      console.error(`POST /${table} error:`, err);
      res.status(500).json({ error: 'Failed to save item' });
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const body = { ...req.body, id };
      await upsertEntity(table, id, body);
      res.json(body);
    } catch (err) {
      console.error(`PUT /${table}/:id error:`, err);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const ok = await patchEntity(table, req.params.id, req.body || {});
      if (!ok) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const item = await getEntity(table, req.params.id);
      res.json(item);
    } catch (err) {
      console.error(`PATCH /${table}/:id error:`, err);
      res.status(500).json({ error: 'Failed to patch item' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const ok = await deleteEntity(table, req.params.id);
      if (!ok) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      console.error(`DELETE /${table}/:id error:`, err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return router;
}

export const appointmentsRouter = createCrudRouter('appointments');
export const doctorsRouter = createCrudRouter('doctors');
export const servicesRouter = createCrudRouter('services');

export const articlesRouter = Router();
const articlesCrud = createCrudRouter('articles');

articlesRouter.get('/categories', async (_req, res) => {
  try {
    const categories = await listArticleCategories();
    res.json(categories);
  } catch (err) {
    console.error('GET /articles/categories error:', err);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

articlesRouter.use('/', articlesCrud);

export const faqsRouter = createCrudRouter('faqs');
export const pagesRouter = createCrudRouter('pages');
export const articleCategoriesRouter = createCrudRouter('article_categories');
export const formsCrudRouter = createCrudRouter('forms');
export const formSubmissionsRouter = createCrudRouter('form_submissions');
export const productsRouter = createCrudRouter('products');
export const productCategoriesRouter = createCrudRouter('product_categories');

/** Orders CRUD — blocks writes when shop module is disabled */
export const ordersRouter = Router();
const ordersCrud = createCrudRouter('orders');

async function isShopEnabled(): Promise<boolean> {
  try {
    const settings = (await getEntity('settings', 'clinic_settings')) as
      | { modules?: { shop?: { enabled?: boolean } } }
      | null;
    return settings?.modules?.shop?.enabled === true;
  } catch {
    return false;
  }
}

ordersRouter.post('/', async (req, res, next) => {
  if (!(await isShopEnabled())) {
    res.status(403).json({ error: 'Shop module is disabled' });
    return;
  }
  next();
});
ordersRouter.put('/:id', async (req, res, next) => {
  if (!(await isShopEnabled())) {
    res.status(403).json({ error: 'Shop module is disabled' });
    return;
  }
  next();
});
ordersRouter.patch('/:id', async (req, res, next) => {
  if (!(await isShopEnabled())) {
    res.status(403).json({ error: 'Shop module is disabled' });
    return;
  }
  next();
});
ordersRouter.use('/', ordersCrud);

export const settingsRouter = Router();

settingsRouter.get('/', async (_req, res) => {
  try {
    const settings = await getEntity('settings', 'clinic_settings');
    if (!settings) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }
    res.json(settings);
  } catch (err) {
    console.error('GET /settings error:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

settingsRouter.put('/', async (req, res) => {
  try {
    const body = { ...req.body, id: 'clinic_settings' };
    await upsertEntity('settings', 'clinic_settings', body);
    invalidateMaintenanceCache();
    res.json(body);
  } catch (err) {
    console.error('PUT /settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});
