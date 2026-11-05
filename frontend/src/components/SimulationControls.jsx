import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Eye, Layers, StepForward } from 'lucide-react';

export default function SimulationControls({
  isPlaying,
  onTogglePlay,
  onReset,
  onStepForward,
  playbackSpeed,
  onChangeSpeed,
  layerVisibility,
  onToggleLayer,
  routes,
  selectedRouteId,
  onSelectRoute
}) {
  const speeds = [1, 2, 5, 10];

  return (
    <div className="racing-card" style={{
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      marginTop: '16px'
    }}>
      {/* Playback Transport Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onTogglePlay}
          className={isPlaying ? "f1-btn-orange" : "f1-btn-primary"}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          onClick={onStepForward}
          className="f1-btn-outline"
          title="Step one waypoint forward"
          style={{ padding: '8px 12px' }}
        >
          <StepForward size={16} />
        </button>

        <button
          onClick={onReset}
          className="f1-btn-outline"
          title="Restart from origin"
          style={{ padding: '8px 12px' }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Speed Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '8px',
          background: 'rgba(8,9,12,0.8)',
          padding: '3px',
          borderRadius: '4px',
          border: '1px solid var(--parth-border)'
        }}>
          {speeds.map(spd => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className="font-orbitron"
              style={{
                background: playbackSpeed === spd ? 'var(--parth-red)' : 'transparent',
                color: playbackSpeed === spd ? '#FFF' : '#8E95A5',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5', fontWeight: 600 }}>
          LAYERS:
        </span>

        <button
          onClick={() => onToggleLayer('groundTruth')}
          className="f1-btn-outline"
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            borderColor: layerVisibility.groundTruth ? '#00F0FF' : 'var(--parth-border)',
            color: layerVisibility.groundTruth ? '#00F0FF' : '#666'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F0FF' }} />
          Ground Truth
        </button>

        <button
          onClick={() => onToggleLayer('noisyTrace')}
          className="f1-btn-outline"
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            borderColor: layerVisibility.noisyTrace ? '#FF5F1F' : 'var(--parth-border)',
            color: layerVisibility.noisyTrace ? '#FF5F1F' : '#666'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5F1F' }} />
          NavIC Noise
        </button>

        <button
          onClick={() => onToggleLayer('matchedTrace')}
          className="f1-btn-outline"
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            borderColor: layerVisibility.matchedTrace ? '#FF0000' : 'var(--parth-border)',
            color: layerVisibility.matchedTrace ? '#FF0000' : '#666'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF0000' }} />
          Map Matched
        </button>
      </div>

      {/* Quick Route Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5', fontWeight: 600 }}>
          SWITCH ROUTE:
        </span>
        <select
          value={selectedRouteId}
          onChange={(e) => onSelectRoute(e.target.value)}
          className="font-rajdhani"
          style={{
            background: '#0D0F14',
            color: '#FFF',
            border: '1px solid var(--parth-border)',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {routes.map(r => (
            <option key={r.id} value={r.id}>
              {r.id}: {r.from} → {r.to}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

