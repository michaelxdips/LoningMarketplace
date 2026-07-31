export type Coordinates = { latitude: number; longitude: number };

export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;

const round6 = (value: number) => {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function normalizeCoordinates(latitude: unknown, longitude: unknown): Coordinates | undefined {
  if (!finite(latitude) || !finite(longitude)) return undefined;
  const lat = round6(latitude);
  const lng = round6(longitude);
  if (lat < LATITUDE_MIN || lat > LATITUDE_MAX) return undefined;
  if (lng < LONGITUDE_MIN || lng > LONGITUDE_MAX) return undefined;
  return { latitude: lat, longitude: lng };
}

export function parsePgNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return round6(parsed);
}
