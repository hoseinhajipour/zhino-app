import React, { useMemo } from 'react';
import type { Doctor, ServiceBlock, ServiceItem, ServicePageBuilder as ServicePageDoc } from '../../types';
import { getPageBuilderForService } from '../../lib/landingToBlocks';
import { saveService } from '../../lib/dbService';
import { PageBuilderEditor, SERVICE_WIDGET_TYPES } from './PageBuilderEditor';

interface ServicePageBuilderProps {
  service: ServiceItem;
  allServices: ServiceItem[];
  doctors: Doctor[];
  onClose: () => void;
  onSaved: (updated: ServiceItem) => void;
}

export const ServicePageBuilder: React.FC<ServicePageBuilderProps> = ({
  service,
  allServices,
  doctors,
  onClose,
  onSaved,
}) => {
  const initial = useMemo(() => getPageBuilderForService(service), [service]);

  const handleSave = async (blocks: ServiceBlock[]) => {
    const pageBuilder: ServicePageDoc = { version: 1, blocks };
    const updated: ServiceItem = { ...service, pageBuilder };
    await saveService(updated);
    onSaved(updated);
  };

  return (
    <PageBuilderEditor
      title={service.title}
      eyebrow="صفحه‌ساز خدمت"
      initialBlocks={initial.blocks}
      widgetTypes={SERVICE_WIDGET_TYPES}
      allServices={allServices}
      doctors={doctors}
      contextId={service.id}
      onClose={onClose}
      onSave={handleSave}
    />
  );
};
