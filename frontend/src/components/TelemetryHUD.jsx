import React from 'react';
import { Gauge, Compass, Target, Clock } from 'lucide-react';

export default function TelemetryHUD({
  speedKmh = 40,
  bearing = 0,
  errorMetrics = { rawErrorMeters: 6.2, correctedErrorMeters: 0.8, reductionPercent: 87 },
  progressPercent = 0,
  distanceCoveredKm = 0,
  distanceRemainingKm = 0,
  etaMinutes = 0
}) {
  const getCardinal = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '14px',
      marginBottom: '16px'
    }}>
      {/* 1. Speedometer Derived From Coordinate Displacement */}
      <div className="racing-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px', fontWeight: 700 }}>
            SPEEDOMETER // VELOCITY
          </span>
          <Gauge size={14} color="var(--parth-red)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="font-orbitron" style={{ fontSize: '32px', fontWeight: 900, color: '#FFF' }}>
            {speedKmh}
          </span>
          <span className="font-orbitron" style={{ fontSize: '12px', color: 'var(--parth-red)', fontWeight: 700 }}>
            KM/H
          </span>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
          {[...Array(12)].map((_, i) => {
            const active = i < Math.min(12, Math.round((speedKmh / 90) * 12));
            const color = i < 8 ? 'var(--parth-neon-orange)' : 'var(--parth-red)';
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '1px',
                  background: active ? color : '#242833'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 2. Compass & Heading */}
      <div className="racing-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px', fontWeight: 700 }}>
            BEARING // HEADING
          </span>
          <Compass size={14} color="var(--parth-neon-orange)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="font-orbitron" style={{ fontSize: '32px', fontWeight: 900, color: '#FFF' }}>
            {Math.round(bearing)}°
          </span>
          <span className="font-orbitron" style={{ fontSize: '14px', color: 'var(--parth-neon-orange)', fontWeight: 700 }}>
            {getCardinal(bearing)}
          </span>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', marginTop: '6px' }}>
          Track: {bearing < 180 ? 'Inbound Southeast' : 'Outbound Northwest'}
        </div>
      </div>

      {/* 3. Positioning Accuracy Metric */}
      <div className="racing-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px', fontWeight: 700 }}>
            POSITIONING ACCURACY
          </span>
          <Target size={14} color="var(--parth-neon-orange)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
            ±{errorMetrics.correctedErrorMeters}m
          </span>
          <span className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5' }}>
            (Raw: ±{errorMetrics.rawErrorMeters}m)
          </span>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '11px', color: 'var(--parth-neon-orange)', marginTop: '6px', fontWeight: 600 }}>
          {errorMetrics.reductionPercent}% Error Reduction via Snapping
        </div>
      </div>

      {/* 4. Journey Progress & ETA */}
      <div className="racing-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px', fontWeight: 700 }}>
            JOURNEY PROGRESS
          </span>
          <Clock size={14} color="#FFFFFF" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#FFF' }}>
            {progressPercent}%
          </span>
          <span className="font-rajdhani" style={{ fontSize: '13px', color: '#FFF', fontWeight: 600 }}>
            Rem: {distanceRemainingKm} km
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: '#242833',
          borderRadius: '3px',
          overflow: 'hidden',
          marginTop: '8px'
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
