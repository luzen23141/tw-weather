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
  primary: '#7C9BFF',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(124, 155, 255, 0.18)',
  onPrimaryContainer: '#EAF0FF',
  secondary: '#9EC5FF',
  secondaryContainer: 'rgba(158, 197, 255, 0.16)',
  onSecondaryContainer: '#EEF5FF',
  tertiary: '#D39BFF',
  onTertiary: '#FFFFFF',
  tertiaryContainer: 'rgba(211, 155, 255, 0.16)',
  onTertiaryContainer: '#FAF2FF',
  background: '#5168B7',
  onBackground: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.18)',
  onSurface: '#FFFFFF',
  surfaceVariant: 'rgba(255, 255, 255, 0.12)',
  onSurfaceVariant: 'rgba(255, 255, 255, 0.78)',
  surfaceContainerLow: 'rgba(255, 255, 255, 0.12)',
  surfaceContainer: 'rgba(255, 255, 255, 0.16)',
  outline: 'rgba(255, 255, 255, 0.42)',
  error: '#FF6B6B',
  onError: '#FFFFFF',
  errorContainer: 'rgba(255, 107, 107, 0.18)',
  onErrorContainer: '#FFD0D0',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.26)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.42)',
  glassCard: 'rgba(255, 255, 255, 0.15)',
  glassElevated: 'rgba(255, 255, 255, 0.22)',
  glassTab: 'rgba(66, 91, 178, 0.46)',
  glassHeader: 'rgba(74, 101, 191, 0.36)',
};

export function useMDColors(): MDColors {
  return LIGHT;
}
