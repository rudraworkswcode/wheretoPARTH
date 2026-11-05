import React, { useState } from 'react';
import { ROUTE_LIST, LOCATIONS, DEFAULT_ROUTE_ID } from '../data/routesData';
import { ArrowRight } from 'lucide-react';

export default function RouteSelectionPage({
  selectedRouteId,
  setSelectedRouteId,
  onLaunchSimulation
}) {
  const currentRoute = ROUTE_LIST.find(r => r.id === selectedRouteId) || ROUTE_LIST[0];
  const [startPoint, setStartPoint] = useState(currentRoute.from || LOCATIONS[0]);
  const [destination, setDestination] = useState(
    currentRoute.to || (LOCATIONS[1] !== currentRoute.from ? LOCATIONS[1] : LOCATIONS[2])
  );

  const handleStartChange = (val) => {
    setStartPoint(val);
    let nextDest = destination;
    if (val === destination) {
      nextDest = LOCATIONS.find(loc => loc !== val) || val;
      setDestination(nextDest);
    }
    resolveAndSetRoute(val, nextDest);
  };

  const handleDestChange = (val) => {
    setDestination(val);
    resolveAndSetRoute(startPoint, val);
  };

  const resolveAndSetRoute = (start, dest) => {
    // Deterministic resolution: find route matching start and dest
    // If multiple exist (e.g. R-01 and R-05 for Kengeri -> Kanakapura), select the primary first match
    const matched = ROUTE_LIST.find(r => r.from === start && r.to === dest);
    if (matched) {
      setSelectedRouteId(matched.id);
    } else {
      // Fallback matching origin or default
      const partial = ROUTE_LIST.find(r => r.from === start) || ROUTE_LIST[0];
      setSelectedRouteId(partial.id);
    }
  };

  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '48px 24px',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{
        marginBottom: '36px',
        borderBottom: '1px solid var(--parth-border)',
        paddingBottom: '20px'
      }}>
        <span className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-red)', letterSpacing: '1px' }}>
          NAVIGATION SETUP
        </span>
        <h2 className="font-orbitron" style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px' }}>
          SELECT ROUTE
        </h2>
      </div>

      {/* Exactly Two Dropdowns: Starting Point and Destination */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="font-rajdhani" style={{ fontSize: '14px', fontWeight: 700, color: '#B0B7C6', letterSpacing: '0.5px' }}>
            STARTING POINT
          </label>
          <select
            value={startPoint}
            onChange={(e) => handleStartChange(e.target.value)}
            className="font-rajdhani"
            style={{
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
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="font-rajdhani" style={{ fontSize: '14px', fontWeight: 700, color: '#B0B7C6', letterSpacing: '0.5px' }}>
            DESTINATION
          </label>
          <select
            value={destination}
            onChange={(e) => handleDestChange(e.target.value)}
            className="font-rajdhani"
            style={{
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
            {LOCATIONS.filter(loc => loc !== startPoint).map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Dispatch Action */}
      <div>
        <button
          onClick={onLaunchSimulation}
          className="f1-btn-primary"
          style={{ width: '100%', fontSize: '15px', padding: '14px 28px' }}
        >
          <span>PROCEED TO COCKPIT</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
