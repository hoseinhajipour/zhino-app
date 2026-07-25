import type { PageScreen, SitePageId } from '../types';
import type { AdminTabId } from './adminPermissions';
import { SYSTEM_SITE_PAGE_IDS } from './sitePageDefaults';

/**
 * Action the admin dashboard should perform right after it mounts.
 * Used by the public-site admin toolbar, which has no direct access to the
 * dashboard's internal tab/editor state.
 */
export type AdminIntent =
  | { kind: 'tab'; tab: AdminTabId }
  | { kind: 'new-page' }
  | { kind: 'new-article' }
  | { kind: 'edit-page'; pageId: string }
  | { kind: 'edit-service'; serviceId: string }
  | { kind: 'edit-article'; articleId: string };

const STORAGE_KEY = 'zhino_admin_intent';

export function setAdminIntent(intent: AdminIntent): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch (err) {
    console.error('Unable to store admin intent', err);
  }
}

/** Reads and clears the pending intent so a refresh does not repeat it. */
export function consumeAdminIntent(): AdminIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as AdminIntent;
    return parsed && typeof parsed.kind === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

/** Site page id backing a built-in screen (home / about / contact / blog). */
export function getSystemPageIdForScreen(screen: PageScreen): SitePageId | null {
  return (SYSTEM_SITE_PAGE_IDS as string[]).includes(screen) ? (screen as SitePageId) : null;
}
