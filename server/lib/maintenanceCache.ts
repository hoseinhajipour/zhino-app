import { getEntity } from '../db';

let maintenanceCache: { value: boolean; at: number } = { value: false, at: 0 };
const MAINT_CACHE_MS = 15_000;

export function invalidateMaintenanceCache() {
  maintenanceCache = { value: false, at: 0 };
}

export async function isMaintenanceModeCached(): Promise<boolean> {
  const now = Date.now();
  if (now - maintenanceCache.at < MAINT_CACHE_MS && maintenanceCache.at > 0) {
    return maintenanceCache.value;
  }
  try {
    const settings = (await getEntity('settings', 'clinic_settings')) as
      | { maintenanceMode?: boolean }
      | null;
    maintenanceCache = { value: !!settings?.maintenanceMode, at: now };
  } catch {
    maintenanceCache = { value: false, at: now };
  }
  return maintenanceCache.value;
}
