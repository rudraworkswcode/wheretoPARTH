import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';

// Sleek Top-down / Isometric F1 Racing Car SVG
function F1CarSvg({ primaryColor = '#FF0000', accentColor = '#FFFFFF', glowColor = 'rgba(255,0,0,0.8)' }) {
  return (
    <svg viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`carGrad-${primaryColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#111" />
          <stop offset="50%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#FFF" />
        </linearGradient>
        <filter id={`carGlow-${primaryColor}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Speed Trails */}
      <path d="M 0 32 L 60 32" stroke={primaryColor} strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
      <path d="M -20 40 L 70 40" stroke={accentColor} strokeWidth="3" strokeDasharray="8 6" opacity="0.8" />
      <path d="M 0 48 L 60 48" stroke={primaryColor} strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

      {/* Rear Wing */}
      <rect x="50" y="16" width="10" height="48" rx="2" fill="#222" stroke={primaryColor} strokeWidth="1.5" />
      <rect x="44" y="24" width="8" height="32" rx="1" fill="#111" />

      {/* Rear Tires */}
      <rect x="70" y="8" width="28" height="18" rx="3" fill="#181818" stroke="#333" strokeWidth="1.5" />
      <rect x="70" y="54" width="28" height="18" rx="3" fill="#181818" stroke="#333" strokeWidth="1.5" />
      <circle cx="84" cy="17" r="4" fill={primaryColor} />
      <circle cx="84" cy="63" r="4" fill={primaryColor} />

      {/* Main Chassis / Monocoque */}
      <path
        d="M 60 30 Q 90 26 120 28 L 160 32 Q 200 35 215 39 Q 200 45 160 48 L 120 52 Q 90 54 60 50 Z"
        fill={`url(#carGrad-${primaryColor})`}
        stroke="#FFFFFF"
        strokeWidth="1"
        filter={`url(#carGlow-${primaryColor})`}
      />

      {/* Cockpit / Halo */}
      <ellipse cx="125" cy="40" rx="16" ry="8" fill="#080808" stroke="#444" strokeWidth="1" />
      <circle cx="122" cy="40" r="4.5" fill="#FFD700" />
      <path d="M 115 40 L 138 40" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />

      {/* Sidepods */}
      <path d="M 90 24 L 140 28 L 138 32 L 85 30 Z" fill="#1a1a1a" stroke={primaryColor} strokeWidth="1" />
      <path d="M 90 56 L 140 52 L 138 48 L 85 50 Z" fill="#1a1a1a" stroke={primaryColor} strokeWidth="1" />

      {/* Front Tires */}
      <rect x="170" y="12" width="24" height="16" rx="3" fill="#181818" stroke="#333" strokeWidth="1.5" />
      <rect x="170" y="52" width="24" height="16" rx="3" fill="#181818" stroke="#333" strokeWidth="1.5" />
      <circle cx="182" cy="20" r="3.5" fill={primaryColor} />
      <circle cx="182" cy="60" r="3.5" fill={primaryColor} />

      {/* Front Wing */}
      <path d="M 205 20 L 225 24 L 225 56 L 205 60 Z" fill="#222" stroke={accentColor} strokeWidth="1.5" />
      <polygon points="225,32 238,40 225,48" fill={primaryColor} />
    </svg>
  );
}

export default function WelcomePage({ onProceed }) {
  // Automatic progression after the introduction sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      onProceed();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onProceed]);

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      {/* Background Racing Grid Lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at center, rgba(255, 0, 0, 0.12) 0%, rgba(8, 9, 12, 0.95) 75%)',
        zIndex: 1
      }} />

      {/* Crossing F1 Cars */}
      <div className="f1-car-diagonal-left">
        <F1CarSvg primaryColor="#FF0000" accentColor="#FFFFFF" glowColor="rgba(255,0,0,0.9)" />
      </div>

      <div className="f1-car-diagonal-right">
        <F1CarSvg primaryColor="#FF5F1F" accentColor="#FFFFFF" glowColor="rgba(255,95,31,0.9)" />
      </div>

      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '820px',
        margin: '0 auto',
        padding: '30px'
      }}>
        {/* Hackathon Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 0, 0, 0.15)',
          border: '1px solid var(--parth-red)',
          borderRadius: '20px',
          padding: '6px 16px',
          marginBottom: '24px',
          boxShadow: '0 0 15px rgba(255, 0, 0, 0.3)'
        }}>
          <Zap size={14} color="var(--parth-red)" />
          <span className="font-orbitron" style={{ fontSize: '11px', color: '#fff', letterSpacing: '1px' }}>
            DL-SJBIT-HK26-GOVP009
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="font-orbitron" style={{
          fontSize: 'clamp(32px, 5.5vw, 54px)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '2px',
          marginBottom: '24px',
          textTransform: 'uppercase'
        }}>
          WHERE TO <span style={{
            background: 'linear-gradient(135deg, var(--parth-red) 30%, var(--parth-neon-orange) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 25px rgba(255, 0, 0, 0.5))'
          }}>PARTH</span>
        </h1>

        {/* Exact Approved Brief Copy */}
        <div style={{
          background: 'rgba(22, 25, 32, 0.85)',
          border: '1px solid var(--parth-border)',
          borderLeft: '4px solid var(--parth-red)',
          borderRadius: '8px',
          padding: '28px 32px',
          textAlign: 'left',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <p className="font-rajdhani" style={{
            fontSize: 'clamp(18px, 2.4vw, 24px)',
            fontWeight: 700,
            color: 'var(--parth-white)',
            letterSpacing: '0.5px',
            lineHeight: 1.5,
            marginBottom: '16px'
          }}>
            Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.
          </p>
          <div className="font-orbitron" style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            fontWeight: 900,
            color: 'var(--parth-neon-orange)',
            letterSpacing: '1px'
          }}>
            Dw, Abhimanyu. This time, we'll get you out.
          </div>
        </div>
      </div>
    </div>
  );
}
