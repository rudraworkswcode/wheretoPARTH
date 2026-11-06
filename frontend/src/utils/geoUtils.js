/**
 * Geographic and Navigation Utilities
 * Pure mathematical functions for spherical geodetic calculations.
 */

export const toRad = (deg) => (deg * Math.PI) / 180;
export const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Calculates distance between two [lon, lat] points in meters using Haversine formula
 */
export function haversineDistance(pt1, pt2) {
  if (!pt1 || !pt2) return 0;
  const [lon1, lat1] = pt1;
  const [lon2, lat2] = pt2;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return R * c;
}

/**
 * Calculates compass bearing (0-360 degrees) from pt1 to pt2
 */
export function calculateBearing(pt1, pt2) {
  if (!pt1 || !pt2) return 0;
  const [lon1, lat1] = pt1;
  const [lon2, lat2] = pt2;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const b = toDeg(Math.atan2(y, x));
  return (b + 360) % 360;
}

/**
 * Estimates dead-reckoning position during GNSS signal loss using last known coordinate and bearing
 */
export function estimateDeadReckoning(lastCoord, bearingDeg, speedKmh, elapsedSeconds) {
  if (!lastCoord) return lastCoord;
  const distMeters = (speedKmh * 1000 / 3600) * elapsedSeconds;
  const R = 6371000;
  const [lon, lat] = lastCoord;
  const latRad = toRad(lat);
  const lonRad = toRad(lon);
  const brgRad = toRad(bearingDeg);

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(distMeters / R) +
    Math.cos(latRad) * Math.sin(distMeters / R) * Math.cos(brgRad)
  );
  const newLon = lonRad + Math.atan2(
    Math.sin(brgRad) * Math.sin(distMeters / R) * Math.cos(latRad),
    Math.cos(distMeters / R) - Math.sin(latRad) * Math.sin(newLat)
  );

  return [Number(toDeg(newLon).toFixed(6)), Number(toDeg(newLat).toFixed(6))];
}
