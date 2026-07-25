import type { ServiceBlock, ServiceBlockType } from '../../types';
import type { ContainerColumn } from '../../lib/containerColumn';

export type BuilderClipboard =
  | { kind: 'block'; block: ServiceBlock }
  | { kind: 'blocks'; blocks: ServiceBlock[] }
  | { kind: 'style'; type: ServiceBlockType; props: Record<string, unknown> };

const STORAGE_KEY = 'zhino-page-builder-clipboard';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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

export function readBuilderClipboard(): BuilderClipboard | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuilderClipboard;
  } catch {
    return null;
  }
}

export function writeBuilderClipboard(payload: BuilderClipboard | null) {
  try {
    if (!payload) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}
