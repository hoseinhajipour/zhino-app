import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, '../..');

const GIT_TIMEOUT_MS = 60_000;

export type GitUpdateInfo = {
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

function gitEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    LANG: 'C',
  };
}

async function runGit(
  args: string[],
  opts?: { timeoutMs?: number; allowFail?: boolean }
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      cwd: projectRoot,
      env: gitEnv(),
      timeout: opts?.timeoutMs ?? GIT_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
    return {
      stdout: String(stdout || '').trim(),
      stderr: String(stderr || '').trim(),
      code: 0,
    };
  } catch (err) {
    const e = err as {
      code?: number | string;
      stdout?: string;
      stderr?: string;
      message?: string;
      killed?: boolean;
    };
    if (opts?.allowFail) {
      return {
        stdout: String(e.stdout || '').trim(),
        stderr: String(e.stderr || e.message || '').trim(),
        code: typeof e.code === 'number' ? e.code : 1,
      };
    }
    const detail = String(e.stderr || e.message || 'git command failed').trim();
    throw new Error(detail || 'git command failed');
  }
}

function shortSha(sha: string | null | undefined): string | null {
  if (!sha) return null;
  return sha.slice(0, 7);
}

function configuredRemote(): string {
  return (process.env.ZHINO_UPDATE_GIT_REMOTE || 'origin').trim() || 'origin';
}

function configuredBranch(): string | null {
  const b = process.env.ZHINO_UPDATE_GIT_BRANCH?.trim();
  return b || null;
}

async function isGitRepo(): Promise<boolean> {
  const r = await runGit(['rev-parse', '--is-inside-work-tree'], { allowFail: true });
  return r.code === 0 && r.stdout === 'true';
}

async function currentBranch(): Promise<string | null> {
  const r = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true });
  if (r.code !== 0 || !r.stdout || r.stdout === 'HEAD') return null;
  return r.stdout;
}

async function resolveUpstream(branch: string | null, remote: string): Promise<string | null> {
  const tracking = await runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
    allowFail: true,
  });
  if (tracking.code === 0 && tracking.stdout) return tracking.stdout;

  const preferred = configuredBranch() || branch;
  if (!preferred) return null;
  const candidate = `${remote}/${preferred}`;
  const exists = await runGit(['rev-parse', '--verify', candidate], { allowFail: true });
  return exists.code === 0 ? candidate : null;
}

async function parseRemotePackageVersion(upstream: string): Promise<string | null> {
  const r = await runGit(['show', `${upstream}:package.json`], { allowFail: true });
  if (r.code !== 0 || !r.stdout) return null;
  try {
    const pkg = JSON.parse(r.stdout) as { version?: string };
    return pkg.version || null;
  } catch {
    return null;
  }
}

/**
 * Fetch remote refs and report how far local HEAD is behind/ahead.
 */
export async function inspectGitUpdates(options?: {
  fetch?: boolean;
}): Promise<GitUpdateInfo> {
  const remote = configuredRemote();
  const base: GitUpdateInfo = {
    available: false,
    remote,
    branch: null,
    upstream: null,
    localSha: null,
    remoteSha: null,
    localShort: null,
    remoteShort: null,
    behind: 0,
    ahead: 0,
    dirty: false,
    updateAvailable: false,
    remotePackageVersion: null,
    latestCommitSubject: null,
  };

  try {
    if (!(await isGitRepo())) {
      return { ...base, error: 'این نصب یک مخزن git نیست.' };
    }

    const branch = await currentBranch();
    const localShaRes = await runGit(['rev-parse', 'HEAD']);
    const localSha = localShaRes.stdout;
    const dirtyRes = await runGit(['status', '--porcelain'], { allowFail: true });
    const dirty = dirtyRes.code === 0 && dirtyRes.stdout.length > 0;

    if (options?.fetch !== false) {
      const fetchRes = await runGit(['fetch', remote, '--prune'], {
        timeoutMs: 90_000,
        allowFail: true,
      });
      if (fetchRes.code !== 0) {
        return {
          ...base,
          available: true,
          branch,
          localSha,
          localShort: shortSha(localSha),
          dirty,
          error: fetchRes.stderr || `git fetch ${remote} ناموفق بود.`,
        };
      }
    }

    const upstream = await resolveUpstream(branch, remote);
    if (!upstream) {
      return {
        ...base,
        available: true,
        branch,
        localSha,
        localShort: shortSha(localSha),
        dirty,
        error:
          'شاخهٔ بالادستی (upstream) پیدا نشد. remote و branch را بررسی کنید یا ZHINO_UPDATE_GIT_BRANCH را تنظیم کنید.',
      };
    }

    const remoteShaRes = await runGit(['rev-parse', upstream]);
    const remoteSha = remoteShaRes.stdout;
    const behindRes = await runGit(['rev-list', '--count', `HEAD..${upstream}`]);
    const aheadRes = await runGit(['rev-list', '--count', `${upstream}..HEAD`]);
    const behind = Number.parseInt(behindRes.stdout, 10) || 0;
    const ahead = Number.parseInt(aheadRes.stdout, 10) || 0;

    let latestCommitSubject: string | null = null;
    if (behind > 0) {
      const log = await runGit(['log', '-1', '--pretty=%s', upstream], { allowFail: true });
      if (log.code === 0 && log.stdout) latestCommitSubject = log.stdout;
    }

    const remotePackageVersion = await parseRemotePackageVersion(upstream);

    return {
      available: true,
      remote,
      branch,
      upstream,
      localSha,
      remoteSha,
      localShort: shortSha(localSha),
      remoteShort: shortSha(remoteSha),
      behind,
      ahead,
      dirty,
      updateAvailable: behind > 0,
      remotePackageVersion,
      latestCommitSubject,
    };
  } catch (err) {
    return {
      ...base,
      error: err instanceof Error ? err.message : 'خطا در بررسی git',
    };
  }
}

