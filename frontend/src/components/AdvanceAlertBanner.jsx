import React from 'react';
import { CornerUpLeft, CornerUpRight, ArrowUpRight, ArrowUpLeft, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdvanceAlertBanner({ activeAlert }) {
  if (!activeAlert) {
    return (
      <div style={{
        background: 'rgba(22, 25, 32, 0.7)',
        border: '1px solid var(--parth-border)',
        borderRadius: '6px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} color="var(--parth-green)" />
          <div>
            <div className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-green)', letterSpacing: '0.8px' }}>
              SECTOR CLEAR // ON TRACK
            </div>
            <div className="font-rajdhani" style={{ fontSize: '13px', color: '#8E95A5' }}>
              Maintaining current road corridor. No manoeuvres within 1.0 km.
            </div>
          </div>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '12px', color: '#6A7282' }}>
          Next checkpoint monitoring active
        </div>
      </div>
    );
  }

  const { maneuver, distanceMeters } = activeAlert;

  const renderIcon = () => {
    switch (maneuver.turnType) {
      case 'left':
      case 'sharp_left':
        return <CornerUpLeft size={28} color="#FFF" />;
      case 'right':
      case 'sharp_right':
        return <CornerUpRight size={28} color="#FFF" />;
      case 'slight_right':
        return <ArrowUpRight size={28} color="#FFF" />;
      case 'slight_left':
        return <ArrowUpLeft size={28} color="#FFF" />;
      default:
        return <ArrowRight size={28} color="#FFF" />;
    }
  };

  const isUrgent = distanceMeters <= 350;

  return (
    <div
      className={isUrgent ? 'pulse-alert' : ''}
      style={{
        background: isUrgent
          ? 'linear-gradient(135deg, rgba(255, 0, 0, 0.25) 0%, rgba(22, 25, 32, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 95, 31, 0.2) 0%, rgba(22, 25, 32, 0.95) 100%)',
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
          boxShadow: '0 0 15px rgba(0,0,0,0.5)'
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
              ADVANCE TURN NOTIFICATION (~1 KM WINDOW)
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

          {/* Lane Guidance Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className="font-rajdhani" style={{ fontSize: '12px', color: '#B0B7C6' }}>
              Lane recommendation:
            </span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'Rajdhani',
              fontWeight: 700,
              padding: '1px 8px',
              borderRadius: '3px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid var(--parth-cyan)',
              color: 'var(--parth-cyan)'
            }}>
              {maneuver.laneGuidance}
            </span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#FFF' }}>
          {distanceMeters} <span style={{ fontSize: '13px', color: '#8E95A5' }}>METERS</span>
        </div>
        <div className="font-rajdhani" style={{ fontSize: '11px', color: '#8E95A5' }}>
          Approx. {Math.max(1, Math.round(distanceMeters / 15))} sec at current pace
        </div>
      </div>
    </div>
  );
}

