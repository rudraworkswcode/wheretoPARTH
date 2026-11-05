import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LeafletMap({
  route,
  noisyTrace,
  matchedTrace,
  currentCoord,
  currentBearing = 0,
  layerVisibility,
  activeAlertManeuver
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    groundTruth: null,
    noisyLine: null,
    noisyPoints: [],
    matchedLine: null,
    vehicleMarker: null,
    startMarker: null,
    endMarker: null,
    maneuverMarkers: []
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([12.88, 77.50], 12);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Dark theme CartoDB basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance alive across rerenders
    };
  }, []);

  // Update Route and Traces
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !route || !route.coordinates) return;

    const layers = layersRef.current;

    // Clear previous vector layers
    if (layers.groundTruth) map.removeLayer(layers.groundTruth);
    if (layers.noisyLine) map.removeLayer(layers.noisyLine);
    if (layers.matchedLine) map.removeLayer(layers.matchedLine);
    if (layers.startMarker) map.removeLayer(layers.startMarker);
    if (layers.endMarker) map.removeLayer(layers.endMarker);
    layers.noisyPoints.forEach(p => map.removeLayer(p));
    layers.noisyPoints = [];
    layers.maneuverMarkers.forEach(m => map.removeLayer(m));
    layers.maneuverMarkers = [];

    // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
    const latLngs = route.coordinates.map(c => [c[1], c[0]]);

    // 1. Ground Truth Reference (Cyan)
    if (layerVisibility.groundTruth) {
      layers.groundTruth = L.polyline(latLngs, {
        color: '#00F0FF',
        weight: 3,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 2. Noisy NavIC Satellite Trace (Neon Orange Dotted)
    if (layerVisibility.noisyTrace && noisyTrace && noisyTrace.length > 0) {
      const noisyLatLngs = noisyTrace.map(item => [item.coord[1], item.coord[0]]);
      layers.noisyLine = L.polyline(noisyLatLngs, {
        color: '#FF5F1F',
        weight: 2,
        dashArray: '4, 6',
        opacity: 0.85
      }).addTo(map);

      // Add small circle markers for noisy satellite points
      noisyTrace.forEach((item, idx) => {
        if (idx % 2 === 0) {
          const pt = L.circleMarker([item.coord[1], item.coord[0]], {
            radius: 2.5,
            fillColor: '#FF5F1F',
            color: '#FFB088',
            weight: 1,
            fillOpacity: 0.8
          }).addTo(map);
          layers.noisyPoints.push(pt);
        }
      });
    }

    // 3. OSRM Matched Route (F1 Racing Red)
    if (layerVisibility.matchedTrace) {
      const matchedCoords = matchedTrace && matchedTrace.length > 0 ? matchedTrace : route.coordinates;
      const matchedLatLngs = matchedCoords.map(c => [c[1], c[0]]);
      layers.matchedLine = L.polyline(matchedLatLngs, {
        color: '#FF0000',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 4. Start & Finish Markers
    const startIcon = L.divIcon({
      className: 'custom-flag-marker',
      html: `<div style="background:#00FF66; color:#000; font-family:Orbitron; font-size:10px; font-weight:900; padding:3px 6px; border-radius:3px; border:1px solid #fff; box-shadow:0 0 10px #00FF66;">START</div>`,
      iconSize: [44, 20],
      iconAnchor: [22, 10]
    });

    const endIcon = L.divIcon({
      className: 'custom-flag-marker',
      html: `<div style="background:#FF0000; color:#fff; font-family:Orbitron; font-size:10px; font-weight:900; padding:3px 6px; border-radius:3px; border:1px solid #fff; box-shadow:0 0 10px #FF0000;">FINISH</div>`,
      iconSize: [48, 20],
      iconAnchor: [24, 10]
    });

    layers.startMarker = L.marker(latLngs[0], { icon: startIcon }).addTo(map);
    layers.endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map);

    // 5. Maneuver Turn Markers
    if (route.maneuvers) {
      route.maneuvers.forEach((m, idx) => {
        if (m.turnType !== 'destination') {
          const mIcon = L.divIcon({
            className: 'turn-icon-marker',
            html: `<div style="background:rgba(22,25,32,0.9); border:1px solid var(--parth-neon-orange); color:var(--parth-neon-orange); width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">${idx + 1}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          const marker = L.marker([m.coord[1], m.coord[0]], { icon: mIcon }).addTo(map);
          layers.maneuverMarkers.push(marker);
        }
      });
    }

    // Fit Bounds
    map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });

  }, [route, noisyTrace, matchedTrace, layerVisibility]);

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
          <circle cx="20" cy="18" r="3" fill="#FFD700" />
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

      {/* Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 500,
        background: 'rgba(10, 12, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--parth-border)',
        borderRadius: '6px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#00F0FF', borderRadius: '2px' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>Ground Truth Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#FF5F1F', borderTop: '2px dashed #FF5F1F' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>Simulated NavIC Noise</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '4px', background: '#FF0000', borderRadius: '2px' }} />
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>OSRM Matched Trace</span>
        </div>
      </div>
    </div>
  );
}

