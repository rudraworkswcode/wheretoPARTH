import React, { useEffect } from 'react';

// Detailed Top-Down F1 Car component for parallel traffic
function TrafficF1Car({ color = '#FF0000', direction = 'down' }) {
  const isDown = direction === 'down';
  const glow = color === '#FF0000' ? 'rgba(255, 0, 0, 0.75)' : 'rgba(255, 95, 31, 0.75)';

  return (
    <div
      style={{
        transform: isDown ? 'rotate(180deg)' : 'rotate(0deg)',
        width: '38px',
        height: '88px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: `drop-shadow(0 0 10px ${glow})`
      }}
    >
      <svg
        viewBox="0 0 76 176"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Front Wing Assembly */}
        <path d="M 8 16 L 68 16 L 64 26 L 12 26 Z" fill="#181818" stroke="#FFFFFF" strokeWidth="1" />
        <polygon points="38,6 46,16 30,16" fill={color} />
        <rect x="6" y="10" width="4" height="18" rx="1" fill="#FFFFFF" />
        <rect x="66" y="10" width="4" height="18" rx="1" fill="#FFFFFF" />

        {/* Front Left Tire */}
        <rect x="2" y="30" width="16" height="32" rx="3" fill="#151515" stroke="#333333" strokeWidth="1.5" />
        <circle cx="10" cy="46" r="3" fill={color} />
        {/* Front Right Tire */}
        <rect x="58" y="30" width="16" height="32" rx="3" fill="#151515" stroke="#333333" strokeWidth="1.5" />
        <circle cx="66" cy="46" r="3" fill={color} />

        {/* Front Suspension Arms */}
        <line x1="18" y1="42" x2="28" y2="44" stroke="#888888" strokeWidth="1.5" />
        <line x1="18" y1="50" x2="28" y2="48" stroke="#888888" strokeWidth="1.5" />
        <line x1="58" y1="42" x2="48" y2="44" stroke="#888888" strokeWidth="1.5" />
        <line x1="58" y1="50" x2="48" y2="48" stroke="#888888" strokeWidth="1.5" />

        {/* Nose Cone */}
        <path d="M 32 16 L 44 16 L 41 54 L 35 54 Z" fill={color} stroke="#FFFFFF" strokeWidth="0.8" />

        {/* Sidepods and Main Body Chassis */}
        <path
          d="M 28 54 Q 18 68 20 116 L 27 126 L 49 126 L 56 116 Q 58 68 48 54 Z"
          fill="#1c1f26"
          stroke={color}
          strokeWidth="1.2"
        />

        {/* Sidepod Color Accents */}
        <path d="M 22 72 Q 22 96 26 114 L 30 114 L 28 72 Z" fill={color} opacity="0.9" />
        <path d="M 54 72 Q 54 96 50 114 L 46 114 L 48 72 Z" fill={color} opacity="0.9" />

        {/* Cockpit Opening and Halo */}
        <ellipse cx="38" cy="74" rx="7" ry="14" fill="#0a0a0a" stroke="#444444" strokeWidth="1" />
        {/* Driver Helmet (Yellow/Gold) */}
        <circle cx="38" cy="74" r="4.5" fill="#FFD700" stroke="#000" strokeWidth="0.5" />
        {/* Halo Strut */}
        <path d="M 38 62 L 38 70" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />

        {/* Engine Airbox and Fin */}
        <ellipse cx="38" cy="94" rx="4.5" ry="6" fill="#111111" />
        <line x1="38" y1="94" x2="38" y2="128" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Rear Left Tire */}
        <rect x="0" y="112" width="18" height="38" rx="3" fill="#151515" stroke="#333333" strokeWidth="1.5" />
        <circle cx="9" cy="131" r="3.5" fill={color} />
        {/* Rear Right Tire */}
        <rect x="58" y="112" width="18" height="38" rx="3" fill="#151515" stroke="#333333" strokeWidth="1.5" />
        <circle cx="67" cy="131" r="3.5" fill={color} />

        {/* Rear Suspension Arms */}
        <line x1="18" y1="126" x2="28" y2="126" stroke="#888888" strokeWidth="1.5" />
        <line x1="58" y1="126" x2="48" y2="126" stroke="#888888" strokeWidth="1.5" />

        {/* Rear Wing Assembly */}
        <rect x="6" y="146" width="64" height="14" rx="2" fill="#181818" stroke="#FFFFFF" strokeWidth="1" />
        <rect x="14" y="149" width="48" height="4" fill={color} />
        {/* Rear Endplates */}
        <rect x="4" y="140" width="4" height="26" rx="1" fill="#FFFFFF" />
        <rect x="68" y="140" width="4" height="26" rx="1" fill="#FFFFFF" />
        {/* Rain light */}
        <rect x="36" y="162" width="4" height="4" rx="1" fill="#FF0000" />
      </svg>
    </div>
  );
}

/**
 * TrafficTransition
 * Plays opposite parallel traffic flows between route selection and the navigation cockpit:
 * - Upper group: enters from top and travels downward in parallel lanes
 * - Lower group: enters from bottom and travels upward in parallel lanes
 */
export default function TrafficTransition({ onComplete }) {
  useEffect(() => {
    // Accessibility check: support prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Parallel lane definitions (% across screen width)
  const lanesDown = [18, 28, 38];
  const lanesUp = [62, 72, 82];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(8, 9, 12, 0.94)',
        backdropFilter: 'blur(10px)',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Downward Traffic Group (Top to Bottom) */}
      {lanesDown.map((laneX, i) => (
        <div
          key={`down-${i}`}
          style={{
            position: 'absolute',
            left: `${laneX}%`,
            top: 0,
            animation: `trafficFlowDown 1.65s cubic-bezier(0.35, 0, 0.2, 1) forwards`,
            animationDelay: `${i * 0.14}s`,
            display: 'flex',
            flexDirection: 'column',
            gap: '50px'
          }}
        >
          <TrafficF1Car color="#FF0000" direction="down" />
          <TrafficF1Car color="#FF5F1F" direction="down" />
        </div>
      ))}

      {/* Upward Traffic Group (Bottom to Top) */}
      {lanesUp.map((laneX, i) => (
        <div
          key={`up-${i}`}
          style={{
            position: 'absolute',
            left: `${laneX}%`,
            bottom: 0,
            animation: `trafficFlowUp 1.65s cubic-bezier(0.35, 0, 0.2, 1) forwards`,
            animationDelay: `${i * 0.14 + 0.06}s`,
            display: 'flex',
            flexDirection: 'column',
            gap: '50px'
          }}
        >
          <TrafficF1Car color="#FF5F1F" direction="up" />
          <TrafficF1Car color="#FF0000" direction="up" />
        </div>
      ))}

      {/* Center Track Divider Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '2px',
          borderLeft: '2px dashed rgba(255, 255, 255, 0.25)',
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
}
