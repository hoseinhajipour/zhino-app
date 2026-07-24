import React, { useCallback, useMemo, useState } from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, ServiceBlock, ServiceBlockType, ServiceItem } from '../../types';
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  NESTABLE_WIDGET_TYPES,
  WIDGET_GROUPS,
  createEmptyBlock,
} from '../../lib/landingToBlocks';
import { BlockRenderer } from './BlockRenderer';
import { BlockSettings } from './BlockSettings';
import {
  BuilderContextMenu,
  type BuilderContextMenuState,
  type ContextMenuAction,
} from './BuilderContextMenu';
import { BuilderDevicePreviewContext } from './BuilderDevicePreviewContext';
import {
  cloneBlockWithNewIds,
  cloneBlocksWithNewIds,
  readBuilderClipboard,
  writeBuilderClipboard,
  type BuilderClipboard,
} from './builderClipboard';

export const SERVICE_WIDGET_TYPES: ServiceBlockType[] = [
  'container',
  'heroHeader',
  'hero',
  'imageCarousel',
  'videoPlayer',
  'icon',
  'iconList',
  'button',
  'staffCarousel',
  'googleMap',
  'tabGallery',
  'highlights',
  'symptoms',
  'process',
  'features',
  'doctors',
  'testimonials',
  'faqs',
  'latestFaqs',
  'contactInfo',
  'richText',
  'htmlCode',
  'otherServices',
  'cta',
];

export const SITE_WIDGET_TYPES: ServiceBlockType[] = [
  'container',
  'heroHeader',
  'pageHero',
  'imageCarousel',
  'videoPlayer',
  'icon',
  'iconList',
  'button',
  'staffCarousel',
  'googleMap',
  'tabGallery',
  'highlights',
  'features',
  'doctors',
  'servicesGrid',
  'articlesGrid',
  'contactCards',
  'contactInfo',
  'contactForm',
  'testimonials',
  'faqs',
  'latestFaqs',
  'richText',
  'htmlCode',
  'cta',
  'hero',
  'otherServices',
];

/** Widgets suited for long-form article layouts */
export const ARTICLE_WIDGET_TYPES: ServiceBlockType[] = [
  'container',
  'heroHeader',
  'pageHero',
  'richText',
  'htmlCode',
  'imageCarousel',
  'videoPlayer',
  'icon',
  'iconList',
  'button',
  'staffCarousel',
  'tabGallery',
  'googleMap',
  'highlights',
  'features',
  'process',
  'faqs',
  'latestFaqs',
  'contactInfo',
  'cta',
  'doctors',
];

type DevicePreview = 'desktop' | 'tablet' | 'mobile';

type ContainerColumn = { id: string; blocks: ServiceBlock[] };

interface PageBuilderEditorProps {
  title: string;
  eyebrow?: string;
  initialBlocks: ServiceBlock[];
  widgetTypes?: ServiceBlockType[];
  allServices: ServiceItem[];
  doctors: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  contextId?: string;
  onClose: () => void;
  onSave: (blocks: ServiceBlock[]) => Promise<void>;
  /** Extra settings panel (e.g. article meta) shown as a right-side tab */
  metaPanel?: React.ReactNode;
  metaPanelLabel?: string;
  saveLabel?: string;
  defaultRightTab?: 'meta' | 'block';
}

