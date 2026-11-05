import React, { useState } from 'react';
import { ROUTE_LIST, LOCATIONS } from '../data/routesData';
import { MapPin, Navigation, Sliders, CheckCircle2, AlertTriangle, ArrowRight, Activity, Server } from 'lucide-react';

export default function RouteSelectionPage({
  selectedRouteId,
  setSelectedRouteId,
  noiseConfig,
  setNoiseConfig,
  onLaunchSimulation,
  useBackendApi,
  setUseBackendApi,
  backendStatus
}) {
  const [startFilter, setStartFilter] = useState('ALL');
  const [destFilter, setDestFilter] = useState('ALL');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  const filteredRoutes = ROUTE_LIST.filter(r => {
    if (startFilter !== 'ALL' && r.from !== startFilter) return false;
    if (destFilter !== 'ALL' && r.to !== destFilter) return false;
    return true;
  });

  const activeRoute = ROUTE_LIST.find(r => r.id === selectedRouteId) || ROUTE_LIST[0];

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '36px 20px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--parth-border)',
        paddingBottom: '20px',
        marginBottom: '28px'
      }}>
        <div>
          <span className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-red)', letterSpacing: '1px' }}>
            PHASE 03 // LOCATION & ROUTE DISPATCH
          </span>
          <h2 className="font-orbitron" style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
            SELECT NAVIGATION SECTOR
          </h2>
        </div>

        {/* Backend & Noise Config Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="f1-btn-outline"
            style={{ borderColor: showConfigDrawer ? 'var(--parth-neon-orange)' : 'var(--parth-border)' }}
          >
            <Sliders size={14} color="var(--parth-neon-orange)" />
            <span>NOISE PARAMETERS</span>
          </button>

          <button
            onClick={() => setUseBackendApi(!useBackendApi)}
            className="f1-btn-outline"
            style={{
              borderColor: useBackendApi ? 'var(--parth-green)' : 'var(--parth-border)',
              color: useBackendApi ? 'var(--parth-green)' : '#8E95A5'
            }}
          >
            <Server size={14} />
            <span>API: {useBackendApi ? 'LOCAL FASTAPI' : 'STANDALONE'}</span>
          </button>
        </div>
      </div>

      {/* Noise Configuration Accordion / Drawer */}
      {showConfigDrawer && (
        <div className="racing-card" style={{
          marginBottom: '28px',
          borderColor: 'var(--parth-neon-orange)',
          background: 'rgba(22, 25, 32, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--parth-neon-orange)" />
              <h4 className="font-orbitron" style={{ fontSize: '14px', fontWeight: 700 }}>
                NavIC Satellite Noise Parameters (noise_config.json)
              </h4>
            </div>
            <span className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5' }}>
              Simulates atmospheric ionospheric delay & multipath reflections
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label className="font-rajdhani" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Lat/Lon Jitter Variance: <strong style={{ color: 'var(--parth-neon-orange)' }}>{noiseConfig.latitude_variance}</strong>
              </label>
              <input
                type="range"
                min="0.00001"
                max="0.0002"
                step="0.00001"
                value={noiseConfig.latitude_variance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setNoiseConfig(prev => ({ ...prev, latitude_variance: val, longitude_variance: val }));
                }}
                style={{ width: '100%', accentColor: 'var(--parth-neon-orange)' }}
              />
            </div>

            <div>
              <label className="font-rajdhani" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Atmospheric Drift Bias: <strong style={{ color: 'var(--parth-red)' }}>{noiseConfig.drift_bias_lat}</strong>
              </label>
              <input
                type="range"
                min="0.000001"
                max="0.00005"
                step="0.000005"
                value={noiseConfig.drift_bias_lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setNoiseConfig(prev => ({ ...prev, drift_bias_lat: val, drift_bias_lon: -val }));
                }}
                style={{ width: '100%', accentColor: 'var(--parth-red)' }}
              />
            </div>

            <div>
              <label className="font-rajdhani" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Signal Dropout Rate: <strong style={{ color: 'var(--parth-yellow)' }}>{(noiseConfig.dropout_percentage * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.0"
                max="0.15"
                step="0.01"
                value={noiseConfig.dropout_percentage}
                onChange={(e) => setNoiseConfig(prev => ({ ...prev, dropout_percentage: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--parth-yellow)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Selector Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        background: 'rgba(22, 25, 32, 0.6)',
        padding: '16px 20px',
        borderRadius: '6px',
        border: '1px solid var(--parth-border)'
      }}>
        {/* Origin Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '14px', fontWeight: 600, color: '#B0B7C6' }}>
            START POINT:
          </span>
          <select
            value={startFilter}
            onChange={(e) => setStartFilter(e.target.value)}
            className="font-rajdhani"
            style={{
              background: '#0D0F14',
              color: '#FFF',
              border: '1px solid var(--parth-border)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Origins</option>
            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        {/* Destination Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '14px', fontWeight: 600, color: '#B0B7C6' }}>
            DESTINATION:
          </span>
          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className="font-rajdhani"
            style={{
              background: '#0D0F14',
              color: '#FFF',
              border: '1px solid var(--parth-border)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Destinations</option>
            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        {(startFilter !== 'ALL' || destFilter !== 'ALL') && (
          <button
            onClick={() => { setStartFilter('ALL'); setDestFilter('ALL'); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--parth-neon-orange)',
              fontSize: '12px',
              fontFamily: 'Rajdhani',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Route Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '20px',
        marginBottom: '36px'
      }}>
        {filteredRoutes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`racing-card ${isSelected ? 'racing-card-active' : ''}`}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Route Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-orbitron" style={{
                      fontSize: '14px',
                      fontWeight: 900,
                      color: isSelected ? 'var(--parth-red)' : '#FFF'
                    }}>
                      {route.id}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'Orbitron',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      background: isSelected ? 'var(--parth-red)' : 'rgba(255,255,255,0.1)',
                      color: '#FFF'
                    }}>
                      {route.pref.split(' ')[0]}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 size={18} color="var(--parth-red)" />
                  )}
                </div>

                {/* Origin to Destination Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                  padding: '10px 12px',
                  background: 'rgba(8, 9, 12, 0.6)',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--parth-green)" />
                    <span className="font-rajdhani" style={{ fontSize: '15px', fontWeight: 700 }}>
                      {route.from}
                    </span>
                  </div>
                  <span style={{ color: 'var(--parth-neon-orange)', fontWeight: 'bold' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--parth-red)" />
                    <span className="font-rajdhani" style={{ fontSize: '15px', fontWeight: 700 }}>
                      {route.to}
                    </span>
                  </div>
                </div>

                <div className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5', marginBottom: '14px' }}>
                  {route.pref}
                </div>
              </div>

              {/* Stats Footer */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid var(--parth-border)',
                paddingTop: '12px',
                textAlign: 'center'
              }}>
                <div>
                  <div className="font-orbitron" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {route.totalDistanceKm} km
                  </div>
                  <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5' }}>
                    Distance
                  </div>
                </div>
                <div>
                  <div className="font-orbitron" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {route.totalDurationMin} min
                  </div>
                  <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5' }}>
                    Est. Time
                  </div>
                </div>
                <div>
                  <div className="font-orbitron" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {route.maneuvers.length}
                  </div>
                  <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5' }}>
                    Turns/Alerts
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Launch Action Footer */}
      <div style={{
        background: 'rgba(22, 25, 32, 0.9)',
        border: '1px solid var(--parth-border)',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div className="font-rajdhani" style={{ fontSize: '13px', color: '#8E95A5' }}>
            ACTIVE DISPATCH CONFIGURATION
          </div>
          <div className="font-orbitron" style={{ fontSize: '16px', fontWeight: 700 }}>
            {activeRoute.id}: {activeRoute.from} to {activeRoute.to} ({activeRoute.totalDistanceKm} km)
          </div>
        </div>

        <button
          onClick={onLaunchSimulation}
          className="f1-btn-primary"
          style={{ fontSize: '14px', padding: '12px 28px' }}
        >
          <span>ENGAGE COCKPIT NAVIGATION</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

