/**
 * Geographic, Navigation, and NavIC Utilities
 * Pure mathematical functions for spherical geodetic calculations & lane-level navigation.
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

/**
 * Scans route coordinates and detects road & lane manoeuvres (turns > 25 deg).
 * Calculates cumulative distances and provides lane guidance recommendations.
 */
export function detectManeuvers(coordinates) {
  if (!coordinates || coordinates.length < 3) return [];

  // Compute cumulative distance along the path
  const cumDists = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const d = haversineDistance(coordinates[i - 1], coordinates[i]);
    cumDists.push(cumDists[i - 1] + d);
  }

  const totalDist = cumDists[cumDists.length - 1];
  const maneuvers = [];

  for (let i = 2; i < coordinates.length - 2; i += 3) {
    const pPrev = coordinates[i - 2];
    const pCurr = coordinates[i];
    const pNext = coordinates[Math.min(i + 2, coordinates.length - 1)];

    const b1 = calculateBearing(pPrev, pCurr);
    const b2 = calculateBearing(pCurr, pNext);

    let angleDiff = b2 - b1;
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;

    const absAngle = Math.abs(angleDiff);
    if (absAngle >= 25) {
      let turnType = 'slight_right';
      let instruction = 'Keep slight right';
      let laneGuidance = 'Keep Center-Right Lane';
      let recommendedLane = 'Center-Right';
      let laneIndex = 1; // 0: Left, 1: Center, 2: Right

      if (angleDiff > 60) {
        turnType = 'sharp_right';
        instruction = 'Turn right at junction';
        laneGuidance = 'Shift to Right Turn Lane';
        recommendedLane = 'Right Turn Lane';
        laneIndex = 2;
      } else if (angleDiff > 25) {
        turnType = 'right';
        instruction = 'Turn right';
        laneGuidance = 'Stay in Right Lane';
        recommendedLane = 'Right Lane';
        laneIndex = 2;
      } else if (angleDiff < -60) {
        turnType = 'sharp_left';
        instruction = 'Turn left at junction';
        laneGuidance = 'Shift to Left Turn Lane';
        recommendedLane = 'Left Turn Lane';
        laneIndex = 0;
      } else if (angleDiff < -25) {
        turnType = 'left';
        instruction = 'Turn left';
        laneGuidance = 'Stay in Left Lane';
        recommendedLane = 'Left Lane';
        laneIndex = 0;
      }

      const lanes = [
        { id: 0, label: 'L1 (LEFT)', active: laneIndex === 0, arrow: 'left' },
        { id: 1, label: 'L2 (THRU)', active: laneIndex === 1, arrow: 'straight' },
        { id: 2, label: 'L3 (RIGHT)', active: laneIndex === 2, arrow: 'right' }
      ];

      maneuvers.push({
        index: i,
        coord: pCurr,
        location: pCurr,
        distanceFromStart: cumDists[i],
        turnType,
        angle: Math.round(absAngle),
        instruction,
        laneGuidance,
        recommendedLane,
        laneIndex,
        totalLanes: 3,
        lanes
      });
    }
  }

  // Add final destination arrival
  maneuvers.push({
    index: coordinates.length - 1,
    coord: coordinates[coordinates.length - 1],
    location: coordinates[coordinates.length - 1],
    distanceFromStart: totalDist,
    turnType: 'destination',
    angle: 0,
    instruction: 'Destination Reached',
    laneGuidance: 'Exit road to destination bay',
    recommendedLane: 'Exit Bay',
    laneIndex: 2,
    totalLanes: 3,
    lanes: [
      { id: 0, label: 'L1', active: false, arrow: 'straight' },
      { id: 1, label: 'L2', active: false, arrow: 'straight' },
      { id: 2, label: 'EXIT BAY', active: true, arrow: 'exit' }
    ]
  });

  return maneuvers;
}

/**
 * Calculates total route metrics
 */
export function calculateRouteMetrics(coordinates) {
  if (!coordinates || coordinates.length < 2) {
    return { totalDistanceKm: 0, totalDurationMin: 0 };
  }
  let totalMeters = 0;
  for (let i = 1; i < coordinates.length; i++) {
    totalMeters += haversineDistance(coordinates[i - 1], coordinates[i]);
  }
  const totalKm = totalMeters / 1000;
  const minutes = Math.round((totalKm / 45) * 60);
  return {
    totalMeters: Math.round(totalMeters),
    totalDistanceKm: Number(totalKm.toFixed(2)),
    totalDurationMin: Math.max(2, minutes)
  };
}
