export const MAX_ALTITUDE = 384_400_000;
export const WORLD_HEIGHT = 19000;
export const WORLD_TOP = 1200;
export const WORLD_BOTTOM = 950;

/**
 * Maps real altitude (meters) to world distance-from-ground (pixels).
 *
 * Piecewise design:
 * 1) 0..1,000 m   -> expanded spacing for ground detail
 * 2) 1k..20k m    -> moderate compression for mountains/aircraft range
 * 3) 20k..100k m  -> stronger compression for upper atmosphere
 * 4) 100k..1,000k -> compressed orbit-prep range (Kármán to LEO)
 * 5) 1,000k..Moon -> logarithmic compression for deep-space scale
 */
export function mapAltitudeToY(altitudeMeters: number): number {
  const a = Math.max(0, Math.min(MAX_ALTITUDE, altitudeMeters));

  if (a <= 1_000) return a * 0.34;
  if (a <= 20_000) return 340 + (a - 1_000) * 0.053;
  if (a <= 100_000) return 1_347 + (a - 20_000) * 0.015;
  if (a <= 1_000_000) return 2_547 + (a - 100_000) * 0.0036;

  const minLog = Math.log10(1_000_000);
  const maxLog = Math.log10(MAX_ALTITUDE);
  const t = (Math.log10(a) - minLog) / (maxLog - minLog);
  return 5_787 + t * 8_950;
}

export function mapYToAltitude(distanceFromGround: number): number {
  const y = Math.max(0, distanceFromGround);
  if (y <= 340) return y / 0.34;
  if (y <= 1_347) return 1_000 + (y - 340) / 0.053;
  if (y <= 2_547) return 20_000 + (y - 1_347) / 0.015;
  if (y <= 5_787) return 100_000 + (y - 2_547) / 0.0036;

  const minLog = Math.log10(1_000_000);
  const maxLog = Math.log10(MAX_ALTITUDE);
  const t = (y - 5_787) / 8_950;
  return Math.pow(10, minLog + t * (maxLog - minLog));
}

export function toWorldTop(altitudeMeters: number): number {
  return WORLD_HEIGHT - WORLD_BOTTOM - mapAltitudeToY(altitudeMeters);
}

export function altitudeLayerName(meters: number): string {
  if (meters < 500) return 'SURFACE';
  if (meters < 12_000) return 'TROPOSPHERE';
  if (meters < 50_000) return 'STRATOSPHERE';
  if (meters < 85_000) return 'MESOSPHERE';
  if (meters < 700_000) return 'THERMOSPHERE';
  if (meters < 20_000_000) return 'EXOSPHERE';
  return 'DEEP SPACE';
}

export function formatAltitude(meters: number): string {
  if (meters < 1000) return `${Math.round(meters).toLocaleString()} m`;
  if (meters < 1_000_000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000).toLocaleString()} km`;
}
