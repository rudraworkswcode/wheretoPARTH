import React from 'react';
import { RadioTower, AlertOctagon, Compass, Cpu } from 'lucide-react';

export default function SignalLossBanner({ isSignalLost, deadReckoningData }) {
  if (!isSignalLost) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(22, 25, 32, 0.95) 100%)',
      border: '2px solid var(--parth-yellow)',
      borderRadius: '8px',
      padding: '12px 18px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          background: 'var(--parth-yellow)',
          color: '#000',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AlertOctagon size={24} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-orbitron" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--parth-yellow)', letterSpacing: '1px' }}>
              NAVIC GNSS DROPOUT DETECTED // DEAD RECKONING ACTIVE
            </span>
          </div>
          <div className="font-rajdhani" style={{ fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
            Satellite fix temporarily interrupted. Estimating vehicle trajectory via historical velocity & heading vectors.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div className="font-orbitron" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--parth-yellow)' }}>
            DR VELOCITY: {deadReckoningData?.speedKmh || 48} km/h
          </div>
          <div className="font-rajdhani" style={{ fontSize: '11px', color: '#B0B7C6' }}>
            Heading: {deadReckoningData?.heading || 120}° | Kalman Drift Guard
          </div>
        </div>
      </div>
    </div>
  );
}

