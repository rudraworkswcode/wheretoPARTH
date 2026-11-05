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
    <div className="racing-card" style={{
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!hasStarted ? (
          <button
            onClick={onStartNavigation}
            className="f1-btn-primary"
            style={{ padding: '12px 28px', fontSize: '14px' }}
          >
            <Play size={16} />
            <span>START NAVIGATION</span>
          </button>
        ) : (
          <>
            {/* Pause / Resume Navigation Control */}
            <button
              onClick={onTogglePause}
              className={isPaused ? "f1-btn-orange" : "f1-btn-outline"}
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                borderColor: isPaused ? 'var(--parth-neon-orange)' : 'var(--parth-border)'
              }}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
              <span>{isPaused ? 'Resume Navigation' : 'Pause Navigation'}</span>
            </button>

            {/* Restart Button */}
            <button
              onClick={onReset}
              className="f1-btn-outline"
              style={{ padding: '10px 18px', fontSize: '13px' }}
              title="Restart journey from start point"
            >
              <RotateCcw size={15} />
              <span>RESTART NAVIGATION</span>
            </button>
          </>
        )}
      </div>

      <div className="font-rajdhani" style={{ fontSize: '13px', color: '#8E95A5' }}>
        Status: {!hasStarted ? 'Ready — Awaiting Start Navigation Trigger' : isPaused ? 'Navigation Paused' : 'Active Navigation In Progress'}
      </div>
    </div>
  );
}
