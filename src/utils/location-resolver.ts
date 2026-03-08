import type { Location } from '@/api/types';
import { TAIWAN_CITIES } from '@/constants/taiwan-locations';
import { formatLocationDisplayName } from '@/utils/location-display';

const DISTRICT_MATCH_MAX_KM = 30;
const CITY_MATCH_MAX_KM = 80;

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(b.longitude - a.longitude);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);

  const haversine = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_KM * arc;
}

function createCoordinateName(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

function createCoordinateLocation(latitude: number, longitude: number): Location {
  return {
    latitude,
    longitude,
    name: createCoordinateName(latitude, longitude),
  };
}

export function resolveTaiwanLocation(latitude: number, longitude: number): Location {
  const coordinate = { latitude, longitude };

  let nearestCity: (typeof TAIWAN_CITIES)[number] | null = null;
  let nearestCityDistance = Number.POSITIVE_INFINITY;

  let nearestDistrict: {
    cityName: string;
    districtName: string;
    distanceKm: number;
  } | null = null;

  for (const city of TAIWAN_CITIES) {
    const cityDistance = calculateDistanceKm(coordinate, city);
    if (cityDistance < nearestCityDistance) {
      nearestCityDistance = cityDistance;
      nearestCity = city;
    }

    for (const district of city.districts) {
      const districtDistance = calculateDistanceKm(coordinate, district);
      if (!nearestDistrict || districtDistance < nearestDistrict.distanceKm) {
        nearestDistrict = {
          cityName: city.name,
          districtName: district.name,
          distanceKm: districtDistance,
        };
      }
    }
  }

  if (nearestDistrict && nearestDistrict.distanceKm <= DISTRICT_MATCH_MAX_KM) {
    const location: Location = {
      latitude,
      longitude,
      name: createCoordinateName(latitude, longitude),
      country: '台灣',
      city: nearestDistrict.cityName,
      district: nearestDistrict.districtName,
      township: nearestDistrict.districtName,
    };

    location.name = formatLocationDisplayName(location, 'township');
    return location;
  }

  if (nearestCity && nearestCityDistance <= CITY_MATCH_MAX_KM) {
    const location: Location = {
      latitude,
      longitude,
      name: createCoordinateName(latitude, longitude),
      country: '台灣',
      city: nearestCity.name,
    };

    location.name = formatLocationDisplayName(location, 'township');
    return location;
  }

  return createCoordinateLocation(latitude, longitude);
}
