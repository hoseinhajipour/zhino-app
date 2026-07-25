import React, { useCallback, useEffect, useState } from 'react';

type HealthLevel = 'healthy' | 'warning' | 'critical' | 'unknown';

type SystemStatus = {
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
    method: 'git' | 'manifest' | 'none';
    manifestUrl: string | null;
    applyConfigured: boolean;
  };
};

type GitUpdateInfo = {
  available: boolean;
  remote: string;
  branch: string | null;
  upstream: string | null;
  localSha: string | null;
  remoteSha: string | null;
  localShort: string | null;
  remoteShort: string | null;
  behind: number;
  ahead: number;
  dirty: boolean;
  updateAvailable: boolean;
  remotePackageVersion: string | null;
  latestCommitSubject: string | null;
  error?: string;
};

type UpdateCheck = {
  currentVersion: string;
  channel: string;
  method: 'git' | 'manifest' | 'none';
  checkConfigured: boolean;
  manifestUrl: string | null;
  checkedAt: string;
  status: 'up_to_date' | 'update_available' | 'not_configured' | 'error';
  latestVersion?: string;
  updateAvailable: boolean;
  autoUpdateSupported: boolean;
  applyConfigured: boolean;
  manifest?: {
    latest: string;
    title?: string;
    notes?: string;
    releasedAt?: string;
    changelogUrl?: string;
    requiresManualSteps?: boolean;
  };
  git?: GitUpdateInfo;
  message: string;
  error?: string;
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} روز و ${h} ساعت`;
  if (h > 0) return `${h} ساعت و ${m} دقیقه`;
  return `${m} دقیقه`;
}

function healthStyles(level: HealthLevel) {
  if (level === 'healthy')
    return {
      ring: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-600 text-white',
      icon: 'check_circle',
    };
  if (level === 'warning')
    return {
      ring: 'border-amber-200 bg-amber-50 text-amber-900',
      bar: 'bg-amber-500',
      badge: 'bg-amber-500 text-white',
      icon: 'warning',
    };
  if (level === 'critical')
    return {
      ring: 'border-rose-200 bg-rose-50 text-rose-900',
      bar: 'bg-rose-500',
      badge: 'bg-rose-600 text-white',
      icon: 'error',
    };
  return {
    ring: 'border-slate-200 bg-slate-50 text-slate-700',
    bar: 'bg-slate-400',
    badge: 'bg-slate-500 text-white',
    icon: 'help',
  };
}

function UsageMeter({
  label,
  percent,
  detail,
  icon,
}: {
  label: string;
  percent: number | null;
  detail: string;
  icon: string;
}) {
  const p = percent == null ? null : Math.min(100, Math.max(0, percent));
  const tone =
    p == null ? 'bg-slate-300' : p >= 90 ? 'bg-rose-500' : p >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
          <span className="text-xs font-black text-on-surface">{label}</span>
        </div>
        <span className="text-sm font-black text-on-surface tabular-nums" dir="ltr">
          {p == null ? '—' : `${p}%`}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${tone}`}
          style={{ width: `${p ?? 0}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-on-surface-variant font-medium" dir="ltr">
        {detail}
      </p>
    </div>
  );
}

export const SystemStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [update, setUpdate] = useState<UpdateCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/system/status');
      if (!res.ok) throw new Error('خطا در دریافت وضعیت سیستم');
      const data = (await res.json()) as SystemStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  }, []);

  const runUpdateCheck = useCallback(async () => {
    setCheckingUpdate(true);
    setApplyMsg(null);
    try {
      const res = await fetch('/api/system/updates/check');
      if (!res.ok) throw new Error('بررسی به‌روزرسانی ناموفق بود');
      setUpdate((await res.json()) as UpdateCheck);
    } catch (err) {
      setUpdate({
        currentVersion: status?.app.version || '—',
        channel: 'stable',
        method: 'none',
        checkConfigured: false,
        manifestUrl: null,
        checkedAt: new Date().toISOString(),
        status: 'error',
        updateAvailable: false,
        autoUpdateSupported: false,
        applyConfigured: false,
        message: err instanceof Error ? err.message : 'خطا',
      });
    } finally {
      setCheckingUpdate(false);
    }
  }, [status?.app.version]);

  const applyUpdate = async () => {
    if (!update?.updateAvailable) return;
    const target =
      update.method === 'git' && update.git?.behind
        ? `${update.git.behind} کامیت از ${update.git.upstream || 'remote'}`
        : `نسخه ${update.latestVersion}`;
    const ok = window.confirm(
      `آیا از اعمال به‌روزرسانی (${target}) مطمئن هستید؟\n${
        update.method === 'git'
          ? 'عملیات: git fetch + merge --ff-only و سپس دستور پس از pull.'
          : 'در صورت پیکربندی ناقص، عملیات متوقف می‌شود.'
      }`
    );
    if (!ok) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const res = await fetch('/api/system/updates/apply', { method: 'POST' });
      const data = (await res.json()) as { message?: string; steps?: string[] };
      setApplyMsg(
        [data.message, ...(data.steps?.length ? ['', ...data.steps.map((s) => `• ${s}`)] : [])]
          .filter(Boolean)
          .join('\n') || 'پاسخ نامشخص از سرور'
      );
      if (res.ok) void loadStatus();
    } catch {
      setApplyMsg('ارتباط با سرویس به‌روزرسانی برقرار نشد.');
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    const t = setInterval(() => void loadStatus(), 20_000);
    return () => clearInterval(t);
  }, [loadStatus]);

  useEffect(() => {
    if (status) void runUpdateCheck();
  }, [status?.app.version]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-xs font-bold">در حال جمع‌آوری وضعیت سیستم…</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 text-sm font-bold">
        {error}
      </div>
    );
  }

  if (!status) return null;

  const hs = healthStyles(status.health.level);
  const canOfferApply = !!update?.updateAvailable;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Health hero */}
      <div className={`rounded-3xl border p-5 md:p-6 shadow-sm ${hs.ring}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hs.badge}`}>
              <span className="material-symbols-outlined text-2xl">{hs.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold opacity-70 mb-0.5">وضعیت کلی سیستم</p>
              <h2 className="text-base md:text-lg font-black">{status.health.label}</h2>
              {status.health.issues.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {status.health.issues.map((issue) => (
                    <li key={issue} className="text-[11px] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">info</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="text-left" dir="ltr">
            <p className="text-3xl font-black tabular-nums">{status.health.score}</p>
            <p className="text-[10px] font-bold opacity-70">Health Score</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-black/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${hs.bar}`}
            style={{ width: `${status.health.score}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold opacity-70">
          <span>
            آخرین نمونه‌برداری:{' '}
            <span dir="ltr">{new Date(status.collectedAt).toLocaleString('fa-IR')}</span>
          </span>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="inline-flex items-center gap-1 hover:opacity-100 opacity-90 underline-offset-2 hover:underline"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            بروزرسانی وضعیت
          </button>
        </div>
      </div>

      {/* Resource meters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UsageMeter
          label="پردازنده (CPU)"
          percent={status.cpu.usagePercent}
          detail={`${status.cpu.cores} هسته · ${status.cpu.speedMHz || '—'} MHz`}
          icon="memory"
        />
        <UsageMeter
          label="حافظه (RAM)"
          percent={status.memory.usagePercent}
          detail={`${formatBytes(status.memory.usedBytes)} / ${formatBytes(status.memory.totalBytes)}`}
          icon="developer_board"
        />
        <UsageMeter
          label="فضای دیسک"
          percent={status.disk.usagePercent}
          detail={
            status.disk.available
              ? `${formatBytes(status.disk.freeBytes)} آزاد از ${formatBytes(status.disk.totalBytes)}`
              : status.disk.error || 'در دسترس نیست'
          }
          icon="hard_drive"
        />
      </div>

      {/* Host + app info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-sm font-black text-on-surface flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">dns</span>
            مشخصات سرور و سیستم‌عامل
          </h3>
          <dl className="space-y-2.5 text-xs">
            {[
              ['سیستم‌عامل', status.host.platformLabel],
              ['معماری', status.host.arch],
              ['Hostname', status.host.hostname],
              ['آپ‌تایم سرور', formatUptime(status.host.uptimeSec)],
              ['مدل CPU', status.cpu.model],
              [
                'Load Average',
                status.host.platform === 'win32'
                  ? 'در ویندوز پشتیبانی محدود'
                  : status.cpu.loadAvg.join(' / '),
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
              >
                <dt className="text-on-surface-variant font-bold shrink-0">{k}</dt>
                <dd className="font-bold text-on-surface text-left break-all" dir="ltr">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-sm font-black text-on-surface flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">terminal</span>
            زمان اجرای نرم‌افزار
          </h3>
          <dl className="space-y-2.5 text-xs">
            {[
              ['نام اپلیکیشن', status.app.name],
              ['نسخه فعلی', `v${status.app.version}`],
              ['کانال', status.app.channel],
              ['Node.js', status.app.node],
              ['محیط', status.app.env],
              ['PID', String(status.app.pid)],
              ['آپ‌تایم پروسه', formatUptime(status.app.uptimeSec)],
              ['حافظه پروسه (RSS)', formatBytes(status.memory.processRssBytes)],
              [
                'دیتابیس',
                status.database.ok
                  ? `متصل · ${status.database.latencyMs ?? '—'} ms`
                  : `قطع · ${status.database.error || 'خطا'}`,
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
              >
                <dt className="text-on-surface-variant font-bold shrink-0">{k}</dt>
                <dd
                  className={`font-bold text-left break-all ${
                    k === 'دیتابیس' && !status.database.ok ? 'text-rose-600' : 'text-on-surface'
                  }`}
                  dir="ltr"
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Version / updates */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
              <span className="material-symbols-outlined">system_update</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-on-surface">نسخه نرم‌افزار و به‌روزرسانی</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                بررسی و اعمال به‌روزرسانی از مخزن git (
                <span dir="ltr">fetch / pull --ff-only</span>)
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={checkingUpdate}
            onClick={() => void runUpdateCheck()}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${checkingUpdate ? 'animate-spin' : ''}`}>
              {checkingUpdate ? 'progress_activity' : 'travel_explore'}
            </span>
            بررسی نسخه جدید
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-[10px] font-bold text-on-surface-variant">نسخه نصب‌شده</p>
              <p className="text-xl font-black text-primary" dir="ltr">
                v{status.app.version}
              </p>
              {update?.git?.localShort && (
                <p className="text-[10px] font-bold text-on-surface-variant mt-1" dir="ltr">
                  {update.git.branch || 'HEAD'}@{update.git.localShort}
                </p>
              )}
            </div>
            {update?.latestVersion && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-[10px] font-bold text-on-surface-variant">
                  {update.method === 'git' ? 'آخرین روی remote' : 'آخرین نسخه منتشرشده'}
                </p>
                <p className="text-xl font-black text-on-surface" dir="ltr">
                  {update.latestVersion.startsWith('git:')
                    ? update.latestVersion
                    : `v${update.latestVersion}`}
                </p>
                {update.git?.remoteShort && update.git.behind > 0 && (
                  <p className="text-[10px] font-bold text-on-surface-variant mt-1" dir="ltr">
                    {update.git.behind} commit behind · {update.git.remoteShort}
                  </p>
                )}
              </div>
            )}
            <div
              className={`rounded-full px-3 py-1 text-[11px] font-black ${
                update?.status === 'update_available'
                  ? 'bg-amber-100 text-amber-900'
                  : update?.status === 'up_to_date'
                    ? 'bg-emerald-100 text-emerald-800'
                    : update?.status === 'not_configured'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-rose-50 text-rose-700'
              }`}
            >
              {update?.status === 'update_available'
                ? update.method === 'git'
                  ? 'کامیت جدید روی remote'
                  : 'آپدیت موجود است'
                : update?.status === 'up_to_date'
                  ? 'به‌روز هستید'
                  : update?.status === 'not_configured'
                    ? 'روش آپدیت پیکربندی نشده'
                    : update
                      ? 'خطا در بررسی'
                      : 'در انتظار بررسی'}
            </div>
            {(update?.method || status.update.method) !== 'none' && (
              <div className="rounded-full px-3 py-1 text-[11px] font-black bg-sky-50 text-sky-800" dir="ltr">
                via {(update?.method || status.update.method).toUpperCase()}
              </div>
            )}
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
            {update?.message ||
              'اگر این نصب clone از git باشد، دکمهٔ بررسی با git fetch وضعیت را مشخص می‌کند.'}
          </p>

          {update?.git?.dirty && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-950 text-[11px] font-bold p-3">
              پوشهٔ کاری تغییرات ذخیره‌نشده دارد؛ تا زمان commit/stash، pull مسدود می‌شود مگر
              ZHINO_UPDATE_ALLOW_DIRTY=1.
            </div>
          )}

          {update?.manifest?.notes && (
            <pre className="text-[11px] whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 font-medium text-on-surface">
              {update.manifest.notes}
            </pre>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canOfferApply || applying}
              onClick={() => void applyUpdate()}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                !update?.updateAvailable
                  ? 'نسخه جدیدی نیست'
                  : update.method === 'git'
                    ? 'اجرای git pull --ff-only (نیاز به ZHINO_UPDATE_APPLY=1)'
                    : 'شروع به‌روزرسانی خودکار'
              }
            >
              <span className={`material-symbols-outlined text-base ${applying ? 'animate-spin' : ''}`}>
                {applying ? 'progress_activity' : 'download'}
              </span>
              {applying
                ? 'در حال اعمال…'
                : update?.method === 'git'
                  ? 'اعمال با Git Pull'
                  : 'به‌روزرسانی خودکار'}
            </button>
            {update?.updateAvailable && !update.applyConfigured && (
              <span className="text-[10px] font-bold text-amber-700">
                برای اعمال، ZHINO_UPDATE_APPLY=1 را در .env سرور تنظیم کنید
              </span>
            )}
            {update?.manifest?.changelogUrl && (
              <a
                href={update.manifest.changelogUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container-low"
              >
                مشاهده تغییرات
              </a>
            )}
          </div>

          {applyMsg && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-950 text-[11px] font-bold p-3 leading-relaxed whitespace-pre-wrap" dir="auto">
              {applyMsg}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3 text-[11px] text-on-surface-variant leading-relaxed space-y-1">
            <p className="font-black text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              مسیر به‌روزرسانی با Git
            </p>
            <ul className="list-disc pr-4 space-y-0.5">
              <li>
                بررسی: <code className="text-[10px]" dir="ltr">git fetch</code> و مقایسه با{' '}
                <code className="text-[10px]" dir="ltr">origin/&lt;branch&gt;</code>
              </li>
              <li>
                اعمال: <code className="text-[10px]" dir="ltr">git merge --ff-only</code> سپس{' '}
                <code className="text-[10px]" dir="ltr">npm install && npm run build</code>
              </li>
              <li>
                فعال‌سازی اعمال فقط با{' '}
                <code className="text-[10px]" dir="ltr">
                  ZHINO_UPDATE_APPLY=1
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
