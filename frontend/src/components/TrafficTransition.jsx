import React, { useEffect } from 'react';

// Small F1 Car Top-down SVG for parallel traffic transition
function CompactF1Car({ color = '#FF0000', direction = 'down' }) {
  const isDown = direction === 'down';
  return (
    <div
      style={{
        transform: isDown ? 'rotate(90deg)' : 'rotate(-90deg)',
        width: '42px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: `drop-shadow(0 0 8px ${color === '#FF0000' ? 'rgba(255,0,0,0.8)' : 'rgba(255,95,31,0.8)'})`
      }}
    >
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Rear Wing */}
        <rect x="15" y="6" width="6" height="28" rx="1" fill="#222" stroke={color} strokeWidth="1" />
        {/* Rear Tires */}
        <rect x="25" y="2" width="14" height="8" rx="1.5" fill="#181818" stroke="#333" />
        <rect x="25" y="30" width="14" height="8" rx="1.5" fill="#181818" stroke="#333" />
        {/* Chassis */}
        <path d="M 22 15 Q 50 12 75 14 L 95 18 Q 105 20 95 22 L 75 26 Q 50 28 22 25 Z" fill={color} stroke="#FFFFFF" strokeWidth="0.8" />
        {/* Cockpit */}
        <ellipse cx="60" cy="20" rx="8" ry="4" fill="#111" stroke="#444" strokeWidth="0.8" />
        <circle cx="58" cy="20" r="2" fill="#FFD700" />
        {/* Front Tires */}
        <rect x="80" y="4" width="12" height="7" rx="1.5" fill="#181818" stroke="#333" />
        <rect x="80" y="29" width="12" height="7" rx="1.5" fill="#181818" stroke="#333" />
        {/* Front Wing */}
        <polygon points="102,10 112,18 112,22 102,30" fill={color} />
      </svg>
    </div>
  );
}

/**
 * TrafficTransition
 * Plays opposite parallel traffic flows between route selection and the navigation cockpit:
 * - Upper group: enters from top and travels downward in parallel lanes
 * - Lower group: enters from bottom and travels upward in parallel lanes
 * - Completes promptly and reveals the navigation map
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
    }, 1450);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Parallel lane definitions (% across screen width)
  const lanesDown = [24, 34, 44];
  const lanesUp = [56, 66, 76];

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
            animation: `trafficFlowDown 1.35s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            animationDelay: `${i * 0.12}s`,
            display: 'flex',
            flexDirection: 'column',
            gap: '30px'
          }}
        >
          <CompactF1Car color="#FF0000" direction="down" />
          <CompactF1Car color="#FFFFFF" direction="down" />
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
            animation: `trafficFlowUp 1.35s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            animationDelay: `${i * 0.12 + 0.05}s`,
            display: 'flex',
            flexDirection: 'column',
            gap: '30px'
          }}
        >
          <CompactF1Car color="#FF5F1F" direction="up" />
          <CompactF1Car color="#FFFFFF" direction="up" />
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
          background: 'dashed 2px rgba(255, 255, 255, 0.25)',
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
}

