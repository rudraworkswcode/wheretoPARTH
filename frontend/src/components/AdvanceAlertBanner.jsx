import React from 'react';
import {
  CornerUpLeft,
  CornerUpRight,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowRight,
  ArrowUp,
  ShieldCheck,
  Navigation
} from 'lucide-react';

export default function AdvanceAlertBanner({ activeAlert }) {
  // 1. Cruising Corridor State (No upcoming turn within 1 km)
  if (!activeAlert) {
    return (
      <div style={{
        background: '#0D0F14',
        border: '1px solid var(--parth-border)',
        borderRadius: '8px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            background: 'rgba(0, 255, 102, 0.12)',
            border: '1px solid var(--parth-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} color="var(--parth-green)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-green)', letterSpacing: '0.8px', fontWeight: 800 }}>
                SECTOR CLEAR // ON TRACK
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'Rajdhani',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '2px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFF'
              }}>
                1.0 KM CLEAR
              </span>
            </div>
            <div className="font-rajdhani" style={{ fontSize: '14px', color: '#B0B7C6', marginTop: '2px' }}>
              Maintaining current highway corridor. No manoeuvres within 1.0 km.
            </div>
            {/* Active Lane Cruising Recommendation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5', fontWeight: 600 }}>
                Lane recommendation:
              </span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'Rajdhani',
                fontWeight: 700,
                padding: '1px 8px',
                borderRadius: '3px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid var(--parth-cyan)',
                color: 'var(--parth-cyan)'
              }}>
                Maintain Center-Left Cruising Lane
              </span>
            </div>
          </div>
        </div>

        {/* Minimal 3-Lane Highway Cruising Graphic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#151821',
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid #242833'
          }}>
            {/* Lane 1 */}
            <div style={{
              width: '28px',
              height: '34px',
              borderRadius: '3px',
              border: '1px dashed #444',
              background: '#181B24',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1px'
            }}>
              <ArrowUp size={12} color="#666" />
              <span style={{ fontSize: '7px', fontFamily: 'Orbitron', color: '#888' }}>L1</span>
            </div>
            {/* Lane 2 (Cruising Recommended) */}
            <div style={{
              width: '32px',
              height: '36px',
              borderRadius: '3px',
              border: '1.5px solid var(--parth-cyan)',
              background: 'rgba(0, 240, 255, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1px',
              boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)'
            }}>
              <ArrowUp size={14} color="#FFF" />
              <span style={{ fontSize: '8px', fontFamily: 'Orbitron', fontWeight: 800, color: 'var(--parth-cyan)' }}>L2★</span>
            </div>
            {/* Lane 3 */}
            <div style={{
              width: '28px',
              height: '34px',
              borderRadius: '3px',
              border: '1px dashed #444',
              background: '#181B24',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1px'
            }}>
              <ArrowUp size={12} color="#666" />
              <span style={{ fontSize: '7px', fontFamily: 'Orbitron', color: '#888' }}>L3</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Advance Manoeuvre Alert State (~1 km Window)
  const { maneuver, distanceMeters } = activeAlert;
  const isUrgent = distanceMeters <= 350;

  const renderIcon = () => {
    switch (maneuver.turnType) {
      case 'left':
      case 'sharp_left':
        return <CornerUpLeft size={28} color="#FFFFFF" />;
      case 'right':
      case 'sharp_right':
        return <CornerUpRight size={28} color="#FFFFFF" />;
      case 'slight_right':
        return <ArrowUpRight size={28} color="#FFFFFF" />;
      case 'slight_left':
        return <ArrowUpLeft size={28} color="#FFFFFF" />;
      default:
        return <ArrowRight size={28} color="#FFFFFF" />;
    }
  };

  const laneIndex = maneuver.laneIndex !== undefined
    ? maneuver.laneIndex
    : maneuver.turnType?.includes('left')
      ? 0
      : maneuver.turnType?.includes('right')
        ? 2
        : 1;

  const laneGuidanceText = maneuver.laneGuidance || (
    laneIndex === 0
      ? 'Shift to Left Turn Lane'
      : laneIndex === 2
        ? 'Shift to Right Turn Lane'
        : 'Keep Center Cruising Lane'
  );

  return (
    <div
      className={isUrgent ? 'pulse-alert' : ''}
      style={{
        background: isUrgent
          ? 'linear-gradient(135deg, rgba(255, 0, 0, 0.25) 0%, #101217 100%)'
          : 'linear-gradient(135deg, rgba(255, 95, 31, 0.2) 0%, #101217 100%)',
        border: `2px solid ${isUrgent ? 'var(--parth-red)' : 'var(--parth-neon-orange)'}`,
        borderRadius: '8px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: isUrgent ? '0 0 25px var(--parth-red-glow)' : '0 0 15px var(--parth-orange-glow)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Turn Graphic Pill */}
        <div style={{
          width: '52px',
          height: '52px',
          background: isUrgent ? 'var(--parth-red)' : 'var(--parth-neon-orange)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}>
          {renderIcon()}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-orbitron" style={{
              fontSize: '11px',
              fontWeight: 900,
              color: isUrgent ? 'var(--parth-red)' : 'var(--parth-neon-orange)',
              letterSpacing: '1px'
            }}>
              ADVANCE MANOEUVRE NOTIFICATION (~1 KM WINDOW)
            </span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'Orbitron',
              padding: '1px 6px',
              borderRadius: '2px',
              background: '#FFF',
              color: '#000',
              fontWeight: 800
            }}>
              {distanceMeters}m
            </span>
          </div>

          <div className="font-rajdhani" style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
            {maneuver.instruction} in {distanceMeters} meters
          </div>

          {/* Lane Recommendation Badge from Prototype 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span className="font-rajdhani" style={{ fontSize: '13px', color: '#B0B7C6', fontWeight: 600 }}>
              Lane recommendation:
            </span>
            <span style={{
              fontSize: '12px',
              fontFamily: 'Rajdhani',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: '4px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1.5px solid var(--parth-cyan)',
              color: 'var(--parth-cyan)',
              boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)',
              letterSpacing: '0.5px'
            }}>
              {laneGuidanceText}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Multi-Lane Guidance Schematic + Distance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Dynamic 3-Lane Highway Visualizer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(10, 12, 16, 0.9)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #2A2F3D'
        }}>
          <span className="font-orbitron" style={{ fontSize: '9px', color: '#8E95A5', letterSpacing: '0.5px' }}>
            LANE GUIDANCE
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {/* Lane 1: Left */}
            <div style={{
              width: '32px',
              height: '40px',
              borderRadius: '4px',
              border: laneIndex === 0 ? '2px solid var(--parth-cyan)' : '1px dashed #3D4452',
              background: laneIndex === 0 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(20, 24, 32, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              boxShadow: laneIndex === 0 ? '0 0 12px rgba(0, 240, 255, 0.5)' : 'none'
            }}>
              <CornerUpLeft size={14} color={laneIndex === 0 ? '#FFF' : '#555'} />
              <span style={{
                fontSize: '8px',
                fontFamily: 'Orbitron',
                fontWeight: laneIndex === 0 ? 900 : 500,
                color: laneIndex === 0 ? 'var(--parth-cyan)' : '#777'
              }}>
                L1
              </span>
            </div>

            {/* Lane 2: Center */}
            <div style={{
              width: '32px',
              height: '40px',
              borderRadius: '4px',
              border: laneIndex === 1 ? '2px solid var(--parth-cyan)' : '1px dashed #3D4452',
              background: laneIndex === 1 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(20, 24, 32, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              boxShadow: laneIndex === 1 ? '0 0 12px rgba(0, 240, 255, 0.5)' : 'none'
            }}>
              <ArrowUp size={14} color={laneIndex === 1 ? '#FFF' : '#555'} />
              <span style={{
                fontSize: '8px',
                fontFamily: 'Orbitron',
                fontWeight: laneIndex === 1 ? 900 : 500,
                color: laneIndex === 1 ? 'var(--parth-cyan)' : '#777'
              }}>
                L2
              </span>
            </div>

            {/* Lane 3: Right */}
            <div style={{
              width: '32px',
              height: '40px',
              borderRadius: '4px',
              border: laneIndex === 2 ? '2px solid var(--parth-cyan)' : '1px dashed #3D4452',
              background: laneIndex === 2 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(20, 24, 32, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              boxShadow: laneIndex === 2 ? '0 0 12px rgba(0, 240, 255, 0.5)' : 'none'
            }}>
              <CornerUpRight size={14} color={laneIndex === 2 ? '#FFF' : '#555'} />
              <span style={{
                fontSize: '8px',
                fontFamily: 'Orbitron',
                fontWeight: laneIndex === 2 ? 900 : 500,
                color: laneIndex === 2 ? 'var(--parth-cyan)' : '#777'
              }}>
                L3
              </span>
            </div>
          </div>
        </div>

        {/* Distance Countdown */}
        <div style={{ textAlign: 'right', minWidth: '95px' }}>
          <div className="font-orbitron" style={{ fontSize: '26px', fontWeight: 900, color: '#FFF' }}>
            {distanceMeters} <span style={{ fontSize: '13px', color: '#8E95A5' }}>M</span>
          </div>
          <div className="font-rajdhani" style={{ fontSize: '12px', color: '#8E95A5', marginTop: '2px' }}>
            Approx. {Math.max(1, Math.round(distanceMeters / 15))}s at current pace
          </div>
        </div>
      </div>
    </div>
  );
}
