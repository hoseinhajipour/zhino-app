import React, { useMemo } from 'react';
import type { Article, Doctor, ServiceBlock, SitePage } from '../../types';
import { saveSitePage } from '../../lib/dbService';
import { getDefaultBlocksForPage } from '../../lib/sitePageDefaults';
import { PageBuilderEditor, SITE_WIDGET_TYPES } from './PageBuilderEditor';

interface SitePageBuilderProps {
  page: SitePage;
  allServices: import('../../types').ServiceItem[];
  doctors: Doctor[];
  articles?: Article[];
  onClose: () => void;
  onSaved: (updated: SitePage) => void;
}

export const SitePageBuilder: React.FC<SitePageBuilderProps> = ({
  page,
  allServices,
  doctors,
  articles,
  onClose,
  onSaved,
}) => {
  const initialBlocks = useMemo(() => getDefaultBlocksForPage(page), [page]);

  const handleSave = async (blocks: ServiceBlock[]) => {
    const updated: SitePage = {
      ...page,
      pageBuilder: { version: 1, blocks },
      updatedAt: new Date().toISOString(),
    };
    await saveSitePage(updated);
    onSaved(updated);
  };

  return (
    <PageBuilderEditor
      title={page.title}
      eyebrow="صفحه‌ساز سایت"
      initialBlocks={initialBlocks}
      widgetTypes={SITE_WIDGET_TYPES}
      allServices={allServices}
      doctors={doctors}
      articles={articles}
      contextId={page.id}
      onClose={onClose}
      onSave={handleSave}
    />
  );
};
