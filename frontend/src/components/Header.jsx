import React from 'react';
import { Navigation, Compass, FileText, Map, Activity } from 'lucide-react';

export default function Header({ currentPage = 'welcome', onNavigate, onNavigateHome }) {
  const handleNav = (page) => {
    if (onNavigate) {
      onNavigate(page);
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

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
      gap: '12px'
    }}>
      {/* Brand Logo & Title */}
      <div
        onClick={() => handleNav('welcome')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleNav('welcome');
          }
        }}
        title="Return to Intro Animation"
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

      {/* Navigation Links for Quick Access */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => handleNav('welcome')}
          className="f1-tab-btn"
          style={{
            background: currentPage === 'welcome' ? 'rgba(255, 0, 0, 0.15)' : 'transparent',
            border: `1px solid ${currentPage === 'welcome' ? 'var(--parth-red)' : 'transparent'}`,
            color: currentPage === 'welcome' ? 'var(--parth-red)' : '#8E95A5',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Compass size={14} />
          <span>INTRO ANIMATION</span>
        </button>

        <button
          onClick={() => handleNav('brief')}
          className="f1-tab-btn"
          style={{
            background: currentPage === 'brief' ? 'rgba(255, 95, 31, 0.15)' : 'transparent',
            border: `1px solid ${currentPage === 'brief' ? 'var(--parth-neon-orange)' : 'transparent'}`,
            color: currentPage === 'brief' ? 'var(--parth-neon-orange)' : '#8E95A5',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <FileText size={14} />
          <span>MISSION BRIEF</span>
        </button>

        <button
          onClick={() => handleNav('routes')}
          className="f1-tab-btn"
          style={{
            background: currentPage === 'routes' ? 'rgba(255, 0, 0, 0.15)' : 'transparent',
            border: `1px solid ${currentPage === 'routes' ? 'var(--parth-red)' : 'transparent'}`,
            color: currentPage === 'routes' ? 'var(--parth-white)' : '#8E95A5',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Map size={14} />
          <span>ROUTE SELECTOR</span>
        </button>
      </nav>
    </header>
  );
}
