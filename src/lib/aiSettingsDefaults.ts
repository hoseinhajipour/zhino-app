import type { AiProviderId, AiSettings } from '../types';

export const AI_PROVIDER_PRESETS: Record<
  AiProviderId,
  { label: string; baseUrl: string; defaultModel: string; docsUrl?: string }
> = {
  gapgpt: {
    label: 'GapGPT',
    baseUrl: 'https://api.gapgpt.app/v1',
    defaultModel: 'gpt-4o',
    docsUrl: 'https://gapgpt.app/platform-v2/docs/quickstart',
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    docsUrl: 'https://platform.openai.com/docs',
  },
  custom: {
    label: 'سفارشی (OpenAI-compatible)',
    baseUrl: '',
    defaultModel: 'gpt-4o',
  },
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  provider: 'gapgpt',
  apiKey: '',
  baseUrl: AI_PROVIDER_PRESETS.gapgpt.baseUrl,
  defaultModel: AI_PROVIDER_PRESETS.gapgpt.defaultModel,
};

export function mergeAiSettings(partial?: Partial<AiSettings> | null): AiSettings {
  const provider = (
    partial?.provider && partial.provider in AI_PROVIDER_PRESETS
      ? partial.provider
      : DEFAULT_AI_SETTINGS.provider
  ) as AiProviderId;
  const preset = AI_PROVIDER_PRESETS[provider];
  return {
    enabled: partial?.enabled ?? DEFAULT_AI_SETTINGS.enabled,
    provider,
    apiKey: typeof partial?.apiKey === 'string' ? partial.apiKey : DEFAULT_AI_SETTINGS.apiKey,
    baseUrl:
      typeof partial?.baseUrl === 'string' && partial.baseUrl.trim()
        ? partial.baseUrl.trim()
        : preset.baseUrl || DEFAULT_AI_SETTINGS.baseUrl,
    defaultModel:
      typeof partial?.defaultModel === 'string' && partial.defaultModel.trim()
        ? partial.defaultModel.trim()
        : preset.defaultModel,
  };
}

/** Apply provider preset URLs/models while keeping the current API key. */
export function applyAiProviderPreset(
  current: AiSettings,
  provider: AiProviderId
): AiSettings {
  const preset = AI_PROVIDER_PRESETS[provider];
  return mergeAiSettings({
    ...current,
    provider,
    baseUrl: preset.baseUrl || current.baseUrl,
    defaultModel: preset.defaultModel || current.defaultModel,
  });
}
