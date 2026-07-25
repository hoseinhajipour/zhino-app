import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// This file lives in server/lib — project root is two levels up.
export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const ENV_PATH = path.join(PROJECT_ROOT, '.env');
export const INSTALLED_PATH = path.join(PROJECT_ROOT, '.installed');
/** Present while wizard steps 2–3 are still pending after DB setup. */
export const INSTALLING_PATH = path.join(PROJECT_ROOT, '.installing');

export function isInstallLocked(): boolean {
  return fs.existsSync(INSTALLED_PATH);
}

export function isInstallInProgress(): boolean {
  return fs.existsSync(INSTALLING_PATH);
}

export function markInstallInProgress(): void {
  fs.writeFileSync(INSTALLING_PATH, `${new Date().toISOString()}\n`, 'utf8');
}

export function clearInstallInProgress(): void {
  if (fs.existsSync(INSTALLING_PATH)) {
    fs.unlinkSync(INSTALLING_PATH);
  }
}

export function writeInstallLock(): void {
  clearInstallInProgress();
  fs.writeFileSync(INSTALLED_PATH, `${new Date().toISOString()}\n`, 'utf8');
}

export function readEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function escapeEnvValue(value: string): string {
  if (/[\s#"']/.test(value) || value === '') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

/** Merge keys into .env and reload dotenv into process.env. */
export function writeEnvFile(updates: Record<string, string | number>): void {
  const current = readEnvFile();
  for (const [k, v] of Object.entries(updates)) {
    current[k] = String(v);
  }
  const lines = Object.entries(current).map(([k, v]) => `${k}=${escapeEnvValue(v)}`);
  fs.writeFileSync(ENV_PATH, `${lines.join('\n')}\n`, 'utf8');
  dotenv.config({ path: ENV_PATH, override: true });
}
