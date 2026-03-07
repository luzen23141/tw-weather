import type { Location, LocationDisplayFormat } from '@/api/types';

function normalizeValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getLocationTownship(location: Location): string | null {
  return normalizeValue(location.township) ?? normalizeValue(location.district);
}

export function formatLocationDisplayName(
  location: Location,
  format: LocationDisplayFormat,
): string {
  const country = normalizeValue(location.country);
  const city = normalizeValue(location.city);
  const township = getLocationTownship(location);
  const neighborhood = normalizeValue(location.neighborhood);

  if (format === 'full') {
    const fullName = [country, city, township, neighborhood].filter(
      (part): part is string => part !== null,
    );
    if (fullName.length > 0) {
      return fullName.join('/');
    }
  }

  if (format === 'city-township') {
    const cityTownship = [city, township].filter((part): part is string => part !== null);
    if (cityTownship.length > 0) {
      return cityTownship.join('/');
    }
  }

  if (township) {
    return township;
  }

  if (city) {
    return city;
  }

  return location.name;
}

export function formatLocationSecondaryName(
  location: Location,
  format: LocationDisplayFormat,
): string | null {
  if (format === 'full') {
    return null;
  }

  const city = normalizeValue(location.city);
  const township = getLocationTownship(location);
  const neighborhood = normalizeValue(location.neighborhood);

  if (format === 'township') {
    const parts = [city, neighborhood].filter((part): part is string => part !== null);
    return parts.length > 0 ? parts.join(' · ') : null;
  }

  const parts = [neighborhood].filter((part): part is string => part !== null);
  if (parts.length > 0) {
    return parts.join(' · ');
  }

  if (city && !township) {
    return city;
  }

  return null;
}
