import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {
  APP_CHANNEL,
  APP_NAME,
  APP_VERSION,
  compareSemver,
  type UpdateManifest,
} from './appVersion';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const require = createRequire(import.meta.url);

export type HealthLevel = 'healthy' | 'warning' | 'critical' | 'unknown';

export type SystemStatusPayload = {
  collectedAt: string;
  app: {
    name: string;
    version: string;
    channel: string;
    node: string;
    pid: number;
    uptimeSec: number;
    env: string;
  };
  host: {
    hostname: string;
    platform: string;
    platformLabel: string;
    arch: string;
    release: string;
    type: string;
    uptimeSec: number;
  };
  cpu: {
    model: string;
    cores: number;
    speedMHz: number;
    loadAvg: number[];
    usagePercent: number | null;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usagePercent: number;
    processRssBytes: number;
  };
  disk: {
    path: string;
    totalBytes: number | null;
    freeBytes: number | null;
    usedBytes: number | null;
    usagePercent: number | null;
    available: boolean;
    error?: string;
  };
  database: {
    ok: boolean;
    latencyMs: number | null;
    error?: string;
  };
  health: {
    level: HealthLevel;
    label: string;
    score: number;
    issues: string[];
  };
  update: {
    checkConfigured: boolean;
    manifestUrl: string | null;
    applyConfigured: boolean;
  };
};

function readPackageVersion(): string {
  try {
    const pkg = require(path.join(projectRoot, 'package.json')) as { version?: string };
    if (pkg.version && pkg.version !== '0.0.0') return pkg.version;
  } catch {
    /* ignore */
  }
  return APP_VERSION;
}

function platformLabel(platform: NodeJS.Platform, release: string): string {
  if (platform === 'win32') return `Windows ${release}`;
  if (platform === 'darwin') return `macOS ${release}`;
  if (platform === 'linux') return `Linux ${release}`;
  return `${platform} ${release}`;
}

function sampleCpuUsage(sampleMs = 220): Promise<number | null> {
  const cpus = os.cpus();
  if (!cpus.length) return Promise.resolve(null);

  const read = () =>
    cpus.map((c) => {
      const t = c.times;
      const total = t.user + t.nice + t.sys + t.idle + t.irq;
      return { idle: t.idle, total };
    });

  const start = read();
  return new Promise((resolve) => {
    setTimeout(() => {
      const end = os.cpus().map((c) => {
        const t = c.times;
        const total = t.user + t.nice + t.sys + t.idle + t.irq;
        return { idle: t.idle, total };
      });
      let idleDelta = 0;
      let totalDelta = 0;
      for (let i = 0; i < start.length; i++) {
        idleDelta += end[i].idle - start[i].idle;
        totalDelta += end[i].total - start[i].total;
      }
      if (totalDelta <= 0) {
        resolve(null);
        return;
      }
      const usage = 1 - idleDelta / totalDelta;
      resolve(Math.round(Math.min(100, Math.max(0, usage * 100)) * 10) / 10);
    }, sampleMs);
  });
}

async function readDisk(targetPath: string): Promise<SystemStatusPayload['disk']> {
  try {
    // Node 18.15+ / 19+
    const statfs = (fs as typeof fs & { statfs?: (p: string) => Promise<{ bsize: number; blocks: number; bavail: number; bfree: number }> })
      .statfs;
    if (!statfs) {
      return {
        path: targetPath,
        totalBytes: null,
        freeBytes: null,
        usedBytes: null,
        usagePercent: null,
        available: false,
        error: 'statfs unsupported on this Node version',
      };
    }
    const s = await statfs(targetPath);
    const totalBytes = s.blocks * s.bsize;
    const freeBytes = s.bavail * s.bsize;
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usagePercent =
      totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : null;
    return {
      path: targetPath,
      totalBytes,
      freeBytes,
      usedBytes,
      usagePercent,
      available: true,
    };
  } catch (err) {
    return {
      path: targetPath,
      totalBytes: null,
      freeBytes: null,
      usedBytes: null,
      usagePercent: null,
      available: false,
      error: err instanceof Error ? err.message : 'disk read failed',
    };
  }
}

