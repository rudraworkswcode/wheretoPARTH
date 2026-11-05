import React from 'react';
import { Navigation } from 'lucide-react';

export default function Header({ onNavigateHome }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--parth-border)',
      background: 'rgba(8, 9, 12, 0.95)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      {/* Functional Navigation Link to Opening Brief */}
      <div
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigateHome?.();
          }
        }}
        title="Return to Homepage Brief"
        className="header-brand-link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, var(--parth-red) 0%, var(--parth-neon-orange) 100%)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--parth-red-glow)'
        }}>
          <Navigation size={22} color="#fff" style={{ transform: 'rotate(45deg)' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="font-orbitron" style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1.5px', color: '#fff' }}>
              WHERE TO <span style={{ color: 'var(--parth-red)' }}>PARTH</span>
            </span>
          </div>
          <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px' }}>
            LANE-LEVEL SATELLITE NAVIGATION SYSTEM
          </div>
        </div>
      </div>
    </header>
  );
}
