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
  primary: '#0891B2',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(8, 145, 178, 0.14)',
  onPrimaryContainer: '#064E5E',
  secondary: '#4B6B78',
  secondaryContainer: 'rgba(75, 107, 120, 0.14)',
  onSecondaryContainer: '#1A3640',
  tertiary: '#6B5FA0',
  onTertiary: '#FFFFFF',
  tertiaryContainer: 'rgba(107, 95, 160, 0.14)',
  onTertiaryContainer: '#3B3270',
  background: '#EEF4F8',
  onBackground: '#16202C',
  surface: 'rgba(255, 255, 255, 0.76)',
  onSurface: '#16202C',
  surfaceVariant: 'rgba(255, 255, 255, 0.62)',
  onSurfaceVariant: '#425466',
  surfaceContainerLow: 'rgba(255, 255, 255, 0.68)',
  surfaceContainer: 'rgba(255, 255, 255, 0.74)',
  outline: '#617487',
  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: 'rgba(220, 38, 38, 0.14)',
  onErrorContainer: '#7F1D1D',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.45)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.72)',
  glassCard: 'rgba(255, 255, 255, 0.72)',
  glassElevated: 'rgba(255, 255, 255, 0.82)',
  glassTab: 'rgba(255, 255, 255, 0.90)',
  glassHeader: 'rgba(255, 255, 255, 0.90)',
};

export function useMDColors(): MDColors {
  return LIGHT;
}
