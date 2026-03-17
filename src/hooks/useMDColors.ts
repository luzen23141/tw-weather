import { useSettingsStore } from '@/store/settings.store';

export interface MDColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  outline: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  // Glass token
  glassBorder: string;
  glassBorderStrong: string;
  glassCard: string;
  glassElevated: string;
  glassTab: string;
  glassHeader: string;
}

export const LIGHT: MDColors = {
  primary: '#5B8DEF',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(91, 141, 239, 0.16)',
  onPrimaryContainer: '#1A3A7A',
  secondary: '#7B8FAE',
  secondaryContainer: 'rgba(123, 143, 174, 0.14)',
  onSecondaryContainer: '#2A3D5C',
  tertiary: '#9B8FD0',
  onTertiary: '#FFFFFF',
  tertiaryContainer: 'rgba(155, 143, 208, 0.14)',
  onTertiaryContainer: '#3B3270',
  background: '#3A4F8A',
  onBackground: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.18)',
  onSurface: '#FFFFFF',
  surfaceVariant: 'rgba(255, 255, 255, 0.12)',
  onSurfaceVariant: 'rgba(255, 255, 255, 0.72)',
  surfaceContainerLow: 'rgba(255, 255, 255, 0.14)',
  surfaceContainer: 'rgba(255, 255, 255, 0.18)',
  outline: 'rgba(255, 255, 255, 0.5)',
  error: '#FF6B6B',
  onError: '#FFFFFF',
  errorContainer: 'rgba(255, 107, 107, 0.18)',
  onErrorContainer: '#FFD0D0',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.25)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.40)',
  glassCard: 'rgba(255, 255, 255, 0.16)',
  glassElevated: 'rgba(255, 255, 255, 0.22)',
  glassTab: 'rgba(30, 50, 110, 0.55)',
  glassHeader: 'rgba(35, 52, 100, 0.45)',
};

export const DARK: MDColors = {
  primary: '#7BA4F7',
  onPrimary: '#0D2550',
  primaryContainer: 'rgba(123, 164, 247, 0.18)',
  onPrimaryContainer: '#B8D0FF',
  secondary: '#8EA3C4',
  secondaryContainer: 'rgba(142, 163, 196, 0.16)',
  onSecondaryContainer: '#C8D8F0',
  tertiary: '#B8ACE8',
  onTertiary: '#2D2360',
  tertiaryContainer: 'rgba(184, 172, 232, 0.16)',
  onTertiaryContainer: '#DDD4F8',
  background: '#1A2340',
  onBackground: '#E4EAFF',
  surface: 'rgba(30, 42, 72, 0.75)',
  onSurface: '#E4EAFF',
  surfaceVariant: 'rgba(40, 55, 90, 0.65)',
  onSurfaceVariant: 'rgba(228, 234, 255, 0.65)',
  surfaceContainerLow: 'rgba(25, 36, 62, 0.72)',
  surfaceContainer: 'rgba(30, 42, 72, 0.78)',
  outline: 'rgba(228, 234, 255, 0.35)',
  error: '#FF8A8A',
  onError: '#3A0A0A',
  errorContainer: 'rgba(255, 138, 138, 0.18)',
  onErrorContainer: '#FFD0D0',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.22)',
  glassCard: 'rgba(25, 36, 62, 0.72)',
  glassElevated: 'rgba(30, 42, 72, 0.85)',
  glassTab: 'rgba(18, 26, 48, 0.90)',
  glassHeader: 'rgba(18, 26, 48, 0.90)',
};

export function useMDColors(): MDColors {
  const theme = useSettingsStore((s) => s.theme);
  return theme === 'dark' ? DARK : LIGHT;
}
