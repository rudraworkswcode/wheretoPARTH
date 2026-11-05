import React from 'react';
import { Play, RotateCcw } from 'lucide-react';

export default function SimulationControls({
  hasStarted,
  onStartNavigation,
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
          <button
            onClick={onReset}
            className="f1-btn-outline"
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            <RotateCcw size={15} />
            <span>RESTART NAVIGATION</span>
          </button>
        )}
      </div>

      <div className="font-rajdhani" style={{ fontSize: '13px', color: '#8E95A5' }}>
        Status: {hasStarted ? 'Active Navigation In Progress' : 'Ready — Awaiting Start Navigation Trigger'}
      </div>
    </div>
  );
}
