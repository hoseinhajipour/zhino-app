import type { BlockScrollAnimation } from '../types';

export const BLOCK_SCROLL_ANIMATIONS: {
  value: BlockScrollAnimation;
  label: string;
}[] = [
  { value: 'fade-in', label: 'محو شدن (Fade In)' },
  { value: 'fade-up', label: 'محو + بالا (Fade Up)' },
  { value: 'fade-down', label: 'محو + پایین (Fade Down)' },
];

export function normalizeBlockScrollAnimation(
  value: unknown
): BlockScrollAnimation {
  if (value === 'fade-in' || value === 'fade-up' || value === 'fade-down') {
    return value;
  }
  return 'fade-up';
}

export function getBlockScrollAnimation(props: Record<string, unknown>): {
  enabled: boolean;
  type: BlockScrollAnimation;
} {
  return {
    enabled: Boolean(props.animateEnabled),
    type: normalizeBlockScrollAnimation(props.animateType),
  };
}
