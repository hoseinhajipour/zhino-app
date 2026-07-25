import type { Request, Response, NextFunction } from 'express';

function extractToken(req: Request): string {
  const header = req.header('authorization') || '';
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (bearer?.[1]) return bearer[1].trim();
  const custom = req.header('x-zhino-token');
  return custom?.trim() || '';
}

/** Public write endpoints that must stay open for the live site. */
export function isPublicWrite(req: Request): boolean {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  if (req.method === 'POST' && /^\/api\/forms\/[^/]+\/submit\/?$/.test(url)) return true;
  if (req.method === 'POST' && /^\/api\/users\/(login|register)\/?$/.test(url)) return true;
  if (url.startsWith('/api/install')) return true;
  return false;
}

/**
 * When ZHINO_API_TOKEN is set, require Bearer / X-Zhino-Token for mutating requests.
 * GET/HEAD/OPTIONS stay public so the site frontend keeps working.
 */
export function requireApiTokenForWrites(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  if (isPublicWrite(req)) {
    next();
    return;
  }

  const expected = (process.env.ZHINO_API_TOKEN || '').trim();
  if (!expected) {
    next();
    return;
  }

  const provided = extractToken(req);
  if (!provided || provided !== expected) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid ZHINO_API_TOKEN required (Authorization: Bearer … or X-Zhino-Token)',
    });
    return;
  }

  next();
}

export function logApiTokenStatus(): void {
  const token = (process.env.ZHINO_API_TOKEN || '').trim();
  if (!token) {
    console.warn(
      '[zhino] ZHINO_API_TOKEN is empty — API writes are open. Set a token for CLI/MCP protection.'
    );
  } else {
    console.log('[zhino] ZHINO_API_TOKEN is set — mutating /api routes require the token.');
  }
}
