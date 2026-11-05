import rawRoutes from './rawRoutes.json';
import { calculateRouteMetrics, detectManeuvers } from '../utils/geoUtils';

export const ROUTES = Object.keys(rawRoutes).reduce((acc, routeId) => {
  const r = rawRoutes[routeId];
  const metrics = calculateRouteMetrics(r.coordinates);
  const maneuvers = detectManeuvers(r.coordinates);

  acc[routeId] = {
    ...r,
    ...metrics,
    maneuvers,
    startName: r.from,
    endName: r.to,
    startCoord: r.coordinates[0],
    endCoord: r.coordinates[r.coordinates.length - 1]
  };
  return acc;
}, {});

export const ROUTE_LIST = Object.values(ROUTES);

export const DEFAULT_ROUTE_ID = 'R-01';

export const LOCATIONS = ['Kengeri', 'Kanakapura', 'Somapura'];

