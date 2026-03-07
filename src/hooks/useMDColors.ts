import { useColorScheme } from 'nativewind';

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
  primaryContainer: 'rgba(8, 145, 178, 0.12)',
  onPrimaryContainer: '#064E5E',
  secondary: '#4B6B78',
  secondaryContainer: 'rgba(75, 107, 120, 0.12)',
  onSecondaryContainer: '#1A3640',
  tertiary: '#6B5FA0',
  onTertiary: '#FFFFFF',
  tertiaryContainer: 'rgba(107, 95, 160, 0.12)',
  onTertiaryContainer: '#3B3270',
  background: '#F0F4F8',
  onBackground: '#1A2332',
  surface: 'rgba(255, 255, 255, 0.60)',
  onSurface: '#1A2332',
  surfaceVariant: 'rgba(255, 255, 255, 0.45)',
  onSurfaceVariant: '#4A5568',
  surfaceContainerLow: 'rgba(255, 255, 255, 0.50)',
  surfaceContainer: 'rgba(255, 255, 255, 0.55)',
  outline: '#7B8FA0',
  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: 'rgba(220, 38, 38, 0.12)',
  onErrorContainer: '#7F1D1D',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.25)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.40)',
  glassCard: 'rgba(255, 255, 255, 0.55)',
  glassElevated: 'rgba(255, 255, 255, 0.70)',
  glassTab: 'rgba(255, 255, 255, 0.80)',
  glassHeader: 'rgba(255, 255, 255, 0.80)',
};

export const DARK: MDColors = {
  primary: '#22D3EE',
  onPrimary: '#0A3E48',
  primaryContainer: 'rgba(34, 211, 238, 0.15)',
  onPrimaryContainer: '#A5F3FC',
  secondary: '#7DD3E8',
  secondaryContainer: 'rgba(125, 211, 232, 0.12)',
  onSecondaryContainer: '#CFF4FC',
  tertiary: '#C4B5FD',
  onTertiary: '#2E2260',
  tertiaryContainer: 'rgba(196, 181, 253, 0.15)',
  onTertiaryContainer: '#EDE9FE',
  background: '#0F172A',
  onBackground: '#E2E8F0',
  surface: 'rgba(255, 255, 255, 0.06)',
  onSurface: '#E2E8F0',
  surfaceVariant: 'rgba(255, 255, 255, 0.08)',
  onSurfaceVariant: '#94A3B8',
  surfaceContainerLow: 'rgba(255, 255, 255, 0.04)',
  surfaceContainer: 'rgba(255, 255, 255, 0.06)',
  outline: '#64748B',
  error: '#FCA5A5',
  onError: '#450A0A',
  errorContainer: 'rgba(252, 165, 165, 0.15)',
  onErrorContainer: '#FEE2E2',
  // Glass token
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.18)',
  glassCard: 'rgba(255, 255, 255, 0.08)',
  glassElevated: 'rgba(255, 255, 255, 0.10)',
  glassTab: 'rgba(15, 23, 42, 0.90)',
  glassHeader: 'rgba(15, 23, 42, 0.90)',
};

export function getMDColors(theme: 'light' | 'dark'): MDColors {
  return theme === 'dark' ? DARK : LIGHT;
}

export function useMDColors(): MDColors {
  const { colorScheme } = useColorScheme();
  return getMDColors(colorScheme === 'dark' ? 'dark' : 'light');
}