function computeHealth(input: {
  memPercent: number;
  diskPercent: number | null;
  cpuPercent: number | null;
  dbOk: boolean;
}): SystemStatusPayload['health'] {
  const issues: string[] = [];
  let score = 100;

  if (!input.dbOk) {
    issues.push('اتصال پایگاه‌داده برقرار نیست');
    score -= 40;
  }
  if (input.memPercent >= 92) {
    issues.push('مصرف RAM بحرانی است');
    score -= 30;
  } else if (input.memPercent >= 80) {
    issues.push('مصرف RAM بالا است');
    score -= 15;
  }
  if (input.diskPercent != null) {
    if (input.diskPercent >= 95) {
      issues.push('فضای دیسک تقریباً پر است');
      score -= 30;
    } else if (input.diskPercent >= 85) {
      issues.push('فضای دیسک رو به اتمام است');
      score -= 15;
    }
  }
  if (input.cpuPercent != null) {
    if (input.cpuPercent >= 95) {
      issues.push('بار CPU بسیار بالاست');
      score -= 20;
    } else if (input.cpuPercent >= 85) {
      issues.push('بار CPU بالاست');
      score -= 10;
    }
  }

  score = Math.max(0, Math.min(100, score));
  let level: HealthLevel = 'healthy';
  let label = 'سیستم در وضعیت سالم است';
  if (score < 50) {
    level = 'critical';
    label = 'وضعیت سیستم بحرانی است — نیاز به رسیدگی فوری';
  } else if (score < 80) {
    level = 'warning';
    label = 'سیستم پایدار است ولی چند هشدار دارد';
  } else if (issues.length) {
    level = 'warning';
    label = 'سیستم عمدتاً سالم است با هشدار جزئی';
  }

  return { level, label, score, issues };
}

export async function collectSystemStatus(
  checkDb: () => Promise<{ ok: boolean; latencyMs: number | null; error?: string }>
): Promise<SystemStatusPayload> {
  const [cpuUsage, disk, database] = await Promise.all([
    sampleCpuUsage(),
    readDisk(projectRoot),
    checkDb(),
  ]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 1000) / 10;
  const cpus = os.cpus();
  const updateUrl = process.env.ZHINO_UPDATE_URL?.trim() || '';

  const health = computeHealth({
    memPercent,
    diskPercent: disk.usagePercent,
    cpuPercent: cpuUsage,
    dbOk: database.ok,
  });

  return {
    collectedAt: new Date().toISOString(),
    app: {
      name: APP_NAME,
      version: readPackageVersion(),
      channel: APP_CHANNEL,
      node: process.version,
      pid: process.pid,
      uptimeSec: Math.floor(process.uptime()),
      env: process.env.NODE_ENV || 'development',
    },
    host: {
      hostname: os.hostname(),
      platform: os.platform(),
      platformLabel: platformLabel(os.platform(), os.release()),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      uptimeSec: Math.floor(os.uptime()),
    },
    cpu: {
      model: cpus[0]?.model?.trim() || 'Unknown CPU',
      cores: cpus.length,
      speedMHz: cpus[0]?.speed || 0,
      loadAvg: os.loadavg().map((n) => Math.round(n * 100) / 100),
      usagePercent: cpuUsage,
    },
    memory: {
      totalBytes: totalMem,
      freeBytes: freeMem,
      usedBytes: usedMem,
      usagePercent: memPercent,
      processRssBytes: process.memoryUsage().rss,
    },
    disk,
    database,
    health,
    update: {
      checkConfigured: Boolean(updateUrl),
      manifestUrl: updateUrl || null,
      applyConfigured: process.env.ZHINO_UPDATE_APPLY === '1',
    },
  };
}

