import type { ServiceBlock, ServiceBlockType } from '../../types';
import type { ContainerColumn } from '../../lib/containerColumn';

export type BuilderClipboard =
  | { kind: 'block'; block: ServiceBlock }
  | { kind: 'blocks'; blocks: ServiceBlock[] }
  | { kind: 'style'; type: ServiceBlockType; props: Record<string, unknown> };

const STORAGE_KEY = 'zhino-page-builder-clipboard';
const CLIPBOARD_MARKER = 'page-builder-clipboard';
const CLIPBOARD_VERSION = 1;

type ClipboardEnvelope = {
  __zhino: typeof CLIPBOARD_MARKER;
  version: typeof CLIPBOARD_VERSION;
  data: BuilderClipboard;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function isServiceBlock(value: unknown): value is ServiceBlock {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return typeof b.id === 'string' && typeof b.type === 'string' && b.props != null && typeof b.props === 'object';
}

function isBuilderClipboard(value: unknown): value is BuilderClipboard {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  if (c.kind === 'block') return isServiceBlock(c.block);
  if (c.kind === 'blocks') return Array.isArray(c.blocks) && c.blocks.every(isServiceBlock);
  if (c.kind === 'style') {
    return typeof c.type === 'string' && c.props != null && typeof c.props === 'object';
  }
  return false;
}

/** Deep-clone a block with fresh ids (including nested container children). */
export function cloneBlockWithNewIds(block: ServiceBlock): ServiceBlock {
  const props = JSON.parse(JSON.stringify(block.props)) as Record<string, unknown>;
  if (block.type === 'container' && Array.isArray(props.columns)) {
    props.columns = (props.columns as ContainerColumn[]).map((col) => ({
      ...col,
      id: uid('col'),
      blocks: (col.blocks || []).map((child) => cloneBlockWithNewIds(child)),
    }));
  }
  return {
    id: uid(block.type),
    type: block.type,
    props,
  };
}

export function cloneBlocksWithNewIds(blocks: ServiceBlock[]): ServiceBlock[] {
  return blocks.map((b) => cloneBlockWithNewIds(b));
}

export function serializeBuilderClipboard(payload: BuilderClipboard): string {
  const envelope: ClipboardEnvelope = {
    __zhino: CLIPBOARD_MARKER,
    version: CLIPBOARD_VERSION,
    data: payload,
  };
  return JSON.stringify(envelope, null, 2);
}

/** Parse OS/system clipboard text into builder clipboard data. */
export function parseClipboardText(raw: string): BuilderClipboard | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;

      // Our envelope
      if (obj.__zhino === CLIPBOARD_MARKER && isBuilderClipboard(obj.data)) {
        return obj.data;
      }

      // Plain BuilderClipboard
      if (isBuilderClipboard(parsed)) return parsed;

      // PageBuilderDoc: { version, blocks }
      if (Array.isArray(obj.blocks) && obj.blocks.every(isServiceBlock)) {
        return { kind: 'blocks', blocks: obj.blocks as ServiceBlock[] };
      }

      // Single block
      if (isServiceBlock(parsed)) {
        return { kind: 'block', block: parsed };
      }

      // Array of blocks
      if (Array.isArray(parsed) && parsed.every(isServiceBlock)) {
        return { kind: 'blocks', blocks: parsed };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function readFromStorage(storage: Storage): BuilderClipboard | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseClipboardText(raw) ?? (JSON.parse(raw) as BuilderClipboard);
  } catch {
    return null;
  }
}

function writeToStorage(storage: Storage, payload: BuilderClipboard | null) {
  try {
    if (!payload) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, serializeBuilderClipboard(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Sync cache (localStorage for cross-tab + sessionStorage fallback). */
export function readBuilderClipboard(): BuilderClipboard | null {
  if (typeof window === 'undefined') return null;
  return readFromStorage(window.localStorage) ?? readFromStorage(window.sessionStorage);
}

export function writeBuilderClipboard(payload: BuilderClipboard | null) {
  if (typeof window === 'undefined') return;
  writeToStorage(window.localStorage, payload);
  writeToStorage(window.sessionStorage, payload);
}

/** Copy JSON to the OS clipboard so it works across sites/tabs. */
export async function writeBuilderClipboardAsync(payload: BuilderClipboard): Promise<void> {
  writeBuilderClipboard(payload);
  const text = serializeBuilderClipboard(payload);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    /* permission / insecure context — local cache still works same-origin */
  }
}

/**
 * Resolve clipboard for paste: prefer OS clipboard JSON, then local cache.
 * Call from a user gesture (paste / Ctrl+V).
 */
export async function resolveBuilderClipboard(): Promise<BuilderClipboard | null> {
  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText();
      const fromOs = parseClipboardText(text);
      if (fromOs) {
        writeBuilderClipboard(fromOs);
        return fromOs;
      }
    }
  } catch {
    /* denied / unsupported */
  }
  return readBuilderClipboard();
}
