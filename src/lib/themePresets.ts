export type ThemePreset = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
};

/** Default color palettes for the installer wizard. */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'zhino',
    name: 'ژینو',
    primaryColor: '#b5106a',
    secondaryColor: '#2c694e',
  },
  {
    id: 'emerald',
    name: 'زمردی',
    primaryColor: '#0f766e',
    secondaryColor: '#134e4a',
  },
  {
    id: 'navy',
    name: 'سرمه‌ای',
    primaryColor: '#1e3a5f',
    secondaryColor: '#c4a35a',
  },
  {
    id: 'coral',
    name: 'مرجانی',
    primaryColor: '#e11d48',
    secondaryColor: '#0f172a',
  },
  {
    id: 'slate',
    name: 'خاکستری مدرن',
    primaryColor: '#334155',
    secondaryColor: '#0d9488',
  },
];
