import React, { createContext, useContext } from 'react';

/** Page-builder device toolbar selection; null on the live public site. */
export type BuilderDevicePreview = 'desktop' | 'tablet' | 'mobile';

export const BuilderDevicePreviewContext = createContext<BuilderDevicePreview | null>(null);

export function useBuilderDevicePreview(): BuilderDevicePreview | null {
  return useContext(BuilderDevicePreviewContext);
}
