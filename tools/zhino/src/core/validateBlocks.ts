import {
  ANIMATE_TYPES,
  NESTABLE_WIDGET_TYPES,
  type PageKind,
  type ServiceBlock,
  type ServiceBlockType,
  widgetTypesForKind,
} from './types.js';

export interface ValidationIssue {
  path: string;
  message: string;
}

function collectIds(blocks: ServiceBlock[], seen: Map<string, string>, issues: ValidationIssue[], path: string): void {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockPath = `${path}[${i}]`;
    if (!block || typeof block !== 'object') continue;
    if (block.id) {
      if (seen.has(block.id)) {
        issues.push({
          path: blockPath,
          message: `Duplicate block id "${block.id}" (also at ${seen.get(block.id)})`,
        });
      } else {
        seen.set(block.id, blockPath);
      }
    }
    if (block.type === 'container') {
      const columns = Array.isArray(block.props?.columns)
        ? (block.props.columns as Array<{ blocks?: ServiceBlock[] }>)
        : [];
      for (let c = 0; c < columns.length; c++) {
        collectIds(columns[c]?.blocks || [], seen, issues, `${blockPath}.columns[${c}].blocks`);
      }
    }
  }
}

function validateBlockList(
  blocks: ServiceBlock[],
  pageKind: PageKind,
  path: string,
  nested: boolean,
  issues: ValidationIssue[]
): void {
  const allowed = new Set(widgetTypesForKind(pageKind));
  const nestable = new Set(NESTABLE_WIDGET_TYPES);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockPath = `${path}[${i}]`;

    if (!block || typeof block !== 'object') {
      issues.push({ path: blockPath, message: 'Block must be an object' });
      continue;
    }
    if (!block.id || typeof block.id !== 'string') {
      issues.push({ path: `${blockPath}.id`, message: 'Block id is required' });
    }
    if (!block.type || typeof block.type !== 'string') {
      issues.push({ path: `${blockPath}.type`, message: 'Block type is required' });
      continue;
    }

    const type = block.type as ServiceBlockType;

    if (nested) {
      if (type === 'container') {
        issues.push({ path: `${blockPath}.type`, message: 'Nested container is not allowed' });
      } else if (!nestable.has(type)) {
        issues.push({
          path: `${blockPath}.type`,
          message: `Type "${type}" is not nestable inside a column`,
        });
      }
    } else if (!allowed.has(type)) {
      issues.push({
        path: `${blockPath}.type`,
        message: `Type "${type}" is not allowed for pageKind "${pageKind}"`,
      });
    }

    const animateEnabled = block.props?.animateEnabled;
    const animateType = block.props?.animateType;
    if (animateEnabled === true && animateType != null) {
      if (!ANIMATE_TYPES.includes(animateType as (typeof ANIMATE_TYPES)[number])) {
        issues.push({
          path: `${blockPath}.props.animateType`,
          message: `animateType must be one of: ${ANIMATE_TYPES.join(', ')}`,
        });
      }
    }

    if (type === 'container') {
      const columns = Array.isArray(block.props?.columns)
        ? (block.props.columns as Array<{ blocks?: ServiceBlock[] }>)
        : [];
      for (let c = 0; c < columns.length; c++) {
        const nestedBlocks = columns[c]?.blocks || [];
        validateBlockList(nestedBlocks, pageKind, `${blockPath}.columns[${c}].blocks`, true, issues);
      }
    }
  }
}

export function validateBlocks(
  blocks: ServiceBlock[],
  pageKind: PageKind
): { ok: true } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(blocks)) {
    return { ok: false, issues: [{ path: 'blocks', message: 'blocks must be an array' }] };
  }

  validateBlockList(blocks, pageKind, 'blocks', false, issues);
  collectIds(blocks, new Map(), issues, 'blocks');

  return issues.length ? { ok: false, issues } : { ok: true };
}

export function assertValidBlocks(blocks: ServiceBlock[], pageKind: PageKind): void {
  const result = validateBlocks(blocks, pageKind);
  if (result.ok === false) {
    const detail = result.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new Error(`Block validation failed: ${detail}`);
  }
}
