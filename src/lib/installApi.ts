export type InstallStatus = {
  needsInstall: boolean;
  installed: boolean;
  installing?: boolean;
  dbConnected: boolean;
  resumeStep?: number;
  steps: string[];
};

async function installFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      // keep raw
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function fetchInstallStatus(): Promise<InstallStatus> {
  return installFetch<InstallStatus>('/api/install/status');
}

export function installDatabase(input: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): Promise<{ ok: boolean; alreadyInstalled?: boolean }> {
  return installFetch('/api/install/db', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function installSite(input: {
  siteName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}): Promise<{ ok: boolean }> {
  return installFetch('/api/install/site', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function installAdmin(input: {
  name: string;
  username: string;
  password: string;
  mobile?: string;
  email?: string;
}): Promise<{ ok: boolean }> {
  return installFetch('/api/install/admin', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function completeInstall(): Promise<{ ok: boolean }> {
  return installFetch('/api/install/complete', { method: 'POST', body: '{}' });
}
