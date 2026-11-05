import React from 'react';
import { Navigation, Radio, Flag, Compass, MapPin } from 'lucide-react';

export default function Header({ currentPage, setCurrentPage, selectedRoute }) {
  const navItems = [
    { id: 'welcome', label: 'Paddock' },
    { id: 'brief', label: 'Mission Brief' },
    { id: 'routes', label: 'Route Select' },
    { id: 'cockpit', label: 'Navigation Cockpit' },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--parth-border)',
      background: 'rgba(8, 9, 12, 0.95)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Brand */}
      <div 
        onClick={() => setCurrentPage('welcome')}
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
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
            <span style={{
              fontSize: '10px',
              fontFamily: 'Orbitron',
              padding: '1px 6px',
              background: 'rgba(255, 95, 31, 0.2)',
              color: 'var(--parth-neon-orange)',
              border: '1px solid var(--parth-neon-orange)',
              borderRadius: '2px',
              letterSpacing: '1px'
            }}>
              NavIC L5/S
            </span>
          </div>
          <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5', letterSpacing: '0.8px' }}>
            LANE-LEVEL SATELLITE NAVIGATION SYSTEM
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {navItems.map((item, idx) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="font-orbitron"
              style={{
                background: isActive ? 'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(255,95,31,0.2) 100%)' : 'transparent',
                border: isActive ? '1px solid var(--parth-red)' : '1px solid transparent',
                color: isActive ? '#fff' : '#8E95A5',
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ color: isActive ? 'var(--parth-red)' : '#555', fontSize: '10px' }}>0{idx + 1}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* NavIC Live Telemetry Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '6px 14px',
        background: 'rgba(22, 25, 32, 0.7)',
        borderRadius: '6px',
        border: '1px solid var(--parth-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={14} color="var(--parth-green)" style={{ animation: 'pulse 1.5s infinite' }} />
          <div>
            <div className="font-orbitron" style={{ fontSize: '9px', color: 'var(--parth-green)', letterSpacing: '0.5px' }}>
              NAVIC LOCK: OK
            </div>
            <div className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>
              8 Sats | HDOP 1.08
            </div>
          </div>
        </div>

        {selectedRoute && (
          <div style={{ borderLeft: '1px solid var(--parth-border)', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={13} color="var(--parth-neon-orange)" />
            <div className="font-rajdhani" style={{ fontSize: '12px', fontWeight: 600 }}>
              <span style={{ color: 'var(--parth-neon-orange)' }}>{selectedRoute.id}</span>: {selectedRoute.from} → {selectedRoute.to}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

