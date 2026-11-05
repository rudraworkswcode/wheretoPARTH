import React from 'react';
import { ArrowRight, Compass, ShieldAlert, Cpu, Radio } from 'lucide-react';

export default function BriefPage({ onProceed, onBack }) {
  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 24px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Paddock Mission Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--parth-border)',
        paddingBottom: '16px',
        marginBottom: '32px'
      }}>
        <div>
          <span className="font-orbitron" style={{ fontSize: '12px', color: 'var(--parth-neon-orange)', letterSpacing: '1px' }}>
            PHASE 02 // MISSION BRIEFING
          </span>
          <h2 className="font-orbitron" style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            THE <span style={{ color: 'var(--parth-red)' }}>PARTH</span> PHILOSOPHY
          </h2>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 0, 0, 0.1)',
          padding: '6px 14px',
          borderRadius: '4px',
          border: '1px solid var(--parth-red)'
        }}>
          <Radio size={14} color="var(--parth-red)" />
          <span className="font-rajdhani" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
            HACKATHON PROBLEM ID: DL-SJBIT-HK26-GOVP009
          </span>
        </div>
      </div>

      {/* The Approved Exact Copy Hero Card */}
      <div className="racing-card" style={{
        borderColor: 'var(--parth-red)',
        background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.08) 0%, rgba(22, 25, 32, 0.95) 100%)',
        boxShadow: '0 0 30px var(--parth-red-glow)',
        padding: '36px',
        marginBottom: '36px'
      }}>
        <div style={{
          borderLeft: '4px solid var(--parth-red)',
          paddingLeft: '24px'
        }}>
          {/* Exact PRD Copy Part 1 */}
          <blockquote className="font-rajdhani" style={{
            fontSize: 'clamp(20px, 2.8vw, 28px)',
            fontWeight: 700,
            lineHeight: 1.45,
            color: 'var(--parth-white)',
            letterSpacing: '0.5px',
            marginBottom: '18px'
          }}>
            "Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way."
          </blockquote>

          {/* Exact PRD Copy Part 2 */}
          <div className="font-orbitron" style={{
            fontSize: 'clamp(18px, 2.2vw, 24px)',
            fontWeight: 900,
            color: 'var(--parth-neon-orange)',
            letterSpacing: '1px'
          }}>
            "Dw, Abhimanyu. This time, we'll get you out."
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--parth-border)',
        paddingTop: '24px'
      }}>
        {onBack ? (
          <button
            onClick={onBack}
            className="f1-btn-outline"
          >
            ← BACK
          </button>
        ) : <div />}

        <button
          onClick={onProceed}
          className="f1-btn-orange"
        >
          <span>PROCEED TO ROUTE SELECTION</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
