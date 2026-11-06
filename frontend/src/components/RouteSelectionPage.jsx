import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { ArrowRight, MapPin, AlertCircle, Loader2, Navigation, Compass, RefreshCw } from 'lucide-react';
import { haversineDistance } from '../utils/geoUtils';

// Verified default presets within the Karnataka / Bengaluru regional road graph
export const PRESET_LOCATIONS = {
  Kengeri: { name: 'Kengeri', lon: 77.471314, lat: 12.905128 },
  Kanakapura: { name: 'Kanakapura', lon: 77.526668, lat: 12.856989 },
  Somapura: { name: 'Somapura', lon: 77.501338, lat: 12.884321 },
};

export default function RouteSelectionPage({
  onLaunchSimulation,
  isLoading = false,
  apiError = null,
  onClearError
}) {
  // Start & End Pin Coordinates
  const [startPoint, setStartPoint] = useState({
    lon: PRESET_LOCATIONS.Kengeri.lon,
    lat: PRESET_LOCATIONS.Kengeri.lat,
    name: 'Kengeri (Start)'
  });

  const [endPoint, setEndPoint] = useState({
    lon: PRESET_LOCATIONS.Kanakapura.lon,
    lat: PRESET_LOCATIONS.Kanakapura.lat,
    name: 'Kanakapura (Destination)'
  });

  // Active Pin placement mode: 'start' or 'end'
  const [activePlacementMode, setActivePlacementMode] = useState('start');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const guideLineRef = useRef(null);

  // Calculate live direct displacement
  const directDistanceKm = (
    haversineDistance(
      [startPoint.lon, startPoint.lat],
      [endPoint.lon, endPoint.lat]
    ) / 1000
  ).toFixed(2);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([12.885, 77.495], 12);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager / Dark Navigation Tiles
      L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_52r0_1_4bf1cedc85b862faa6786a20', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Markers, Drag Handlers, and Guide Line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Custom Start Pin Icon
    const startIcon = L.divIcon({
      className: 'route-start-pin',
      html: `
        <div style="
          background: #080A0E;
          border: 2px solid #00E5FF;
          color: #00E5FF;
          font-family: Orbitron, sans-serif;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          cursor: grab;
        ">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#00E5FF;"></span>
          START (A)
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });

    // Custom Destination Pin Icon
    const endIcon = L.divIcon({
      className: 'route-end-pin',
      html: `
        <div style="
          background: #080A0E;
          border: 2px solid #FF0000;
          color: #FF5F1F;
          font-family: Orbitron, sans-serif;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 0 16px rgba(255, 0, 0, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          cursor: grab;
        ">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#FF0000;"></span>
          DEST (B)
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });

    // Create or Update Start Marker
    if (!startMarkerRef.current) {
      const marker = L.marker([startPoint.lat, startPoint.lon], {
        icon: startIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setStartPoint({
          lat: Number(lat.toFixed(6)),
          lon: Number(lng.toFixed(6)),
          name: `Pin [${lng.toFixed(4)}, ${lat.toFixed(4)}]`
        });
        onClearError?.();
      });

      startMarkerRef.current = marker;
    } else {
      startMarkerRef.current.setLatLng([startPoint.lat, startPoint.lon]);
    }

    // Create or Update End Marker
    if (!endMarkerRef.current) {
      const marker = L.marker([endPoint.lat, endPoint.lon], {
        icon: endIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setEndPoint({
          lat: Number(lat.toFixed(6)),
          lon: Number(lng.toFixed(6)),
          name: `Pin [${lng.toFixed(4)}, ${lat.toFixed(4)}]`
        });
        onClearError?.();
      });

      endMarkerRef.current = marker;
    } else {
      endMarkerRef.current.setLatLng([endPoint.lat, endPoint.lon]);
    }

    // Update Dashed Straight Guide Line between the two pins
    if (guideLineRef.current) {
      map.removeLayer(guideLineRef.current);
    }

    guideLineRef.current = L.polyline(
      [
        [startPoint.lat, startPoint.lon],
        [endPoint.lat, endPoint.lon]
      ],
      {
        color: '#00E5FF',
        weight: 2,
        dashArray: '5, 8',
        opacity: 0.65
      }
    ).addTo(map);

  }, [startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon]);

  // Click on Map to Drop/Move Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lon = Number(e.latlng.lng.toFixed(6));
      onClearError?.();

      if (activePlacementMode === 'start') {
        setStartPoint({
          lat,
          lon,
          name: `Dropped [${lon.toFixed(4)}, ${lat.toFixed(4)}]`
        });
        // Auto-switch to destination placement after setting start pin
        setActivePlacementMode('end');
      } else {
        setEndPoint({
          lat,
          lon,
          name: `Dropped [${lon.toFixed(4)}, ${lat.toFixed(4)}]`
        });
        // Auto-switch back to start pin for subsequent changes
        setActivePlacementMode('start');
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [activePlacementMode]);

  // Quick Preset Snap Handler
  const handleApplyPreset = (presetKey, target) => {
    const preset = PRESET_LOCATIONS[presetKey];
    if (!preset) return;
    onClearError?.();

    if (target === 'start') {
      setStartPoint({ lat: preset.lat, lon: preset.lon, name: `${preset.name} (Start)` });
    } else if (target === 'end') {
      setEndPoint({ lat: preset.lat, lon: preset.lon, name: `${preset.name} (Dest)` });
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([preset.lat, preset.lon]);
    }
  };

  // Swap Start & Destination Pins
  const handleSwapPins = () => {
    const temp = { ...startPoint };
    setStartPoint({ ...endPoint });
    setEndPoint(temp);
    onClearError?.();
  };

  // Dispatch Simulation Launch
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    onLaunchSimulation({
      start_lon: startPoint.lon,
      start_lat: startPoint.lat,
      end_lon: endPoint.lon,
      end_lat: endPoint.lat,
      start_name: startPoint.name,
      end_name: endPoint.name
    });
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px 24px 40px 24px',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <span className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-red)', letterSpacing: '1px' }}>
            LOCAL OSM + OSRM ROAD NETWORK
          </span>
          <h2 className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px', letterSpacing: '0.5px' }}>
            SELECT DEPARTURE & DESTINATION
          </h2>
        </div>

        {/* Action Button on Header / Toolbar */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="f1-btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: '13px',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>ROUTING VIA LOCAL OSRM...</span>
            </>
          ) : (
            <>
              <span>PROCEED TO NAVIGATION</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Actionable Error Banner if OSRM is unreachable or route fails */}
      {apiError && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.15)',
          border: '1px solid var(--parth-red)',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="var(--parth-red)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div className="font-orbitron" style={{ fontSize: '12px', fontWeight: 900, color: 'var(--parth-red)' }}>
              {apiError.error || 'NAVIGATION SERVICE ERROR'}
            </div>
            <div className="font-rajdhani" style={{ fontSize: '14px', color: '#FFF', marginTop: '2px', lineHeight: 1.4 }}>
              {apiError.message || 'Failed to communicate with local navigation backend.'}
            </div>
          </div>
        </div>
      )}

      {/* Boxed Map Element with Floating HUD Overlay */}
      <div style={{
        position: 'relative',
        height: '620px',
        width: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--parth-border)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Leaflet Map Target */}
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

        {/* Floating Box Overlay for Pin Placement Controls & Feedback */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          width: '380px',
          maxWidth: 'calc(100% - 32px)',
          background: 'rgba(10, 12, 16, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '16px 18px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)'
        }}>
          {/* Overlay Box Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Compass size={16} color="var(--parth-neon-orange)" />
            <span className="font-orbitron" style={{ fontSize: '12px', fontWeight: 900, color: '#FFF', letterSpacing: '0.5px' }}>
              PLACE PINS ON STARTING & ENDING POINTS
            </span>
          </div>

          <p className="font-rajdhani" style={{ fontSize: '12px', color: '#9AA4B2', margin: '0 0 14px 0', lineHeight: 1.3 }}>
            Click anywhere on the map or drag the pins to set exact GPS departure and arrival coordinates.
          </p>

          {/* Pin Mode Selector & Coordinate Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {/* Start Pin Selector */}
            <div
              onClick={() => setActivePlacementMode('start')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '6px',
                background: activePlacementMode === 'start' ? 'rgba(0, 229, 255, 0.12)' : '#12151B',
                border: activePlacementMode === 'start' ? '1px solid #00E5FF' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#00E5FF',
                  boxShadow: '0 0 8px #00E5FF'
                }}></span>
                <div>
                  <div className="font-orbitron" style={{ fontSize: '11px', fontWeight: 800, color: '#00E5FF' }}>
                    STARTING PIN (A)
                  </div>
                  <div className="font-rajdhani" style={{ fontSize: '12px', color: '#CAD2DF' }}>
                    {startPoint.name}
                  </div>
                </div>
              </div>

              <div className="font-orbitron" style={{ fontSize: '10px', color: '#8E95A5', textAlign: 'right' }}>
                [{startPoint.lon.toFixed(4)}, {startPoint.lat.toFixed(4)}]
              </div>
            </div>

            {/* Destination Pin Selector */}
            <div
              onClick={() => setActivePlacementMode('end')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '6px',
                background: activePlacementMode === 'end' ? 'rgba(255, 95, 31, 0.12)' : '#12151B',
                border: activePlacementMode === 'end' ? '1px solid #FF5F1F' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#FF0000',
                  boxShadow: '0 0 8px #FF0000'
                }}></span>
                <div>
                  <div className="font-orbitron" style={{ fontSize: '11px', fontWeight: 800, color: '#FF5F1F' }}>
                    ENDING PIN (B)
                  </div>
                  <div className="font-rajdhani" style={{ fontSize: '12px', color: '#CAD2DF' }}>
                    {endPoint.name}
                  </div>
                </div>
              </div>

              <div className="font-orbitron" style={{ fontSize: '10px', color: '#8E95A5', textAlign: 'right' }}>
                [{endPoint.lon.toFixed(4)}, {endPoint.lat.toFixed(4)}]
              </div>
            </div>
          </div>

          {/* Quick Hub Presets & Swap Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="font-orbitron" style={{ fontSize: '10px', color: '#8E95A5' }}>PRESETS:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Kengeri', activePlacementMode)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFF',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'Rajdhani'
                }}
              >
                Kengeri
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Kanakapura', activePlacementMode)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFF',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'Rajdhani'
                }}
              >
                Kanakapura
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Somapura', activePlacementMode)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFF',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'Rajdhani'
                }}
              >
                Somapura
              </button>
            </div>

            <button
              type="button"
              onClick={handleSwapPins}
              title="Swap Start and Destination"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFF',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontFamily: 'Orbitron'
              }}
            >
              <RefreshCw size={11} />
              <span>SWAP</span>
            </button>
          </div>

          {/* Active Mode Guide Tip */}
          <div style={{
            marginTop: '10px',
            padding: '6px 10px',
            borderRadius: '4px',
            background: activePlacementMode === 'start' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 95, 31, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span className="font-rajdhani" style={{ fontSize: '11px', color: activePlacementMode === 'start' ? '#00E5FF' : '#FF5F1F' }}>
              📍 Click map to drop: <strong>{activePlacementMode === 'start' ? 'START PIN (A)' : 'DESTINATION PIN (B)'}</strong>
            </span>
            <span className="font-orbitron" style={{ fontSize: '10px', color: '#CAD2DF' }}>
              ~{directDistanceKm} km
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
