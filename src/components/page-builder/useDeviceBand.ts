import { useEffect, useState } from 'react';
import {
  resolveDeviceBandFromWidth,
  type DeviceBand,
} from '../../lib/responsiveGrid';
import { useBuilderDevicePreview } from './BuilderDevicePreviewContext';

/**
 * Active device band: builder toolbar when present, otherwise live viewport width.
 */
export function useDeviceBand(): DeviceBand {
  const previewDevice = useBuilderDevicePreview();
  const [viewportBand, setViewportBand] = useState<DeviceBand>(() =>
    typeof window !== 'undefined'
      ? resolveDeviceBandFromWidth(window.innerWidth)
      : 'desktop'
  );

  useEffect(() => {
    if (previewDevice) return;

    const apply = () => setViewportBand(resolveDeviceBandFromWidth(window.innerWidth));
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [previewDevice]);

  return previewDevice ?? viewportBand;
}
