import type { Location } from '@/api/types';

function normalizeValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getLocationTownship(location: Location): string | null {
  return normalizeValue(location.township) ?? normalizeValue(location.district);
}

export function formatLocationDisplayName(location: Location): string {
  const city = normalizeValue(location.city);
  const township = getLocationTownship(location);

  const parts = [city, township].filter((part): part is string => part !== null);
  if (parts.length > 0) {
    return parts.join(' / ');
  }

  const coordinateName = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  const fallbackName = normalizeValue(location.name);
  if (fallbackName && fallbackName !== coordinateName) {
    return fallbackName;
  }

  return coordinateName;
}

export function formatLocationSecondaryName(location: Location): string | null {
  return normalizeValue(location.neighborhood) ?? null;
}
