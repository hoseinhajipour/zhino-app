import { Router } from 'express';
import { pingDatabase } from '../db';
import {
  applyUpdateSafe,
  checkForUpdates,
  collectSystemStatus,
} from '../lib/systemStatus';

export const systemRouter = Router();

systemRouter.get('/status', async (_req, res) => {
  try {
    const status = await collectSystemStatus(async () => {
      const started = Date.now();
      try {
        await pingDatabase();
        return { ok: true, latencyMs: Date.now() - started };
      } catch (err) {
        return {
          ok: false,
          latencyMs: Date.now() - started,
          error: err instanceof Error ? err.message : 'db_error',
        };
      }
    });
    res.json(status);
  } catch (err) {
    console.error('GET /api/system/status error:', err);
    res.status(500).json({ error: 'Failed to collect system status' });
  }
});

systemRouter.get('/updates/check', async (_req, res) => {
  try {
    const result = await checkForUpdates();
    res.json(result);
  } catch (err) {
    console.error('GET /api/system/updates/check error:', err);
    res.status(500).json({ error: 'Failed to check updates' });
  }
});

systemRouter.post('/updates/apply', async (_req, res) => {
  try {
    const result = await applyUpdateSafe();
    const code = result.ok
      ? 202
      : result.status === 'not_configured'
        ? 400
        : result.status === 'error'
          ? 500
          : 409;
    res.status(code).json(result);
  } catch (err) {
    console.error('POST /api/system/updates/apply error:', err);
    res.status(500).json({ error: 'Failed to apply update' });
  }
});
