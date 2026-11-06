import React, { useEffect, useRef } from 'react';

/**
 * ParticleGlobeTransition
 * Phase 1: Breakup & natural diffusion of particles with sampled welcome palette
 *          (Red #FF0000, Neon Orange #FF5F1F, White #FFFFFF, Dark grey #222)
 * Phase 2: Particles organize into a rotating 3D spherical globe silhouette
 * Phase 3: Globe splits vertically into left and right halves moving outwards to reveal BriefPage
 */
export default function ParticleGlobeTransition({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Accessibility check: support prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Color palette sampled from Welcome composition: Red, Neon Orange, White, Dark Accent
    const palette = [
      '#FF0000',
      '#FF5F1F',
      '#FFFFFF',
      '#FF3300',
      '#FFA500',
      '#E0E0E0',
      '#333333'
    ];

    // Determine particle count based on screen size (responsive, non-blocking)
    const count = Math.min(1200, Math.max(600, Math.floor((width * height) / 1200)));
    const particles = [];

    // Globe parameters
    const globeRadius = Math.min(width, height) * 0.28;
    const centerX = width / 2;
    const centerY = height / 2;

    // Golden spiral distribution on sphere surface
    for (let i = 0; i < count; i++) {
      // Starting positions (centered around the welcome hero card layout)
      const startX = centerX + (Math.random() - 0.5) * Math.min(width * 0.7, 700);
      const startY = centerY + (Math.random() - 0.5) * Math.min(height * 0.5, 450);

      // Spherical coordinates for globe formation
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const sphereX = globeRadius * Math.sin(phi) * Math.cos(theta);
      const sphereY = globeRadius * Math.cos(phi);
      const sphereZ = globeRadius * Math.sin(phi) * Math.sin(theta);

      // Determine hemisphere assignment for separation phase
      const isLeftHalf = sphereX < 0;

      particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 12 + (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 12 + (Math.random() - 0.5) * 4,
        size: Math.random() * 2 + 1.2,
        color: palette[i % palette.length],
        alpha: 0.9,
        // Target 3D coordinates on sphere
        sphereX,
        sphereY,
        sphereZ,
        phi,
        theta,
        isLeftHalf,
        // Individual speed & jitter
        friction: 0.94 + Math.random() * 0.03,
        splitSpeed: 8 + Math.random() * 14
      });
    }

    const startTime = performance.now();
    let completed = false;

    // Timeline durations (in ms):
    // 0 - 1000ms: Organic diffusion
    // 1000 - 2400ms: Particle settling into globe
    // 2400 - 3200ms: Globe rotation & coherence
    // 3200 - 4200ms: Globe splits apart horizontally (left half left, right half right)
    // 4200ms: onComplete()
    const DURATION_DIFFUSE = 900;
    const DURATION_FORM = 1500; // until 2400ms
    const DURATION_HOLD = 800; // until 3200ms
    const DURATION_SPLIT = 1000; // until 4200ms

    const render = (currentTime) => {
      const elapsed = currentTime - startTime;

      ctx.fillStyle = '#08090C';
      ctx.fillRect(0, 0, width, height);

      // Sphere rotation angle around Y-axis
      const rotY = elapsed * 0.0012;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        if (elapsed < DURATION_DIFFUSE) {
          // Phase 1: Natural physical diffusion with turbulence
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= p.friction;
          p.vy *= p.friction;
        } else if (elapsed < DURATION_DIFFUSE + DURATION_FORM + DURATION_HOLD) {
          // Phase 2: Particles organize into rotating globe
          const formProgress = Math.min(1, (elapsed - DURATION_DIFFUSE) / DURATION_FORM);
          // Ease-in-out cubic
          const ease = formProgress < 0.5
            ? 4 * formProgress * formProgress * formProgress
            : 1 - Math.pow(-2 * formProgress + 2, 3) / 2;

          // Rotate 3D coordinates
          const rotatedX = p.sphereX * Math.cos(rotY) - p.sphereZ * Math.sin(rotY);
          const rotatedZ = p.sphereX * Math.sin(rotY) + p.sphereZ * Math.cos(rotY);

          const targetX = centerX + rotatedX;
          const targetY = centerY + p.sphereY;

          // Interpolate towards rotating globe position
          p.x += (targetX - p.x) * (0.06 + ease * 0.12);
          p.y += (targetY - p.y) * (0.06 + ease * 0.12);

          // Depth shading based on Z coordinate
          const depthScale = (rotatedZ + globeRadius) / (2 * globeRadius);
          p.alpha = Math.max(0.25, Math.min(1, 0.35 + depthScale * 0.65));
        } else {
          // Phase 3: Split into two halves moving outward
          const splitElapsed = elapsed - (DURATION_DIFFUSE + DURATION_FORM + DURATION_HOLD);
          const splitProgress = Math.min(1, splitElapsed / DURATION_SPLIT);

          // Horizontal drift
          const dir = p.isLeftHalf ? -1 : 1;
          const accel = Math.pow(splitProgress, 1.8) * p.splitSpeed;
          p.x += dir * accel;
          // Fade out slightly towards edges
          p.alpha = Math.max(0, 1 - splitProgress * 0.85);
        }

        // Draw tiny circular particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      if (elapsed < DURATION_DIFFUSE + DURATION_FORM + DURATION_HOLD + DURATION_SPLIT) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (!completed) {
          completed = true;
          onComplete();
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#08090C',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

