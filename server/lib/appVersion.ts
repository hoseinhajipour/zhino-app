/**
 * Application version & update channel — single source of truth for the runtime.
 * Keep in sync with package.json "version" (server reads package.json; this is the typed export for docs).
 */
export const APP_NAME = 'Zhino Clinic App';
export const APP_VERSION = '1.0.0';
export const APP_CHANNEL = 'stable' as const;

/** Expected remote manifest shape (future update server). */
export type UpdateManifest = {
  latest: string;
  minCompatible?: string;
  channel?: string;
  releasedAt?: string;
  title?: string;
  notes?: string;
  /** Package download URL (zip/tarball) — used by auto-updater when enabled */
  downloadUrl?: string;
  checksum?: string;
  /** When true, clients may offer one-click apply */
  autoUpdateSupported?: boolean;
  /** Breaking change notice */
  requiresManualSteps?: boolean;
  changelogUrl?: string;
};

export type SemverCompare = -1 | 0 | 1;

export function parseSemver(v: string): number[] {
  const cleaned = String(v || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('+')[0];
  const parts = cleaned.split('.').map((p) => Number.parseInt(p, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function compareSemver(a: string, b: string): SemverCompare {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}
