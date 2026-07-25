import React from 'react';
import type { ServiceBlock } from '../../types';
import { getBlockScrollAnimation } from '../../lib/blockScrollAnimation';
import { BLOCK_LABELS } from '../../lib/landingToBlocks';
import { BlockRenderContext, renderServiceBlock } from './blocks/ServiceBlocks';
import { ScrollReveal } from './ScrollReveal';

interface BlockRendererProps {
  blocks: ServiceBlock[];
  ctx: BlockRenderContext;
  selectedBlockId?: string | null;
  selectedColumnId?: string | null;
  onSelectBlock?: (id: string) => void;
  onSelectColumn?: (containerId: string, columnId: string) => void;
  onContextMenuBlock?: (e: React.MouseEvent, blockId: string) => void;
  onUpdateBlockProps?: (id: string, props: Record<string, unknown>) => void;
  onMoveNestedBlock?: (
    containerId: string,
    fromCol: number,
    fromIndex: number,
    toCol: number,
    toIndex: number
  ) => void;
  previewMode?: boolean;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  blocks,
  ctx,
  selectedBlockId,
  selectedColumnId,
  onSelectBlock,
  onSelectColumn,
  onContextMenuBlock,
  onUpdateBlockProps,
  onMoveNestedBlock,
  previewMode = false,
}) => {
  return (
    <div className="space-y-10 md:space-y-14 pb-8 text-right">
      {blocks.map((block) => {
        const selected = previewMode && selectedBlockId === block.id && !selectedColumnId;
        const anim = getBlockScrollAnimation(block.props);
        const content = renderServiceBlock(block, ctx, {
          previewMode,
          selectedBlockId,
          selectedColumnId,
          onSelectBlock,
          onSelectColumn,
          onContextMenuBlock,
          onUpdateBlockProps,
          onMoveNestedBlock,
        });

        return (
          <div
            key={block.id}
            onClick={(e) => {
              if (!previewMode || !onSelectBlock) return;
              e.stopPropagation();
              onSelectBlock(block.id);
            }}
            onContextMenu={(e) => {
              if (!previewMode || !onContextMenuBlock) return;
              e.preventDefault();
              e.stopPropagation();
              onContextMenuBlock(e, block.id);
            }}
            className={
              previewMode
                ? `relative rounded-3xl transition-all cursor-pointer ${
                    selected
                      ? 'ring-2 ring-primary ring-offset-4 ring-offset-surface'
                      : 'hover:ring-1 hover:ring-primary/40'
                  }`
                : undefined
            }
          >
            {previewMode && selected && (
              <div className="absolute -top-3 right-4 z-10 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">edit</span>
                {BLOCK_LABELS[block.type] || 'بلوک انتخاب‌شده'}
              </div>
            )}
            {previewMode ? (
              content
            ) : (
              <ScrollReveal enabled={anim.enabled} type={anim.type}>
                {content}
              </ScrollReveal>
            )}
          </div>
        );
      })}
      {blocks.length === 0 && (
        <div className="py-20 text-center text-sm text-on-surface-variant border border-dashed border-outline-variant/40 rounded-3xl">
          هنوز بلوکی اضافه نشده. از پنل ویجت‌ها یک بخش اضافه کنید.
        </div>
      )}
    </div>
  );
};
