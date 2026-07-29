import { apiRequest } from './client.js';
import { assertValidBlocks } from './validateBlocks.js';
import {
  createEmptyBlock,
} from './capabilities.js';
import {
  pageKindFromTarget,
  type PageBuilderDoc,
  type ServiceBlock,
  type ServiceBlockType,
  type TargetKind,
} from './types.js';
import { getEntity, upsertEntity, type EntityName } from './entities.js';

function entityForTarget(target: TargetKind): EntityName {
  if (target === 'service') return 'services';
  if (target === 'article') return 'articles';
  if (target === 'workshop') return 'workshops';
  return 'pages';
}

function getBuilder(entity: Record<string, unknown>): PageBuilderDoc {
  const pb = entity.pageBuilder as PageBuilderDoc | undefined;
  if (pb?.blocks && Array.isArray(pb.blocks)) {
    return { version: 1, blocks: pb.blocks as ServiceBlock[] };
  }
  return { version: 1, blocks: [] };
}

export async function getBlocks(target: TargetKind, id: string) {
  const entity = await getEntity(entityForTarget(target), id);
  const builder = getBuilder(entity);
  return {
    target,
    id,
    version: builder.version,
    blocks: builder.blocks,
    summary: builder.blocks.map((b, i) => ({
      index: i,
      id: b.id,
      type: b.type,
      label: b.type,
    })),
  };
}

export async function replaceBlocks(
  target: TargetKind,
  id: string,
  blocks: ServiceBlock[]
) {
  assertValidBlocks(blocks, pageKindFromTarget(target));
  const entity = await getEntity<Record<string, unknown>>(entityForTarget(target), id);
  const next = {
    ...entity,
    id,
    pageBuilder: { version: 1 as const, blocks },
    updatedAt: new Date().toISOString(),
  };
  return upsertEntity(entityForTarget(target), next as Record<string, unknown> & { id: string });
}

export async function addBlock(
  target: TargetKind,
  id: string,
  type: ServiceBlockType,
  index?: number,
  props?: Record<string, unknown>
) {
  const current = await getBlocks(target, id);
  const block = createEmptyBlock(type);
  if (props) block.props = { ...block.props, ...props };
  const blocks = [...current.blocks];
  if (index == null || index < 0 || index > blocks.length) {
    blocks.push(block);
  } else {
    blocks.splice(index, 0, block);
  }
  await replaceBlocks(target, id, blocks);
  return block;
}

export async function updateBlock(
  target: TargetKind,
  id: string,
  blockId: string,
  patch: { props?: Record<string, unknown>; type?: ServiceBlockType }
) {
  const current = await getBlocks(target, id);
  const idx = current.blocks.findIndex((b) => b.id === blockId);
  if (idx < 0) throw new Error(`Block not found: ${blockId}`);
  const existing = current.blocks[idx];
  const next: ServiceBlock = {
    ...existing,
    type: patch.type || existing.type,
    props: patch.props ? { ...existing.props, ...patch.props } : existing.props,
  };
  const blocks = [...current.blocks];
  blocks[idx] = next;
  await replaceBlocks(target, id, blocks);
  return next;
}

export async function removeBlock(target: TargetKind, id: string, blockId: string) {
  const current = await getBlocks(target, id);
  const blocks = current.blocks.filter((b) => b.id !== blockId);
  if (blocks.length === current.blocks.length) {
    throw new Error(`Block not found: ${blockId}`);
  }
  await replaceBlocks(target, id, blocks);
  return { removed: blockId, remaining: blocks.length };
}

export async function listMedia(kind?: 'image' | 'video' | 'all') {
  const qs = kind && kind !== 'all' ? `?kind=${kind}` : '';
  return apiRequest(`/api/uploads${qs}`);
}
