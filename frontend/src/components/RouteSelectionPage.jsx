import React, { useState } from 'react';
import { ArrowRight, MapPin, AlertCircle, Loader2 } from 'lucide-react';

// Explicit validated coordinate presets for regional locations
export const PRESET_LOCATIONS = {
  Kengeri: { name: 'Kengeri', lon: 77.471314, lat: 12.905128 },
  Kanakapura: { name: 'Kanakapura', lon: 77.526668, lat: 12.856989 },
  Somapura: { name: 'Somapura', lon: 77.501338, lat: 12.884321 },
};

export const LOCATION_KEYS = Object.keys(PRESET_LOCATIONS);

export default function RouteSelectionPage({
  onLaunchSimulation,
  isLoading = false,
  apiError = null,
  onClearError
}) {
  const [startKey, setStartKey] = useState('Kengeri');
  const [destKey, setDestKey] = useState('Kanakapura');

  const startLoc = PRESET_LOCATIONS[startKey];
  const destLoc = PRESET_LOCATIONS[destKey];

  const handleStartChange = (val) => {
    setStartKey(val);
    onClearError?.();
    if (val === destKey) {
      const next = LOCATION_KEYS.find(k => k !== val) || val;
      setDestKey(next);
    }
  };

  const handleDestChange = (val) => {
    setDestKey(val);
    onClearError?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    onLaunchSimulation({
      start_lon: startLoc.lon,
      start_lat: startLoc.lat,
      end_lon: destLoc.lon,
      end_lat: destLoc.lat,
      start_name: startLoc.name,
      end_name: destLoc.name
    });
  };

  return (
    <div style={{
      maxWidth: '740px',
      margin: '0 auto',
      padding: '48px 24px',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        borderBottom: '1px solid var(--parth-border)',
        paddingBottom: '20px'
      }}>
        <span className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-red)', letterSpacing: '1px' }}>
          LOCAL OSM + OSRM NAVIGATION PIPELINE
        </span>
        <h2 className="font-orbitron" style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px' }}>
          SELECT DEPARTURE & DESTINATION
        </h2>
        <p className="font-rajdhani" style={{ fontSize: '13px', color: '#8E95A5', marginTop: '6px' }}>
          Coordinates will query the local OSRM road graph to produce a reference driving route and simulated NavIC GNSS trace.
        </p>
      </div>

      {/* Actionable Error Banner if OSRM is unreachable or route fails */}
      {apiError && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.15)',
          border: '1px solid var(--parth-red)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="var(--parth-red)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div className="font-orbitron" style={{ fontSize: '12px', fontWeight: 900, color: 'var(--parth-red)' }}>
              {apiError.error || 'NAVIGATION SERVICE ERROR'}
            </div>
            <div className="font-rajdhani" style={{ fontSize: '14px', color: '#FFF', marginTop: '4px', lineHeight: 1.4 }}>
              {apiError.message || 'Failed to communicate with local navigation backend.'}
            </div>
          </div>
        </div>
      )}

      {/* Origin and Destination Selection Form */}
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '36px'
        }}>
          {/* Starting Point */}
          <div className="racing-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="font-rajdhani" style={{ fontSize: '13px', fontWeight: 700, color: '#B0B7C6', letterSpacing: '0.5px' }}>
                STARTING POINT
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--parth-green)" />
                <span className="font-orbitron" style={{ fontSize: '10px', color: '#8E95A5' }}>
                  [{startLoc.lon.toFixed(4)}, {startLoc.lat.toFixed(4)}]
                </span>
              </div>
            </div>
            <select
              value={startKey}
              onChange={(e) => handleStartChange(e.target.value)}
              className="font-rajdhani"
              style={{
                width: '100%',
                background: '#0D0F14',
                color: '#FFF',
                border: '1px solid var(--parth-border)',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {LOCATION_KEYS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="racing-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="font-rajdhani" style={{ fontSize: '13px', fontWeight: 700, color: '#B0B7C6', letterSpacing: '0.5px' }}>
                DESTINATION
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--parth-red)" />
                <span className="font-orbitron" style={{ fontSize: '10px', color: '#8E95A5' }}>
                  [{destLoc.lon.toFixed(4)}, {destLoc.lat.toFixed(4)}]
                </span>
              </div>
            </div>
            <select
              value={destKey}
              onChange={(e) => handleDestChange(e.target.value)}
              className="font-rajdhani"
              style={{
                width: '100%',
                background: '#0D0F14',
                color: '#FFF',
                border: '1px solid var(--parth-border)',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {LOCATION_KEYS.filter(loc => loc !== startKey).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Dispatch Action */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="f1-btn-primary"
            style={{
              width: '100%',
              fontSize: '15px',
              padding: '14px 28px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>QUERYING LOCAL OSRM GRAPH...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO NAVIGATION</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
