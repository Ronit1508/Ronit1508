import type { Layer } from '../data/altitudeItems';

export const MAX_ALTITUDE_METERS = 384_400_000;
export const WORLD_HEIGHT_PX = 18600;
export const WORLD_TOP_PADDING = 1300;
export const WORLD_BOTTOM_PADDING = 900;

/**
 * Piecewise altitude mapping tuned for readability:
 * - 0..1 km is expanded so low-altitude objects don't collapse together.
 * - 1..20 km keeps aviation objects spatially meaningful.
 * - 20..100 km compresses upper atmosphere.
 * - 100..1000 km keeps LEO objects separated.
 * - 1000 km..Moon switches to logarithmic compression so high orbits + Moon are reachable.
 */
export function mapAltitudeToWorldY(altitudeMeters: number): number {
  const a = Math.max(0, Math.min(MAX_ALTITUDE_METERS, altitudeMeters));

  if (a <= 1_000) return a * 0.32;
  if (a <= 20_000) return 320 + (a - 1_000) * 0.052;
  if (a <= 100_000) return 1_308 + (a - 20_000) * 0.014;
  if (a <= 1_000_000) return 2_428 + (a - 100_000) * 0.0032;

  const minLog = Math.log10(1_000_000);
  const maxLog = Math.log10(MAX_ALTITUDE_METERS);
  const currentLog = Math.log10(a);
  return 5_308 + ((currentLog - minLog) / (maxLog - minLog)) * 8_900;
}

export function mapWorldYToAltitude(worldY: number): number {
  const y = Math.max(0, worldY);
  if (y <= 320) return y / 0.32;
  if (y <= 1_308) return 1_000 + (y - 320) / 0.052;
  if (y <= 2_428) return 20_000 + (y - 1_308) / 0.014;
  if (y <= 5_308) return 100_000 + (y - 2_428) / 0.0032;

  const minLog = Math.log10(1_000_000);
  const maxLog = Math.log10(MAX_ALTITUDE_METERS);
  const n = (y - 5_308) / 8_900;
  return Math.pow(10, minLog + n * (maxLog - minLog));
}

export function altitudeToTop(altitudeMeters: number): number {
  return WORLD_HEIGHT_PX - WORLD_BOTTOM_PADDING - mapAltitudeToWorldY(altitudeMeters);
}

export function getLayerByAltitude(meters: number): Layer {
  if (meters < 500) return 'Surface';
  if (meters < 12_000) return 'Troposphere';
  if (meters < 50_000) return 'Stratosphere';
  if (meters < 85_000) return 'Mesosphere';
  if (meters < 700_000) return 'Thermosphere';
  if (meters < 20_000_000) return 'Exosphere';
  return 'Deep Space';
}

export function formatAltitude(meters: number): string {
  if (meters < 1_000) return `${Math.round(meters).toLocaleString()} m`;
  if (meters < 1_000_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${Math.round(meters / 1_000).toLocaleString()} km`;
}