export type GitApplyResult = {
  ok: boolean;
  status: 'started' | 'blocked' | 'not_configured' | 'unsupported' | 'error';
  message: string;
  steps?: string[];
  pulledSha?: string | null;
};

async function runShellCommand(command: string): Promise<{ ok: boolean; output: string }> {
  const isWin = process.platform === 'win32';
  try {
    const { stdout, stderr } = await execFileAsync(isWin ? 'cmd.exe' : 'bash', isWin ? ['/d', '/s', '/c', command] : ['-lc', command], {
      cwd: projectRoot,
      env: process.env,
      timeout: 10 * 60_000,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    const output = [stdout, stderr].map((s) => String(s || '').trim()).filter(Boolean).join('\n');
    return { ok: true, output };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    const output = [e.stdout, e.stderr, e.message]
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .join('\n');
    return { ok: false, output };
  }
}

/**
 * Fast-forward pull from configured upstream, then optional post-pull script.
 */
export async function applyGitUpdate(): Promise<GitApplyResult> {
  const steps: string[] = [];
  const info = await inspectGitUpdates({ fetch: true });

  if (!info.available) {
    return {
      ok: false,
      status: 'not_configured',
      message: info.error || 'مخزن git در دسترس نیست.',
      steps,
    };
  }

  if (info.error && !info.upstream) {
    return { ok: false, status: 'error', message: info.error, steps };
  }

  if (!info.updateAvailable) {
    return {
      ok: false,
      status: 'blocked',
      message: 'نسخه جدیدی در remote وجود ندارد.',
      steps,
    };
  }

  if (info.dirty && process.env.ZHINO_UPDATE_ALLOW_DIRTY !== '1') {
    return {
      ok: false,
      status: 'blocked',
      message:
        'پوشهٔ کاری تغییرات ذخیره‌نشده دارد. ابتدا commit/stash کنید یا ZHINO_UPDATE_ALLOW_DIRTY=1 را فقط در صورت آگاهی تنظیم کنید.',
      steps,
    };
  }

  if (info.ahead > 0) {
    return {
      ok: false,
      status: 'blocked',
      message: `شاخهٔ محلی ${info.ahead} کامیت جلوتر از remote است؛ pull با fast-forward ممکن نیست.`,
      steps,
    };
  }

  const upstream = info.upstream!;
  steps.push(`git fetch ${info.remote}`);
  steps.push(`git merge --ff-only ${upstream}`);

  try {
    await runGit(['merge', '--ff-only', upstream], { timeoutMs: 90_000 });
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      message: err instanceof Error ? err.message : 'git merge --ff-only ناموفق بود.',
      steps,
    };
  }

  const newHead = await runGit(['rev-parse', 'HEAD'], { allowFail: true });
  const pulledSha = newHead.code === 0 ? newHead.stdout : null;
  steps.push(`HEAD → ${shortSha(pulledSha) || '—'}`);

  const post =
    process.env.ZHINO_UPDATE_POST_PULL?.trim() ||
    (process.env.ZHINO_UPDATE_SKIP_BUILD === '1' ? '' : 'npm install && npm run build');

  if (post) {
    steps.push(post);
    const postRes = await runShellCommand(post);
    if (!postRes.ok) {
      return {
        ok: false,
        status: 'error',
        message: `کد با git گرفته شد، ولی دستور پس از pull شکست خورد:\n${postRes.output.slice(0, 1500)}`,
        steps,
        pulledSha,
      };
    }
  }

  return {
    ok: true,
    status: 'started',
    message:
      `به‌روزرسانی با git اعمال شد (${shortSha(pulledSha)}).` +
      ' در صورت نیاز سرویس را ری‌استارت کنید تا تغییرات runtime بارگذاری شوند.',
    steps,
    pulledSha,
  };
}
