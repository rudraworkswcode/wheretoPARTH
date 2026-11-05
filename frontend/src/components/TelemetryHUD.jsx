import React from 'react';
import { Gauge, Compass, Radio, Activity, Target, Zap, Clock } from 'lucide-react';

export default function TelemetryHUD({
  speedKmh = 48,
  bearing = 0,
  currentCoord = [77.50, 12.88],
  errorMetrics = { rawErrorMeters: 28.4, correctedErrorMeters: 1.1, reductionPercent: 96.1 },
  progressPercent = 0,
  distanceCoveredKm = 0,
  distanceRemainingKm = 0,
  etaMinutes = 0,
  matchStatus = "OSRM Map Matched",
  confidence = 0.94
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
      {/* 1. Speedometer & Velocity Gauge */}
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
        {/* F1 Tachometer Bars */}
        <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
          {[...Array(12)].map((_, i) => {
            const active = i < Math.min(12, Math.round((speedKmh / 90) * 12));
            const color = i < 7 ? 'var(--parth-green)' : i < 10 ? 'var(--parth-yellow)' : 'var(--parth-red)';
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
          Vector Track: {bearing < 180 ? 'Inbound Southeast' : 'Outbound Northwest'}
        </div>
      </div>

      {/* 3. Positioning Error & Accuracy Metric */}
      <div className="racing-card" style={{ padding: '14px 18px', borderColor: 'rgba(0, 240, 255, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px', fontWeight: 700 }}>
            POSITIONING ACCURACY
          </span>
          <Target size={14} color="var(--parth-cyan)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--parth-cyan)' }}>
            ±{errorMetrics.correctedErrorMeters}m
          </span>
          <span className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5' }}>
            (Raw: ±{errorMetrics.rawErrorMeters}m)
          </span>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '11px', color: 'var(--parth-green)', marginTop: '6px', fontWeight: 600 }}>
          ⚡ {errorMetrics.reductionPercent}% Error Reduction via Snapping
        </div>
      </div>

      {/* 4. Journey Progress & ETA */}
      <div className="racing-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px', fontWeight: 700 }}>
            JOURNEY PROGRESS
          </span>
          <Clock size={14} color="var(--parth-green)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#FFF' }}>
            {progressPercent}%
          </span>
          <span className="font-rajdhani" style={{ fontSize: '13px', color: '#FFF', fontWeight: 600 }}>
            Rem: {distanceRemainingKm} km
          </span>
        </div>
        {/* Progress Bar */}
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

