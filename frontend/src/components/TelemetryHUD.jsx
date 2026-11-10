import React from 'react';

export default function TelemetryHUD({
  speedKmh = 40,
  bearing = 0,
  errorMetrics = { rawErrorMeters: 6.2, correctedErrorMeters: 0.8, reductionPercent: 87 },
  progressPercent = 0,
  distanceCoveredKm = 0,
  distanceRemainingKm = 0,
  etaMinutes = 0
}) {
  // Hard limit: Speedometer velocity never exceeds 120 km/h
  const cappedSpeed = Math.min(120, Math.max(0, Math.round(speedKmh)));

  const getCardinal = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '10px',
      marginBottom: '12px',
      width: '100%'
    }}>
      {/* 1. Speedometer (Hard Capped at 120 km/h) */}
      <div className="racing-card" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5', letterSpacing: '0.6px', fontWeight: 700 }}>
            SPEEDOMETER
          </span>
          <span className="font-orbitron" style={{ fontSize: '9px', color: 'var(--parth-red)', fontWeight: 700 }}>
            KM/H
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>
            {cappedSpeed}
          </span>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5' }}>
            max 120
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
          {[...Array(10)].map((_, i) => {
            const active = i < Math.min(10, Math.round((cappedSpeed / 120) * 10));
            const color = i < 7 ? 'var(--parth-neon-orange)' : 'var(--parth-red)';
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '1px',
                  background: active ? color : '#242833'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 2. Compass & Heading */}
      <div className="racing-card" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5', letterSpacing: '0.6px', fontWeight: 700 }}>
            BEARING
          </span>
          <span className="font-orbitron" style={{ fontSize: '10px', color: 'var(--parth-neon-orange)', fontWeight: 700 }}>
            {getCardinal(bearing)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>
            {Math.round(bearing)}°
          </span>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {bearing < 180 ? 'Inbound SE' : 'Outbound NW'}
        </div>
      </div>

      {/* 3. Positioning Accuracy Error */}
      <div className="racing-card" style={{ padding: '8px 12px', borderColor: 'rgba(255, 95, 31, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5', letterSpacing: '0.6px', fontWeight: 700 }}>
            ACCURACY
          </span>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: 'var(--parth-neon-orange)', fontWeight: 600 }}>
            {errorMetrics.reductionPercent}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>
            ±{errorMetrics.correctedErrorMeters}m
          </span>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5' }}>
            (±{errorMetrics.rawErrorMeters}m)
          </span>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '10px', color: 'var(--parth-neon-orange)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Road Snapped
        </div>
      </div>

      {/* 4. Journey Progress & Remaining */}
      <div className="racing-card" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#8E95A5', letterSpacing: '0.6px', fontWeight: 700 }}>
            PROGRESS
          </span>
          <span className="font-rajdhani" style={{ fontSize: '10px', color: '#FFF', fontWeight: 600 }}>
            {distanceRemainingKm} km rem
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>
            {progressPercent}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: '#242833',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--parth-neon-orange) 0%, var(--parth-red) 100%)',
            transition: 'width 0.2s ease'
          }} />
        </div>
      </div>
    </div>
  );
}
