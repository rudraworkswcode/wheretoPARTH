import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LeafletMap({
  route,
  noisyTrace,
  matchedTrace,
  currentCoord,
  currentBearing = 0,
  activeAlertManeuver
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    noisyLine: null,
    noisyPoints: [],
    matchedLine: null,
    vehicleMarker: null,
    startMarker: null,
    endMarker: null,
    maneuverMarkers: []
  });

  // Initialize Map with dark CARTO tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([12.88, 77.50], 12);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Dark navigation surface basemap (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Route and Traces according to approved palette:
  // Red (#FF0000) for primary active/matched route
  // Neon Orange (#FF5F1F) for noisy satellite trace & manoeuvre emphasis
  // White (#FFFFFF) for markers, labels, high contrast details
  // Black (#000000) for base surface
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !route || !route.coordinates) return;

    const layers = layersRef.current;

    // Clear previous vector layers
    if (layers.noisyLine) map.removeLayer(layers.noisyLine);
    if (layers.matchedLine) map.removeLayer(layers.matchedLine);
    if (layers.startMarker) map.removeLayer(layers.startMarker);
    if (layers.endMarker) map.removeLayer(layers.endMarker);
    layers.noisyPoints.forEach(p => map.removeLayer(p));
    layers.noisyPoints = [];
    layers.maneuverMarkers.forEach(m => map.removeLayer(m));
    layers.maneuverMarkers = [];

    const latLngs = route.coordinates.map(c => [c[1], c[0]]);

    // 1. Primary Active Matched Route (Red #FF0000)
    const matchedCoords = matchedTrace && matchedTrace.length > 0 ? matchedTrace : route.coordinates;
    const matchedLatLngs = matchedCoords.map(c => [c[1], c[0]]);
    layers.matchedLine = L.polyline(matchedLatLngs, {
      color: '#FF0000',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // 2. Progressive Noisy NavIC Satellite Trace (Neon Orange #FF5F1F)
    if (noisyTrace && noisyTrace.length > 0) {
      const noisyLatLngs = noisyTrace.map(item => [item.coord[1], item.coord[0]]);
      layers.noisyLine = L.polyline(noisyLatLngs, {
        color: '#FF5F1F',
        weight: 2,
        dashArray: '4, 6',
        opacity: 0.85
      }).addTo(map);

      // Add point markers for observed noisy positions
      noisyTrace.forEach((item, idx) => {
        if (idx % 2 === 0) {
          const pt = L.circleMarker([item.coord[1], item.coord[0]], {
            radius: 2.5,
            fillColor: '#FF5F1F',
            color: '#FFFFFF',
            weight: 0.8,
            fillOpacity: 0.85
          }).addTo(map);
          layers.noisyPoints.push(pt);
        }
      });
    }

    // 3. Start & Destination Markers (White with Red / Neon Orange borders)
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

    layers.startMarker = L.marker(latLngs[0], { icon: startIcon }).addTo(map);
    layers.endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map);

    // 4. Maneuver Markers (Neon Orange #FF5F1F)
    if (route.maneuvers) {
      route.maneuvers.forEach((m, idx) => {
        if (m.turnType !== 'destination') {
          const mIcon = L.divIcon({
            className: 'turn-icon-marker',
            html: `<div style="background:#000000; border:1px solid #FF5F1F; color:#FF5F1F; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; font-family:Orbitron;">${idx + 1}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          const marker = L.marker([m.coord[1], m.coord[0]], { icon: mIcon }).addTo(map);
          layers.maneuverMarkers.push(marker);
        }
      });
    }

    map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });

  }, [route, noisyTrace, matchedTrace]);

  // Update Animated Vehicle Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentCoord) return;

    const layers = layersRef.current;
    const latLng = [currentCoord[1], currentCoord[0]];

    const carHtml = `
      <div style="transform: rotate(${currentBearing}deg); transition: transform 0.2s linear; width: 36px; height: 36px; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
          <circle cx="20" cy="20" r="18" fill="rgba(255, 0, 0, 0.25)" stroke="#FF0000" stroke-width="1.5" />
          <polygon points="20,4 32,32 20,24 8,32" fill="#FF0000" stroke="#FFFFFF" stroke-width="1.5" />
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
  }, [currentCoord, currentBearing]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px', borderRadius: '8px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Map Legend Overlay in Red, Neon Orange, White, Black palette */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 500,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--parth-border)',
        borderRadius: '6px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#FF0000', borderRadius: '2px' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#FFFFFF' }}>Active Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#FF5F1F', borderTop: '2px dashed #FF5F1F' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#FFFFFF' }}>NavIC Satellite Trace</span>
        </div>
      </div>
    </div>
  );
}