export type UpdateCheckResult = {
  currentVersion: string;
  channel: string;
  checkConfigured: boolean;
  manifestUrl: string | null;
  checkedAt: string;
  status: 'up_to_date' | 'update_available' | 'not_configured' | 'error';
  latestVersion?: string;
  updateAvailable: boolean;
  autoUpdateSupported: boolean;
  applyConfigured: boolean;
  manifest?: UpdateManifest;
  message: string;
  error?: string;
};

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = readPackageVersion();
  const manifestUrl = process.env.ZHINO_UPDATE_URL?.trim() || '';
  const applyConfigured = process.env.ZHINO_UPDATE_APPLY === '1';
  const checkedAt = new Date().toISOString();

  if (!manifestUrl) {
    return {
      currentVersion,
      channel: APP_CHANNEL,
      checkConfigured: false,
      manifestUrl: null,
      checkedAt,
      status: 'not_configured',
      updateAvailable: false,
      autoUpdateSupported: false,
      applyConfigured,
      message:
        'آدرس سرور به‌روزرسانی تنظیم نشده است. متغیر ZHINO_UPDATE_URL را در محیط سرور تعریف کنید.',
    };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(manifestUrl, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': `ZhinoClinic/${currentVersion}`,
        ...(process.env.ZHINO_UPDATE_TOKEN
          ? { Authorization: `Bearer ${process.env.ZHINO_UPDATE_TOKEN}` }
          : {}),
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        currentVersion,
        channel: APP_CHANNEL,
        checkConfigured: true,
        manifestUrl,
        checkedAt,
        status: 'error',
        updateAvailable: false,
        autoUpdateSupported: false,
        applyConfigured,
        message: `سرور به‌روزرسانی پاسخ نامعتبر داد (${res.status}).`,
        error: `HTTP ${res.status}`,
      };
    }

    const manifest = (await res.json()) as UpdateManifest;
    if (!manifest?.latest || typeof manifest.latest !== 'string') {
      return {
        currentVersion,
        channel: APP_CHANNEL,
        checkConfigured: true,
        manifestUrl,
        checkedAt,
        status: 'error',
        updateAvailable: false,
        autoUpdateSupported: false,
        applyConfigured,
        message: 'فرمت manifest نامعتبر است (فیلد latest الزامی است).',
        error: 'invalid_manifest',
      };
    }

    const cmp = compareSemver(currentVersion, manifest.latest);
    const updateAvailable = cmp < 0;

    return {
      currentVersion,
      channel: APP_CHANNEL,
      checkConfigured: true,
      manifestUrl,
      checkedAt,
      status: updateAvailable ? 'update_available' : 'up_to_date',
      latestVersion: manifest.latest,
      updateAvailable,
      autoUpdateSupported: !!manifest.autoUpdateSupported,
      applyConfigured,
      manifest,
      message: updateAvailable
        ? `نسخه جدید ${manifest.latest} منتشر شده است.`
        : `شما از آخرین نسخه (${currentVersion}) استفاده می‌کنید.`,
    };
  } catch (err) {
    return {
      currentVersion,
      channel: APP_CHANNEL,
      checkConfigured: true,
      manifestUrl,
      checkedAt,
      status: 'error',
      updateAvailable: false,
      autoUpdateSupported: false,
      applyConfigured,
      message: 'خطا در ارتباط با سرور به‌روزرسانی.',
      error: err instanceof Error ? err.message : 'fetch_failed',
    };
  }
}

/**
 * Auto-apply pipeline (staged for future).
 * Deliberately gated: never mutates the install unless ZHINO_UPDATE_APPLY=1
 * and a verified apply handler is registered.
 */
export type UpdateApplyResult = {
  ok: boolean;
  status: 'started' | 'blocked' | 'not_configured' | 'unsupported';
  message: string;
  steps?: string[];
};

export async function applyUpdateSafe(): Promise<UpdateApplyResult> {
  const check = await checkForUpdates();
  if (!check.checkConfigured) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'سرور به‌روزرسانی پیکربندی نشده است.',
    };
  }
  if (!check.updateAvailable) {
    return {
      ok: false,
      status: 'blocked',
      message: 'نسخه جدیدی برای نصب وجود ندارد.',
    };
  }
  if (!check.applyConfigured) {
    return {
      ok: false,
      status: 'unsupported',
      message:
        'اعمال خودکار هنوز روی این سرور فعال نشده است. ZHINO_UPDATE_APPLY=1 و اسکریپت اعمال امن باید پیکربندی شود.',
      steps: [
        'دانلود بسته از downloadUrl',
        'اعتبارسنجی checksum',
        'استقرار در پوشه staging',
        'اجرای migration',
        'جابه‌جایی اتمیک و ری‌استارت سرویس',
      ],
    };
  }

  // Future: invoke real apply runner here.
  return {
    ok: false,
    status: 'unsupported',
    message:
      'موتور اعمال خودکار در این نسخه آماده است ولی هنوز به اسکریپت استقرار متصل نشده. به‌روزرسانی دستی توصیه می‌شود.',
    steps: check.manifest?.notes ? [check.manifest.notes] : undefined,
  };
}
