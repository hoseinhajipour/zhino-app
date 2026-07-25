import React, { useEffect, useState } from 'react';
import {
  readResponsiveCols,
  resolveColsForWidth,
  type ColCount,
} from '../../lib/responsiveGrid';
import { useBuilderDevicePreview } from './BuilderDevicePreviewContext';

interface ResponsiveGridProps {
  columnsMobile?: unknown;
  columnsTablet?: unknown;
  columnsDesktop?: unknown;
  fallbacks?: { mobile?: number; tablet?: number; desktop?: number };
  className?: string;
  /** Override grid-template-columns (e.g. custom column widths). */
  templateColumns?: string;
  /**
   * Layout direction of items:
   * row | row-reverse | column | column-reverse
   */
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  children: React.ReactNode;
}

function colsForPreview(
  preview: 'desktop' | 'tablet' | 'mobile' | null,
  mobile: ColCount,
  tablet: ColCount,
  desktop: ColCount
): ColCount | null {
  if (preview === 'mobile') return mobile;
  if (preview === 'tablet') return tablet;
  if (preview === 'desktop') return desktop;
  return null;
}

/**
 * Grid that picks column count from:
 * 1) page-builder device toolbar (when present) — synchronous, ignores canvas width
 * 2) viewport width on the live site (not the element's own width)
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  columnsMobile,
  columnsTablet,
  columnsDesktop,
  fallbacks,
  className = '',
  templateColumns,
  direction = 'row',
  children,
}) => {
  const previewDevice = useBuilderDevicePreview();
  const { mobile, tablet, desktop } = readResponsiveCols(
    columnsMobile,
    columnsTablet,
    columnsDesktop,
    fallbacks
  );

  const previewCols = colsForPreview(previewDevice, mobile, tablet, desktop);
  const [viewportCols, setViewportCols] = useState<ColCount>(() =>
    typeof window !== 'undefined'
      ? resolveColsForWidth(window.innerWidth, mobile, tablet, desktop)
      : desktop
  );

  useEffect(() => {
    if (previewDevice) return;

    const apply = () => {
      setViewportCols(resolveColsForWidth(window.innerWidth, mobile, tablet, desktop));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [previewDevice, mobile, tablet, desktop]);

  const cols = previewCols ?? viewportCols;
  const isVertical = direction === 'column' || direction === 'column-reverse';
  const gridTemplateColumns = isVertical
    ? 'minmax(0, 1fr)'
    : templateColumns || `repeat(${cols}, minmax(0, 1fr))`;

  const layoutStyle: React.CSSProperties = isVertical
    ? {
        display: 'flex',
        flexDirection: direction,
        flexWrap: 'nowrap',
      }
    : {
        display: 'grid',
        gridTemplateColumns,
        // row = inherit page RTL; row-reverse = force LTR so first column is on the left
        direction: direction === 'row-reverse' ? 'ltr' : undefined,
      };

  return (
    <div
      className={`w-full min-w-0 ${className}`.trim()}
      style={layoutStyle}
      data-cols={isVertical ? 1 : cols}
      data-direction={direction}
      data-device={previewDevice || 'viewport'}
    >
      {children}
    </div>
  );
};
