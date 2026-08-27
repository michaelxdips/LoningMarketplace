/**
 * Haversine formula calculation & distance formatting for V2.
 *
 * Calculate distance between two coordinates in kilometers and format for UI.
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates distance between two latitude/longitude pairs using Haversine formula.
 * Returns distance in kilometers (km).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formats distance in km to human readable string.
 * Example:
 * - < 1 km: "350 m"
 * - >= 1 km: "2.4 km" (or "1 km" if rounded integer)
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '0 m';

  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }

  // If >= 1km, format with 1 decimal place if needed, strip trailing zero if whole number
  const formatted = km >= 100 ? Math.round(km).toString() : (Math.round(km * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return `${formatted} km`;
}
