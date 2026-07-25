import type { CSSProperties } from 'react';
import type { ServiceBlock } from '../types';

export type ColumnWidthMode = 'auto' | 'px' | 'vw' | 'percent';
export type ColumnAlignH = 'start' | 'center' | 'end' | 'stretch';
export type ColumnAlignV = 'start' | 'center' | 'end' | 'stretch';

export type ContainerColumn = {
  id: string;
  blocks: ServiceBlock[];
  widthMode?: ColumnWidthMode;
  widthValue?: number;
  paddingX?: number;
  paddingY?: number;
  marginTop?: number;
  marginBottom?: number;
  marginX?: number;
  /** Empty string / missing = transparent */
  backgroundColor?: string;
  borderRadius?: number;
  alignH?: ColumnAlignH;
  alignV?: ColumnAlignV;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyColumn(partial?: Partial<ContainerColumn>): ContainerColumn {
  return {
    id: uid('col'),
    blocks: [],
    widthMode: 'auto',
    widthValue: 50,
    paddingX: 0,
    paddingY: 0,
    marginTop: 0,
    marginBottom: 0,
    marginX: 0,
    backgroundColor: '',
    borderRadius: 0,
    alignH: 'stretch',
    alignV: 'start',
    ...partial,
  };
}

export function normalizeContainerColumn(raw: unknown, fallbackIndex = 0): ContainerColumn {
  const col = (raw && typeof raw === 'object' ? raw : {}) as Partial<ContainerColumn>;
  return {
    id: typeof col.id === 'string' && col.id ? col.id : `col-${fallbackIndex}`,
    blocks: Array.isArray(col.blocks) ? col.blocks : [],
    widthMode: (['auto', 'px', 'vw', 'percent'] as const).includes(col.widthMode as ColumnWidthMode)
      ? (col.widthMode as ColumnWidthMode)
      : 'auto',
    widthValue: Number.isFinite(Number(col.widthValue)) ? Number(col.widthValue) : 50,
    paddingX: Math.max(0, Math.min(120, Number(col.paddingX) || 0)),
    paddingY: Math.max(0, Math.min(120, Number(col.paddingY) || 0)),
    marginTop: Math.max(0, Math.min(160, Number(col.marginTop) || 0)),
    marginBottom: Math.max(0, Math.min(160, Number(col.marginBottom) || 0)),
    marginX: Math.max(0, Math.min(80, Number(col.marginX) || 0)),
    backgroundColor: typeof col.backgroundColor === 'string' ? col.backgroundColor : '',
    borderRadius: Math.max(0, Math.min(64, Math.round(Number(col.borderRadius) || 0))),
    alignH: (['start', 'center', 'end', 'stretch'] as const).includes(col.alignH as ColumnAlignH)
      ? (col.alignH as ColumnAlignH)
      : 'stretch',
    alignV: (['start', 'center', 'end', 'stretch'] as const).includes(col.alignV as ColumnAlignV)
      ? (col.alignV as ColumnAlignV)
      : 'start',
  };
}

/** CSS grid track size for one column. */
export function resolveColumnTrack(col: ContainerColumn): string {
  const mode = col.widthMode || 'auto';
  const v = Number(col.widthValue);
  if (mode === 'px' && Number.isFinite(v)) {
    return `${Math.max(40, Math.min(2000, Math.round(v)))}px`;
  }
  if (mode === 'vw' && Number.isFinite(v)) {
    return `${Math.max(5, Math.min(100, v))}vw`;
  }
  if (mode === 'percent' && Number.isFinite(v)) {
    return `minmax(0, ${Math.max(5, Math.min(100, v))}%)`;
  }
  return 'minmax(0, 1fr)';
}

export function resolveColumnBoxStyle(col: ContainerColumn): CSSProperties {
  const bg = (col.backgroundColor || '').trim();
  return {
    paddingInline: col.paddingX || undefined,
    paddingBlock: col.paddingY || undefined,
    marginTop: col.marginTop || undefined,
    marginBottom: col.marginBottom || undefined,
    marginInline: col.marginX || undefined,
    backgroundColor: bg || undefined,
    borderRadius: col.borderRadius || undefined,
    alignItems:
      col.alignH === 'start'
        ? 'flex-start'
        : col.alignH === 'center'
          ? 'center'
          : col.alignH === 'end'
            ? 'flex-end'
            : 'stretch',
    justifyContent:
      col.alignV === 'center'
        ? 'center'
        : col.alignV === 'end'
          ? 'flex-end'
          : col.alignV === 'stretch'
            ? 'space-between'
            : 'flex-start',
  };
}

export function defaultWidthValueForMode(mode: ColumnWidthMode): number {
  if (mode === 'px') return 320;
  if (mode === 'vw') return 25;
  if (mode === 'percent') return 50;
  return 50;
}
