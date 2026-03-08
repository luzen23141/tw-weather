import { useColorScheme } from 'react-native';

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

export const DARK: MDColors = {
  primary: '#22D3EE',
  onPrimary: '#083B44',
  primaryContainer: 'rgba(34, 211, 238, 0.18)',
  onPrimaryContainer: '#CFFAFE',
  secondary: '#7DD3E8',
  secondaryContainer: 'rgba(125, 211, 232, 0.14)',
  onSecondaryContainer: '#E0F7FF',
  tertiary: '#C4B5FD',
  onTertiary: '#2E2260',
  tertiaryContainer: 'rgba(196, 181, 253, 0.18)',
  onTertiaryContainer: '#F5F3FF',
  background: '#0F172A',
  onBackground: '#E5EDF5',
  surface: 'rgba(255, 255, 255, 0.12)',
  onSurface: '#E5EDF5',
  surfaceVariant: 'rgba(255, 255, 255, 0.16)',
  onSurfaceVariant: '#CBD5E1',
  surfaceContainerLow: 'rgba(255, 255, 255, 0.10)',
  surfaceContainer: 'rgba(255, 255, 255, 0.14)',
  outline: '#9AA9BB',
  error: '#FCA5A5',
  onError: '#450A0A',
  errorContainer: 'rgba(252, 165, 165, 0.18)',
  onErrorContainer: '#FEE2E2',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.24)',
  glassCard: 'rgba(255, 255, 255, 0.10)',
  glassElevated: 'rgba(255, 255, 255, 0.14)',
  glassTab: 'rgba(15, 23, 42, 0.92)',
  glassHeader: 'rgba(15, 23, 42, 0.92)',
};

export function getMDColors(theme: 'light' | 'dark'): MDColors {
  return theme === 'dark' ? DARK : LIGHT;
}

export function useMDColors(): MDColors {
  const colorScheme = useColorScheme();
  return getMDColors(colorScheme === 'dark' ? 'dark' : 'light');
}
