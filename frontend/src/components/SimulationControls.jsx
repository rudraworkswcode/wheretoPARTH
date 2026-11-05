import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function SimulationControls({
  hasStarted,
  isPaused,
  onStartNavigation,
  onTogglePause,
  onReset
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {!hasStarted ? (
        <button
          onClick={onStartNavigation}
          className="f1-btn-primary"
          style={{ padding: '8px 18px', fontSize: '12px' }}
        >
          <Play size={14} />
          <span>START NAVIGATION</span>
        </button>
      ) : (
        <>
          {/* Pause / Resume Navigation Control (Can stop/resume) */}
          <button
            onClick={onTogglePause}
            className={isPaused ? "f1-btn-orange" : "f1-btn-primary"}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              background: isPaused ? 'var(--parth-neon-orange)' : 'var(--parth-red)'
            }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{isPaused ? 'RESUME' : 'STOP / PAUSE'}</span>
          </button>

          {/* Reset / Stop Button */}
          <button
            onClick={onReset}
            className="f1-btn-outline"
            style={{ padding: '8px 14px', fontSize: '12px' }}
            title="Reset Navigation"
          >
            <RotateCcw size={13} />
            <span>RESET</span>
          </button>
        </>
      )}
    </div>
  );
}
