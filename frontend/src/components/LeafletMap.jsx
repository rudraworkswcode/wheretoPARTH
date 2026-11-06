import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LeafletMap({
  referenceTrace = [],
  noisyTrace = [],
  matchedTrace = null,
  kalmanTrace = null,
  currentCoord = null,
  currentBearing = 0,
  activePositionSource = 'osrm_match',
  turnSteps = [],
  maneuvers = []
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fittedRouteHashRef = useRef(null);
  const layersRef = useRef({
    referenceLine: null,
    noisyLine: null,
    noisyPoints: [],
    matchedLine: null,
    kalmanLine: null,
    vehicleMarker: null,
    startMarker: null,
    endMarker: null,
    stepMarkers: []
  });

  // Initialize Map with dark CARTO tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([12.90, 77.50], 12);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Voyager / Dark Navigation Tiles
      L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_52r0_1_4bf1cedc85b862faa6786a20', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Static Route & Reference Geometry Setup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !referenceTrace || referenceTrace.length < 2) return;

    const layers = layersRef.current;

    // Clear previous base layers
    if (layers.referenceLine) map.removeLayer(layers.referenceLine);
    if (layers.matchedLine) map.removeLayer(layers.matchedLine);
    if (layers.kalmanLine) map.removeLayer(layers.kalmanLine);
    if (layers.startMarker) map.removeLayer(layers.startMarker);
    if (layers.endMarker) map.removeLayer(layers.endMarker);
    layers.stepMarkers.forEach(m => map.removeLayer(m));
    layers.stepMarkers = [];

    const refLatLngs = referenceTrace.map(c => [c[1], c[0]]);

    // 1. Reference Driving Route Corridor (Subtle Cyan #00F0FF)
    layers.referenceLine = L.polyline(refLatLngs, {
      color: '#00F0FF',
      weight: 3,
      opacity: 0.55,
      dashArray: '2, 4',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // 2. OSRM Matched Active Route (Deep Blue #0047AB) - Rendered ONLY if OSRM returned valid match
    if (matchedTrace && matchedTrace.length >= 2) {
      const matchedLatLngs = matchedTrace.map(c => [c[1], c[0]]);
      layers.matchedLine = L.polyline(matchedLatLngs, {
        color: '#0047AB',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 3. Kalman Fallback Estimate (Distinct Amber #D97706) - Rendered ONLY if Kalman fallback used
    if (kalmanTrace && kalmanTrace.length >= 2) {
      const kalmanLatLngs = kalmanTrace.map(c => [c[1], c[0]]);
      layers.kalmanLine = L.polyline(kalmanLatLngs, {
        color: '#D97706',
        weight: 3.5,
        dashArray: '6, 6',
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 4. Start & Destination Markers
    const startIcon = L.divIcon({
      className: 'custom-flag-marker',
      html: `<div style="background:#000000; color:#FFFFFF; font-family:Orbitron; font-size:10px; font-weight:900; padding:3px 7px; border-radius:3px; border:1px solid #FFFFFF; box-shadow:0 0 10px rgba(255,255,255,0.4);">START</div>`,
      iconSize: [46, 20],
      iconAnchor: [23, 10]
    });

    const endIcon = L.divIcon({
      className: 'custom-flag-marker',
      html: `<div style="background:#FF0000; color:#FFFFFF; font-family:Orbitron; font-size:10px; font-weight:900; padding:3px 7px; border-radius:3px; border:1px solid #FFFFFF; box-shadow:0 0 12px #FF0000;">DEST</div>`,
      iconSize: [46, 20],
      iconAnchor: [23, 10]
    });

    layers.startMarker = L.marker(refLatLngs[0], { icon: startIcon }).addTo(map);
    layers.endMarker = L.marker(refLatLngs[refLatLngs.length - 1], { icon: endIcon }).addTo(map);

    // 5. Maneuver Step Markers & Lane Navigation Checkpoints
    const activeSteps = (turnSteps && turnSteps.length > 0) ? turnSteps : (maneuvers || []);
    if (activeSteps && activeSteps.length > 0) {
      activeSteps.forEach((st, idx) => {
        const loc = st.location || st.coord;
        if (loc && loc.length >= 2 && st.type !== 'arrive' && st.turnType !== 'destination') {
          const mIcon = L.divIcon({
            className: 'turn-icon-marker',
            html: `<div style="background:#000000; border:1.5px solid #FF5F1F; color:#FF5F1F; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:900; font-family:Orbitron; box-shadow:0 0 8px rgba(255,95,31,0.6);">${idx + 1}</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          const marker = L.marker([loc[1], loc[0]], { icon: mIcon }).addTo(map);
          layers.stepMarkers.push(marker);
        }
      });
    }

    // Only fit bounds on initial route load, preserving zoom level across navigation start & progression
    const routeHash = `${referenceTrace[0][0]},${referenceTrace[0][1]}->${referenceTrace[referenceTrace.length - 1][0]},${referenceTrace[referenceTrace.length - 1][1]}`;
    if (fittedRouteHashRef.current !== routeHash) {
      map.fitBounds(L.latLngBounds(refLatLngs), { padding: [50, 50] });
      fittedRouteHashRef.current = routeHash;
    }
  }, [referenceTrace, matchedTrace, kalmanTrace, turnSteps, maneuvers]);

  // Dynamic Noisy Satellite Trace Updates (Does NOT re-fit bounds)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layers = layersRef.current;

    if (layers.noisyLine) map.removeLayer(layers.noisyLine);
    layers.noisyPoints.forEach(p => map.removeLayer(p));
    layers.noisyPoints = [];

    if (noisyTrace && noisyTrace.length > 0) {
      const noisyLatLngs = noisyTrace.map(pt => [pt[1], pt[0]]);
      layers.noisyLine = L.polyline(noisyLatLngs, {
        color: '#FF5F1F',
        weight: 2,
        dashArray: '4, 6',
        opacity: 0.85
      }).addTo(map);

      // Add point markers for observed noisy positions
      noisyTrace.forEach((pt, idx) => {
        if (idx % 2 === 0) {
          const circle = L.circleMarker([pt[1], pt[0]], {
            radius: 2.5,
            fillColor: '#FF5F1F',
            color: '#FFFFFF',
            weight: 0.8,
            fillOpacity: 0.85
          }).addTo(map);
          layers.noisyPoints.push(circle);
        }
      });
    }
  }, [noisyTrace]);

  // Update Animated Vehicle Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentCoord) return;

    const layers = layersRef.current;
    const latLng = [currentCoord[1], currentCoord[0]];

    // Color vehicle icon based on active positioning source
    const markerColor = activePositionSource === 'osrm_match' ? '#0047AB' : activePositionSource === 'kalman_estimate' ? '#D97706' : '#FF5F1F';

    const carHtml = `
      <div style="transform: rotate(${currentBearing}deg); transition: transform 0.2s linear; width: 36px; height: 36px; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
          <circle cx="20" cy="20" r="18" fill="rgba(0, 71, 171, 0.2)" stroke="${markerColor}" stroke-width="2" />
          <polygon points="20,4 32,32 20,24 8,32" fill="${markerColor}" stroke="#FFFFFF" stroke-width="1.5" />
        </svg>
      </div>
    `;

    const carIcon = L.divIcon({
      className: 'f1-live-vehicle',
      html: carHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (!layers.vehicleMarker) {
      layers.vehicleMarker = L.marker(latLng, { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      layers.vehicleMarker.setLatLng(latLng);
      layers.vehicleMarker.setIcon(carIcon);
    }
  }, [currentCoord, currentBearing, activePositionSource]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px', borderRadius: '8px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Truthful Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 500,
        background: 'rgba(10, 12, 16, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--parth-border)',
        borderRadius: '6px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {/* Reference Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#00F0FF', borderRadius: '2px' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>OSRM Reference Route</span>
        </div>

        {/* Noisy GPS Signal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#FF5F1F', borderTop: '2px dashed #FF5F1F' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>Noisy GPS Signal</span>
        </div>

        {/* Matched Route (If Active) */}
        {matchedTrace && matchedTrace.length >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '4px', background: '#0047AB', borderRadius: '2px' }} />
            <span className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>Matched Active Route</span>
          </div>
        )}

        {/* Kalman Fallback Estimate (If Active) */}
        {kalmanTrace && kalmanTrace.length >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '4px', background: '#D97706', borderTop: '2px dashed #D97706' }} />
            <span className="font-rajdhani" style={{ fontSize: '11px', color: '#D97706' }}>Kalman Filter Estimate</span>
          </div>
        )}
      </div>
    </div>
  );
}
