import type { MellatSettings } from '../types';

export const DEFAULT_MELLAT_SETTINGS: MellatSettings = {
  enabled: false,
  terminalId: '',
  username: '',
  password: '',
  callbackUrl: '',
};

export function mergeMellatSettings(partial?: Partial<MellatSettings> | null): MellatSettings {
  const base = DEFAULT_MELLAT_SETTINGS;
  return {
    enabled: partial?.enabled === true,
    terminalId: String(partial?.terminalId ?? base.terminalId).trim(),
    username: String(partial?.username ?? base.username).trim(),
    password: String(partial?.password ?? base.password),
    callbackUrl: String(partial?.callbackUrl ?? base.callbackUrl ?? '').trim(),
  };
}
