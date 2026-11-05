import React from 'react';
import { Info, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export default function TechnicalExplainer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="racing-card" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderColor: 'var(--parth-red)',
        boxShadow: '0 0 40px var(--parth-red-glow)',
        padding: '28px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--parth-border)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={22} color="var(--parth-red)" />
            <h3 className="font-orbitron" style={{ fontSize: '18px', fontWeight: 900 }}>
              TECHNICAL DISCLOSURE & CRITERIA COVERAGE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="f1-btn-outline"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* 3 Core Architectural Distinctions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(8, 9, 12, 0.6)', padding: '16px', borderRadius: '6px', borderLeft: '4px solid var(--parth-neon-orange)' }}>
            <h4 className="font-orbitron" style={{ fontSize: '14px', color: 'var(--parth-neon-orange)', marginBottom: '6px' }}>
              1. Simulated GNSS Noise vs Live NavIC Signals
            </h4>
            <p className="font-rajdhani" style={{ fontSize: '14px', color: '#B5BAC7', lineHeight: 1.5 }}>
              This prototype models NavIC positioning distortion through parameterized Gaussian jitter (0.00005 variance), cumulative atmospheric drift, and satellite dropouts. It runs purely on standard compute hardware without requiring specialized raw RF hardware receivers.
            </p>
          </div>

          <div style={{ background: 'rgba(8, 9, 12, 0.6)', padding: '16px', borderRadius: '6px', borderLeft: '4px solid var(--parth-red)' }}>
            <h4 className="font-orbitron" style={{ fontSize: '14px', color: 'var(--parth-red)', marginBottom: '6px' }}>
              2. OSRM Road Matching vs Lane-Level Accuracy
            </h4>
            <p className="font-rajdhani" style={{ fontSize: '14px', color: '#B5BAC7', lineHeight: 1.5 }}>
              OSRM Map Matching associates coordinate traces with digital road network centerlines. While it resolves road-segment ambiguities and eliminates positioning jitter, true lane-level distinction relies on road geometry width and lane topology attributes in the underlying map data. When lane attributes are not present, road-level guidance is safely provided.
            </p>
          </div>

          <div style={{ background: 'rgba(8, 9, 12, 0.6)', padding: '16px', borderRadius: '6px', borderLeft: '4px solid var(--parth-cyan)' }}>
            <h4 className="font-orbitron" style={{ fontSize: '14px', color: 'var(--parth-cyan)', marginBottom: '6px' }}>
              3. Advance Turn Warnings & Dead Reckoning
            </h4>
            <p className="font-rajdhani" style={{ fontSize: '14px', color: '#B5BAC7', lineHeight: 1.5 }}>
              The system scans ahead along the matched road geometry, identifying sharp directional turns and triggering advance warnings approximately 1.0 km prior. When temporary signal loss occurs, dead reckoning projects position vectors from historical speed and heading.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button onClick={onClose} className="f1-btn-primary" style={{ padding: '8px 22px', fontSize: '12px' }}>
            ACKNOWLEDGED
          </button>
        </div>
      </div>
    </div>
  );
}