function findBlockDeep(
  blocks: ServiceBlock[],
  id: string
): { block: ServiceBlock; parentContainerId?: string; columnIndex?: number } | null {
  for (const b of blocks) {
    if (b.id === id) return { block: b };
    if (b.type === 'container') {
      const columns = (Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[];
      for (let ci = 0; ci < columns.length; ci++) {
        const child = (columns[ci].blocks || []).find((c) => c.id === id);
        if (child) return { block: child, parentContainerId: b.id, columnIndex: ci };
      }
    }
  }
  return null;
}

function mapBlocksDeep(
  blocks: ServiceBlock[],
  mapper: (block: ServiceBlock) => ServiceBlock
): ServiceBlock[] {
  return blocks.map((b) => {
    const mapped = mapper(b);
    if (mapped.type !== 'container') return mapped;
    const columns = (Array.isArray(mapped.props.columns) ? mapped.props.columns : []) as ContainerColumn[];
    return {
      ...mapped,
      props: {
        ...mapped.props,
        columns: columns.map((col) => ({
          ...col,
          blocks: (col.blocks || []).map((child) => mapper(child)),
        })),
      },
    };
  });
}

export const PageBuilderEditor: React.FC<PageBuilderEditorProps> = ({
  title,
  eyebrow = 'صفحه‌ساز',
  initialBlocks,
  widgetTypes = SERVICE_WIDGET_TYPES,
  allServices,
  doctors,
  articles,
  faqs,
  contact,
  contextId = 'site',
  onClose,
  onSave,
  metaPanel,
  metaPanelLabel = 'تنظیمات',
  saveLabel = 'ذخیره صفحه',
  defaultRightTab = 'block',
}) => {
  const [blocks, setBlocks] = useState<ServiceBlock[]>(initialBlocks);
  const [history, setHistory] = useState<ServiceBlock[][]>([initialBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(initialBlocks[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [device, setDevice] = useState<DevicePreview>('desktop');
  const [widgetQuery, setWidgetQuery] = useState('');
  const [leftTab, setLeftTab] = useState<'widgets' | 'structure'>('widgets');
  const [rightTab, setRightTab] = useState<'meta' | 'block'>(
    metaPanel && defaultRightTab === 'meta' ? 'meta' : 'block'
  );
  const [clipboard, setClipboard] = useState<BuilderClipboard | null>(() => readBuilderClipboard());
  const [contextMenu, setContextMenu] = useState<BuilderContextMenuState | null>(null);

  const pushHistory = useCallback((next: ServiceBlock[]) => {
    setBlocks(next);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const updated = [...trimmed, next].slice(-40);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setBlocks(history[nextIndex]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setBlocks(history[nextIndex]);
  };

  const selectedMeta = useMemo(
    () => (selectedId ? findBlockDeep(blocks, selectedId) : null),
    [blocks, selectedId]
  );
  const selected = selectedMeta?.block || null;

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    pushHistory(next);
  };

  const addWidget = (type: ServiceBlockType) => {
    const block = createEmptyBlock(type);
    pushHistory([...blocks, block]);
    setSelectedId(block.id);
    setLeftTab('structure');
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const copy: ServiceBlock = {
      ...blocks[idx],
      id: `${blocks[idx].type}-${Date.now().toString(36)}`,
      props: JSON.parse(JSON.stringify(blocks[idx].props)),
    };
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    pushHistory(next);
    setSelectedId(copy.id);
  };

  const removeBlock = (id: string) => {
    const topLevel = blocks.some((b) => b.id === id);
    if (topLevel) {
      const next = blocks.filter((b) => b.id !== id);
      pushHistory(next);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return;
    }
    const next = blocks.map((b) => {
      if (b.type !== 'container') return b;
      const columns = (Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[];
      return {
        ...b,
        props: {
          ...b.props,
          columns: columns.map((col) => ({
            ...col,
            blocks: (col.blocks || []).filter((c) => c.id !== id),
          })),
        },
      };
    });
    pushHistory(next);
    if (selectedId === id) setSelectedId(null);
  };

  const updateSelectedProps = (props: Record<string, unknown>) => {
    if (!selectedId) return;
    const next = mapBlocksDeep(blocks, (b) => (b.id === selectedId ? { ...b, props } : b));
    pushHistory(next);
  };

  const addNestedBlock = (columnIndex: number, type: ServiceBlockType) => {
    if (!selected || selected.type !== 'container') return;
    const containerId = selected.id;
    const child = createEmptyBlock(type);
    const next = blocks.map((b) => {
      if (b.id !== containerId) return b;
      const columns = [...((Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[])];
      while (columns.length <= columnIndex) {
        columns.push({ id: `col-${Date.now()}-${columns.length}`, blocks: [] });
      }
      columns[columnIndex] = {
        ...columns[columnIndex],
        blocks: [...(columns[columnIndex].blocks || []), child],
      };
      return { ...b, props: { ...b.props, columns } };
    });
    pushHistory(next);
    setSelectedId(child.id);
  };

  const removeNestedBlock = (columnIndex: number, blockId: string) => {
    if (!selectedMeta?.parentContainerId && selected?.type !== 'container') {
      // when settings open on container
    }
    const containerId =
      selected?.type === 'container' ? selected.id : selectedMeta?.parentContainerId;
    if (!containerId) return;
    const next = blocks.map((b) => {
      if (b.id !== containerId) return b;
      const columns = ((Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[]).map(
        (col, i) =>
          i === columnIndex
            ? { ...col, blocks: (col.blocks || []).filter((c) => c.id !== blockId) }
            : col
      );
      return { ...b, props: { ...b.props, columns } };
    });
    pushHistory(next);
    if (selectedId === blockId) setSelectedId(containerId);
  };

  const setClipboardState = (payload: BuilderClipboard | null) => {
    setClipboard(payload);
    writeBuilderClipboard(payload);
  };

  const openContextMenu = (e: React.MouseEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetId) {
      setSelectedId(targetId);
      if (metaPanel) setRightTab('block');
    }
    setContextMenu({ x: e.clientX, y: e.clientY, targetId });
  };

  const insertBlockAfterTarget = (source: ServiceBlock, targetId: string | null) => {
    const clone = cloneBlockWithNewIds(source);
    if (!targetId) {
      pushHistory([...blocks, clone]);
      setSelectedId(clone.id);
      return;
    }
    const meta = findBlockDeep(blocks, targetId);
    if (!meta) {
      pushHistory([...blocks, clone]);
      setSelectedId(clone.id);
      return;
    }
    if (meta.parentContainerId != null && meta.columnIndex != null) {
      const next = blocks.map((b) => {
        if (b.id !== meta.parentContainerId) return b;
        const columns = ((Array.isArray(b.props.columns) ? b.props.columns : []) as ContainerColumn[]).map(
          (col, ci) => {
            if (ci !== meta.columnIndex) return col;
            const list = [...(col.blocks || [])];
            const idx = list.findIndex((c) => c.id === targetId);
            list.splice(idx < 0 ? list.length : idx + 1, 0, clone);
            return { ...col, blocks: list };
          }
        );
        return { ...b, props: { ...b.props, columns } };
      });
      pushHistory(next);
      setSelectedId(clone.id);
      return;
    }
    const idx = blocks.findIndex((b) => b.id === targetId);
    const next = [...blocks];
    next.splice(idx < 0 ? next.length : idx + 1, 0, clone);
    pushHistory(next);
    setSelectedId(clone.id);
  };

  const handleContextAction = (action: ContextMenuAction) => {
    const targetId = contextMenu?.targetId ?? selectedId;
    const targetMeta = targetId ? findBlockDeep(blocks, targetId) : null;
    const target = targetMeta?.block ?? null;
    setContextMenu(null);

    switch (action) {
      case 'copy': {
        if (!target) return;
        setClipboardState({
          kind: 'block',
          block: JSON.parse(JSON.stringify(target)) as ServiceBlock,
        });
        break;
      }
      case 'copyStyle': {
        if (!target) return;
        setClipboardState({
          kind: 'style',
          type: target.type,
          props: JSON.parse(JSON.stringify(target.props)) as Record<string, unknown>,
        });
        break;
      }
      case 'copyAll': {
        if (!blocks.length) return;
        setClipboardState({
          kind: 'blocks',
          blocks: JSON.parse(JSON.stringify(blocks)) as ServiceBlock[],
        });
        break;
      }
      case 'delete': {
        if (!targetId) return;
        removeBlock(targetId);
        break;
      }
      case 'deleteAll': {
        if (!blocks.length) return;
        if (!window.confirm('همه ویجت‌های این صفحه حذف شوند؟')) return;
        pushHistory([]);
        setSelectedId(null);
        break;
      }
      case 'paste': {
        if (!clipboard) return;
        if (clipboard.kind === 'block') {
          insertBlockAfterTarget(clipboard.block, targetId);
        } else if (clipboard.kind === 'blocks') {
          const clones = cloneBlocksWithNewIds(clipboard.blocks);
          if (!targetId) {
            pushHistory([...blocks, ...clones]);
          } else {
            const idx = blocks.findIndex((b) => b.id === targetId);
            const next = [...blocks];
            next.splice(idx < 0 ? next.length : idx + 1, 0, ...clones);
            pushHistory(next);
          }
          setSelectedId(clones[0]?.id ?? null);
        }
        break;
      }
      case 'pasteStyle': {
        if (!clipboard || clipboard.kind !== 'style' || !targetId || !target) return;
        // Keep structural fields for containers (columns content)
        let nextProps = JSON.parse(JSON.stringify(clipboard.props)) as Record<string, unknown>;
        if (target.type === 'container') {
          nextProps = {
            ...nextProps,
            columns: target.props.columns,
            columnCount: target.props.columnCount ?? nextProps.columnCount,
            columnsDesktop: target.props.columnsDesktop ?? nextProps.columnsDesktop,
          };
        }
        if (target.type === 'iconList') {
          nextProps = { ...nextProps, items: target.props.items };
        }
        if (target.type === 'heroHeader') {
          nextProps = {
            ...nextProps,
            slides: target.props.slides,
            departments: target.props.departments,
            stats: target.props.stats,
            title: target.props.title,
            subtitle: target.props.subtitle,
            badge: target.props.badge,
          };
        }
        // If types differ, still apply props but keep type
        const next = mapBlocksDeep(blocks, (b) =>
          b.id === targetId ? { ...b, props: nextProps } : b
        );
        pushHistory(next);
        break;
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveToast(null);
    try {
      await onSave(blocks);
      setSaveToast('با موفقیت ذخیره شد');
      window.setTimeout(() => setSaveToast(null), 3200);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'خطا در ذخیره صفحه');
    } finally {
      setSaving(false);
    }
  };

  const allowedSet = useMemo(() => new Set(widgetTypes), [widgetTypes]);
  const groupedWidgets = useMemo(() => {
    const q = widgetQuery.trim().toLowerCase();
    return WIDGET_GROUPS.map((g) => ({
      ...g,
      types: g.types.filter((t) => {
        if (!allowedSet.has(t)) return false;
        if (!q) return true;
        return (
          BLOCK_LABELS[t]?.toLowerCase().includes(q) ||
          t.toLowerCase().includes(q)
        );
      }),
    })).filter((g) => g.types.length);
  }, [allowedSet, widgetQuery]);

  const deviceWidth =
    device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1100px]';

  const settingsTarget =
    selectedMeta?.parentContainerId && selected
      ? selected
      : selected;

  const containerForNestedSettings =
    selected?.type === 'container'
      ? selected
      : selectedMeta?.parentContainerId
        ? blocks.find((b) => b.id === selectedMeta.parentContainerId) || null
        : null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-100 dark:bg-slate-950 flex flex-col text-right" dir="rtl">
      <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-3 md:px-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="بستن"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] text-slate-500 font-bold tracking-wide">{eyebrow}</p>
            <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(
            [
              ['desktop', 'computer'],
              ['tablet', 'tablet_mac'],
              ['mobile', 'smartphone'],
            ] as const
          ).map(([id, icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              className={`p-2 rounded-lg transition-all ${
                device === id
                  ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={id}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30"
            title="بازگردانی"
          >
            <span className="material-symbols-outlined">undo</span>
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30"
            title="جلو"
          >
            <span className="material-symbols-outlined">redo</span>
          </button>
          <span className="hidden md:inline text-[11px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {blocks.length} بلوک
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 md:px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-500 disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-teal-900/20"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>{saving ? 'ذخیره...' : saveLabel}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px]">
        {/* Left: widgets + structure */}
        <aside className="border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex gap-1">
            <button
              type="button"
              onClick={() => setLeftTab('widgets')}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black ${
                leftTab === 'widgets' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              ویجت‌ها
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('structure')}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black ${
                leftTab === 'structure' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              ساختار
            </button>
          </div>

          {leftTab === 'widgets' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <input
                type="text"
                value={widgetQuery}
                onChange={(e) => setWidgetQuery(e.target.value)}
                placeholder="جستجوی ویجت..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-teal-500"
              />
              {groupedWidgets.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 tracking-wide px-1">{group.label}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.types.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addWidget(type)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50/80 dark:hover:bg-teal-900/20 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all"
                      >
                        <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">{BLOCK_ICONS[type]}</span>
                        </span>
                        <span className="leading-tight text-center">{BLOCK_LABELS[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {blocks.map((block, index) => (
                <div key={block.id}>
                  <div
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === index) return;
                      moveBlock(dragIndex, index);
                      setDragIndex(null);
                    }}
                    onClick={() => setSelectedId(block.id)}
                    onContextMenu={(e) => openContextMenu(e, block.id)}
                    className={`group flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedId === block.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base text-slate-400 cursor-grab">
                      drag_indicator
                    </span>
                    <span className="material-symbols-outlined text-base text-teal-600">
                      {BLOCK_ICONS[block.type]}
                    </span>
                    <span className="flex-1 text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                      {BLOCK_LABELS[block.type] || block.type}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(index, index - 1);
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(index, index + 1);
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(block.id);
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-rose-50 text-rose-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                  {block.type === 'container' &&
                    ((Array.isArray(block.props.columns) ? block.props.columns : []) as ContainerColumn[]).map(
                      (col, ci) =>
                        (col.blocks || []).map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => setSelectedId(child.id)}
                            onContextMenu={(e) => openContextMenu(e, child.id)}
                            className={`w-full mr-4 mt-1 flex items-center gap-2 p-2 rounded-lg border text-right ${
                              selectedId === child.id
                                ? 'border-teal-400 bg-teal-50/80'
                                : 'border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-slate-300 text-[10px]">└</span>
                            <span className="material-symbols-outlined text-sm text-slate-500">
                              {BLOCK_ICONS[child.type]}
                            </span>
                            <span className="text-[10px] font-bold truncate">
                              {BLOCK_LABELS[child.type]} · ستون {ci + 1}
                            </span>
                          </button>
                        ))
                    )}
                </div>
              ))}
              {!blocks.length && (
                <p className="text-xs text-slate-500 text-center py-8">هنوز بلوکی ندارید.</p>
              )}
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main
          className="overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,#cbd5e1_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,#334155_1px,transparent_0)] [background-size:20px_20px] p-4 md:p-8"
          onContextMenu={(e) => openContextMenu(e, null)}
        >
          <div
            className={`mx-auto ${deviceWidth} bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/10 p-4 md:p-8 min-h-[70vh] transition-all duration-300`}
            onContextMenu={(e) => openContextMenu(e, null)}
          >
            <BuilderDevicePreviewContext.Provider value={device}>
              <BlockRenderer
                blocks={blocks}
                selectedBlockId={selectedId}
                onSelectBlock={(id) => {
                  setSelectedId(id);
                  if (metaPanel) setRightTab('block');
                }}
                onContextMenuBlock={(e, id) => openContextMenu(e, id)}
                previewMode
                ctx={{
                  serviceId: contextId,
                  allServices,
                  doctors,
                  articles,
                  faqs,
                  contact,
                  bookingEnabled: true,
                  onOpenBooking: () => undefined,
                  onOpenDoctorModal: () => undefined,
                  onNavigate: () => undefined,
                  onSelectOtherService: () => undefined,
                  onSelectArticle: () => undefined,
                }}
              />
            </BuilderDevicePreviewContext.Provider>
          </div>
        </main>

        {/* Settings */}
        <aside className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
          {metaPanel ? (
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setRightTab('meta')}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black ${
                  rightTab === 'meta' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {metaPanelLabel}
              </button>
              <button
                type="button"
                onClick={() => setRightTab('block')}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black ${
                  rightTab === 'block' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                تنظیمات بلوک
              </button>
            </div>
          ) : (
            <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 m-4 mb-0 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-teal-600 text-base">tune</span>
              تنظیمات بلوک
            </p>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {metaPanel && rightTab === 'meta' ? (
              metaPanel
            ) : settingsTarget ? (
              <div className="space-y-3">
                {!metaPanel && (
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-600 text-base">tune</span>
                    تنظیمات بلوک
                  </p>
                )}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200/60">
                  <span className="material-symbols-outlined text-teal-700">
                    {BLOCK_ICONS[settingsTarget.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-teal-900 dark:text-teal-100 truncate">
                      {BLOCK_LABELS[settingsTarget.type]}
                    </p>
                    {selectedMeta?.parentContainerId && (
                      <p className="text-[10px] text-teal-700/80 font-bold">
                        داخل کانتینر · ستون {(selectedMeta.columnIndex ?? 0) + 1}
                      </p>
                    )}
                  </div>
                </div>
                <BlockSettings
                  block={settingsTarget}
                  onChange={updateSelectedProps}
                  onAddNestedBlock={
                    containerForNestedSettings && selected?.type === 'container'
                      ? addNestedBlock
                      : undefined
                  }
                  onRemoveNestedBlock={
                    selected?.type === 'container' ? removeNestedBlock : undefined
                  }
                  onSelectNestedBlock={setSelectedId}
                />
                {selectedMeta?.parentContainerId && (
                  <button
                    type="button"
                    onClick={() => setSelectedId(selectedMeta.parentContainerId!)}
                    className="w-full py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600"
                  >
                    بازگشت به کانتینر والد
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeBlock(settingsTarget.id)}
                  className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100"
                >
                  حذف این بلوک
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-400">touch_app</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  یک بلوک را از بوم یا ساختار صفحه انتخاب کنید تا تنظیماتش اینجا نمایش داده شود.
                </p>
              </div>
            )}

            {(!metaPanel || rightTab === 'block') && selected?.type === 'container' && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 leading-relaxed">
                ویجت‌های قابل درج در ستون: {NESTABLE_WIDGET_TYPES.map((t) => BLOCK_LABELS[t]).join('، ')}
              </div>
            )}
          </div>
        </aside>
      </div>

      {contextMenu && (
        <BuilderContextMenu
          menu={contextMenu}
          hasTarget={Boolean(contextMenu.targetId || selectedId)}
          canPaste={clipboard?.kind === 'block' || clipboard?.kind === 'blocks'}
          canPasteStyle={
            clipboard?.kind === 'style' && Boolean(contextMenu.targetId || selectedId)
          }
          canCopyAll={blocks.length > 0}
          canDeleteAll={blocks.length > 0}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {saveToast && (
        <div
          className="pointer-events-none fixed bottom-5 left-5 z-[260] animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-emerald-600 text-white px-4 py-3 shadow-2xl shadow-emerald-900/30 border border-emerald-500/40 min-w-[220px]">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            <div className="min-w-0">
              <p className="text-xs font-black leading-none">ذخیره شد</p>
              <p className="text-[11px] font-medium opacity-90 mt-1">{saveToast}</p>
            </div>
            <button
              type="button"
              onClick={() => setSaveToast(null)}
              className="ms-auto p-1 rounded-lg hover:bg-white/15"
              aria-label="بستن"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
