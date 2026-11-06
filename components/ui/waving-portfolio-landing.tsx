import React, { useEffect, useRef, useState, useId, useMemo, useCallback } from 'react';

// ============================================================================
// WHERE TO PARTH — MOTORSPORT EDITORIAL LANDING COMPONENT
// Strict 4-Colour Motorsport System:
// Red:         #FF0000 (Dominant brand identity & bold typography)
// Neon Orange: #FF5F1F (Selective secondary accents & road details)
// White:       #FFFFFF (High-contrast details & readable labels)
// Black:       #000000 (Dominant background & surfaces)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. ORIGINAL 21st.dev SVG GLYPH GENERATION SYSTEM (PRESERVED & EXPORTED)
// ----------------------------------------------------------------------------
const GLYPH_WIDTH_FACTORS: Record<string, number> = {
  A: 1.04,
  M: 1.3,
  N: 1.04,
  Q: 1.02,
  V: 1.04,
  W: 1.44,
  X: 1.02,
};

export function glyphWidth(ch: string, baseWidth: number, stroke: number): number {
  if (ch === 'I') return stroke;
  if (ch === ' ') return baseWidth * 0.5;
  return baseWidth * (GLYPH_WIDTH_FACTORS[ch] ?? 1);
}

export function glyphPath(ch: string, w: number, h: number, stroke: number): string {
  const halfStroke = stroke / 2;
  const left = halfStroke;
  const right = w - halfStroke;
  const top = halfStroke;
  const bottom = h - halfStroke;
  const midX = w / 2;
  const midY = h / 2;
  const innerW = right - left;
  const innerH = bottom - top;
  const radiusX = innerW / 2;
  const cornerR = Math.min(innerW * 0.62, innerH / 4);

  const fmt = (...args: (string | number)[]) =>
    args
      .map((val) => (typeof val === 'number' ? String(Math.round(val * 10) / 10) : val))
      .join(' ');

  const arc = (rx: number, sweep: number, ex: number, ey: number) =>
    fmt('A', rx, rx, 0, 0, sweep, ex, ey);

  const loopO =
    fmt('M', left, top + radiusX) +
    arc(radiusX, 1, right, top + radiusX) +
    fmt('L', right, bottom - radiusX) +
    arc(radiusX, 1, left, bottom - radiusX) +
    'Z';

  const curveC =
    fmt('M', right, top + radiusX) +
    arc(radiusX, 0, left, top + radiusX) +
    fmt('L', left, bottom - radiusX) +
    arc(radiusX, 0, right, bottom - radiusX);

  const bowl = (yCut: number) => {
    const bR = Math.min(cornerR, (yCut - top) / 2);
    return (
      fmt('M', left, bottom, 'L', left, top, 'L', right - bR, top) +
      arc(bR, 1, right, top + bR) +
      fmt('L', right, yCut - bR) +
      arc(bR, 1, right - bR, yCut) +
      fmt('L', left, yCut)
    );
  };

  switch (ch) {
    case 'A': {
      const barY = top + innerH * 0.64;
      const t = (bottom - barY) / innerH;
      return fmt(
        'M', left, bottom,
        'L', midX, top,
        'L', right, bottom,
        'M', left + (midX - left) * t, barY,
        'L', right - (right - midX) * t, barY
      );
    }
    case 'B': {
      const midBarY = top + innerH * 0.47;
      const bW = right - stroke * 0.4;
      const r1 = Math.min(cornerR, (midBarY - top) / 2, bW - left);
      const r2 = Math.min(cornerR, (bottom - midBarY) / 2, innerW);
      return (
        fmt('M', left, midBarY, 'L', bW - r1, midBarY) +
        arc(r1, 0, bW, midBarY - r1) +
        fmt('L', bW, top + r1) +
        arc(r1, 0, bW - r1, top) +
        fmt('L', left, top, 'L', left, bottom, 'L', right - r2, bottom) +
        arc(r2, 0, right, bottom - r2) +
        fmt('L', right, midBarY + r2) +
        arc(r2, 0, right - r2, midBarY) +
        fmt('L', left, midBarY)
      );
    }
    case 'C':
      return curveC;
    case 'D': {
      const r = Math.min(innerW * 0.75, innerH / 2);
      return (
        fmt('M', left, top, 'L', right - r, top) +
        arc(r, 1, right, top + r) +
        fmt('L', right, bottom - r) +
        arc(r, 1, right - r, bottom) +
        fmt('L', left, bottom) +
        'Z'
      );
    }
    case 'E':
      return fmt(
        'M', right, top,
        'L', left, top,
        'L', left, bottom,
        'L', right, bottom,
        'M', left, midY,
        'L', right - innerW * 0.12, midY
      );
    case 'F':
      return fmt(
        'M', right, top,
        'L', left, top,
        'L', left, bottom,
        'M', left, midY - innerH * 0.02,
        'L', right - innerW * 0.12, midY - innerH * 0.02
      );
    case 'G':
      return curveC + fmt('L', right, midY + innerH * 0.04, 'L', midX, midY + innerH * 0.04);
    case 'H':
      return fmt(
        'M', left, top,
        'L', left, bottom,
        'M', right, top,
        'L', right, bottom,
        'M', left, midY,
        'L', right, midY
      );
    case 'I':
      return fmt('M', midX, top, 'L', midX, bottom);
    case 'J':
      return fmt('M', right, top, 'L', right, bottom - radiusX) + arc(radiusX, 1, left, bottom - radiusX) + fmt('L', left, bottom - radiusX - innerH * 0.06);
    case 'K':
      return fmt(
        'M', left, top,
        'L', left, bottom,
        'M', right, top,
        'L', left, top + innerH * 0.62,
        'M', left + innerW * 0.28, top + innerH * 0.47,
        'L', right, bottom
      );
    case 'L':
      return fmt('M', left, top, 'L', left, bottom, 'L', right, bottom);
    case 'M':
      return fmt(
        'M', left, bottom,
        'L', left, top,
        'L', midX, top + innerH * 0.55,
        'L', right, top,
        'L', right, bottom
      );
    case 'N':
      return fmt(
        'M', left, bottom,
        'L', left, top,
        'L', right, bottom,
        'L', right, top
      );
    case 'O':
      return loopO;
    case 'P':
      return bowl(top + innerH * 0.52);
    case 'Q':
      return loopO + fmt('M', midX + innerW * 0.1, bottom - innerH * 0.16, 'L', right + stroke * 0.2, bottom + stroke * 0.3);
    case 'R':
      return bowl(top + innerH * 0.5) + fmt('M', left + innerW * 0.42, top + innerH * 0.5, 'L', right, bottom);
    case 'S':
      return (
        fmt('M', right, top + radiusX) +
        arc(radiusX, 0, left, top + radiusX) +
        fmt('C', left, midY - innerH * 0.02, right, midY + innerH * 0.02, right, bottom - radiusX) +
        arc(radiusX, 1, left, bottom - radiusX)
      );
    case 'T':
      return fmt('M', left, top, 'L', right, top, 'M', midX, top, 'L', midX, bottom);
    case 'U':
      return fmt('M', left, top, 'L', left, bottom - radiusX) + arc(radiusX, 0, right, bottom - radiusX) + fmt('L', right, top);
    case 'V':
      return fmt('M', left, top, 'L', midX, bottom, 'L', right, top);
    case 'W': {
      const k = innerW * 0.24;
      return fmt(
        'M', left, top,
        'L', left + k, bottom,
        'L', midX, top + innerH * 0.3,
        'L', right - k, bottom,
        'L', right, top
      );
    }
    case 'X':
      return fmt('M', left, top, 'L', right, bottom, 'M', right, top, 'L', left, bottom);
    case 'Y':
      return fmt(
        'M', left, top,
        'L', midX, midY - innerH * 0.04,
        'L', right, top,
        'M', midX, midY - innerH * 0.04,
        'L', midX, bottom
      );
    case 'Z':
      return fmt('M', left, top, 'L', right, top, 'L', left, bottom, 'L', right, bottom);
    default:
      return '';
  }
}

// ----------------------------------------------------------------------------
// 2. FORMULA 1 RACING CAR SVG (LOCKED 4-COLOUR MOTORSPORT ASSET)
// Colors: #FF0000, #FF5F1F, #FFFFFF, #000000 ONLY
// ----------------------------------------------------------------------------
export interface F1CarProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  facing?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export function F1RacingCar({
  primaryColor = '#FF0000',
  secondaryColor = '#000000',
  accentColor = '#FFFFFF',
  facing = 'left',
  className = '',
  style = {},
}: F1CarProps) {
  const flip = facing === 'left';

  return (
    <svg
      viewBox="0 0 200 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        overflow: 'visible',
        ...style,
      }}
    >
      <g transform={flip ? 'scale(-1, 1) translate(-200, 0)' : undefined}>
        {/* Rear Wing Endplates & Main Planes */}
        <rect x="8" y="7" width="12" height="58" rx="2" fill={secondaryColor} stroke={primaryColor} strokeWidth="1.5" />
        <rect x="3" y="11" width="6" height="50" rx="1" fill={primaryColor} />
        <line x1="14" y1="16" x2="14" y2="56" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6 3" />

        {/* Rear Suspension Wishbones */}
        <line x1="38" y1="24" x2="55" y2="30" stroke={accentColor} strokeWidth="2" />
        <line x1="38" y1="48" x2="55" y2="42" stroke={accentColor} strokeWidth="2" />

        {/* Rear Racing Slick Tires */}
        <rect x="22" y="3" width="30" height="18" rx="3.5" fill="#000000" stroke={accentColor} strokeWidth="1.5" />
        <rect x="22" y="51" width="30" height="18" rx="3.5" fill="#000000" stroke={accentColor} strokeWidth="1.5" />
        {/* Wheel Rims / Hubs */}
        <circle cx="37" cy="12" r="4.5" fill={primaryColor} />
        <circle cx="37" cy="60" r="4.5" fill={primaryColor} />
        <circle cx="37" cy="12" r="2" fill={accentColor} />
        <circle cx="37" cy="60" r="2" fill={accentColor} />

        {/* Underbody Floor */}
        <path d="M 32 25 L 140 25 L 158 31 L 158 41 L 140 47 L 32 47 Z" fill="#000000" stroke={primaryColor} strokeWidth="1" />

        {/* Aerodynamic Sidepods with Radiator Inlets */}
        <path
          d="M 52 19 C 70 17 106 17 118 22 L 124 28 L 52 28 Z"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <path
          d="M 52 53 C 70 55 106 55 118 50 L 124 44 L 52 44 Z"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        {/* Sidepod Louvers */}
        <line x1="75" y1="23" x2="95" y2="23" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="75" y1="49" x2="95" y2="49" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Central Monocoque / Aerodynamic Nose Cone */}
        <path
          d="M 34 29 L 88 27 L 132 29 L 176 33 L 188 36 L 176 39 L 132 43 L 88 45 L 34 43 Z"
          fill={secondaryColor}
          stroke={accentColor}
          strokeWidth="1.2"
        />
        {/* Racing Center Livery Stripe */}
        <path d="M 42 34.5 L 178 34.5 L 178 37.5 L 42 37.5 Z" fill={primaryColor} />

        {/* Cockpit Opening */}
        <ellipse cx="102" cy="36" rx="15" ry="7" fill="#000000" stroke={primaryColor} strokeWidth="1" />
        {/* Driver Helmet */}
        <circle cx="98" cy="36" r="4.2" fill={accentColor} />
        <path d="M 98 33.5 L 102 35 L 102 37 L 98 38.5 Z" fill={primaryColor} />
        {/* Halo Protection Safety Structure */}
        <path
          d="M 92 36 L 108 33 M 92 36 L 108 39 M 92 36 L 114 36"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Engine Airbox & Camera Pod */}
        <ellipse cx="80" cy="36" rx="4" ry="2.2" fill="#000000" stroke={primaryColor} strokeWidth="1.5" />

        {/* Front Suspension Wishbones */}
        <line x1="140" y1="31" x2="154" y2="20" stroke={accentColor} strokeWidth="2" />
        <line x1="140" y1="41" x2="154" y2="52" stroke={accentColor} strokeWidth="2" />

        {/* Front Racing Slick Tires */}
        <rect x="140" y="6" width="26" height="16" rx="3.5" fill="#000000" stroke={accentColor} strokeWidth="1.5" />
        <rect x="140" y="50" width="26" height="16" rx="3.5" fill="#000000" stroke={accentColor} strokeWidth="1.5" />
        {/* Front Wheel Hubs */}
        <circle cx="153" cy="14" r="4" fill={primaryColor} />
        <circle cx="153" cy="58" r="4" fill={primaryColor} />
        <circle cx="153" cy="14" r="1.8" fill={accentColor} />
        <circle cx="153" cy="58" r="1.8" fill={accentColor} />

        {/* Front Wing Cascade & Endplates */}
        <path
          d="M 172 10 L 196 15 L 196 57 L 172 62 L 172 56 L 192 52 L 192 20 L 172 16 Z"
          fill={secondaryColor}
          stroke={primaryColor}
          strokeWidth="1.5"
        />
        {/* Nose Tip Over Front Wing */}
        <polygon points="188,36 200,36 197,33.5 197,38.5" fill={primaryColor} />
        {/* Front Wing Flap Details */}
        <rect x="170" y="8" width="20" height="3" rx="1" fill={primaryColor} />
        <rect x="170" y="61" width="20" height="3" rx="1" fill={primaryColor} />
      </g>
    </svg>
  );
}

// ----------------------------------------------------------------------------
// 3. F1 CAR STORM INTRO WITH EXACT MOTORSPORT PALETTE
// ----------------------------------------------------------------------------
interface CarConfig {
  id: string;
  primary: string;
  secondary: string;
  accent: string;
  scale: number;
  gapBefore: number;
}

interface StormRowData {
  row: number;
  direction: 'l' | 'r';
  cars: CarConfig[];
  speedDuration: number;
  driveDelay: number;
  shutterDelay: number;
}

const CAR_COLOR_PRESETS = [
  { primary: '#FF0000', secondary: '#000000', accent: '#FFFFFF' }, // Scuderia Red
  { primary: '#000000', secondary: '#FF0000', accent: '#FFFFFF' }, // Stealth Black
  { primary: '#FF5F1F', secondary: '#000000', accent: '#FFFFFF' }, // Apex Neon Orange
  { primary: '#FFFFFF', secondary: '#000000', accent: '#FF0000' }, // Monoposto White
];

function generateCarStormRows(): StormRowData[] {
  return Array.from({ length: 7 }, (_, rowIndex) => {
    const direction: 'l' | 'r' = rowIndex % 2 === 0 ? 'l' : 'r';

    const cars: CarConfig[] = Array.from({ length: 6 }, (__, carIndex) => {
      const palette = CAR_COLOR_PRESETS[(rowIndex * 3 + carIndex * 2) % CAR_COLOR_PRESETS.length];
      const scale = 0.92 + ((rowIndex * 7 + carIndex * 13) % 5) * 0.05;
      const gapBefore = 60 + ((rowIndex * 11 + carIndex * 17) % 7) * 20;
      return {
        id: `r${rowIndex}-c${carIndex}`,
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        scale,
        gapBefore,
      };
    });

    const speedDuration = 3.8 + (rowIndex % 3) * 0.35;
    const driveDelay = rowIndex * 0.04;
    const shutterDelay = 1.35 + rowIndex * 0.06;

    return {
      row: rowIndex,
      direction,
      cars,
      speedDuration,
      driveDelay,
      shutterDelay,
    };
  });
}

// ----------------------------------------------------------------------------
// 4. BARLOW CONDENSED EXTRABOLD (800) POSTER LAYOUT & GEOMETRY
// ----------------------------------------------------------------------------
const LETTER_HEIGHT = 230;
const ROW_GAP = 24;
const GIANT_LETTER_HEIGHT = LETTER_HEIGHT * 2 + ROW_GAP; // 484px
const TOP_MARGIN = 108;
const POSTER_VIEWBOX_HEIGHT = 700;

// Proportional character widths for Barlow Condensed ExtraBold (800)
const BARLOW_WIDTHS: Record<string, number> = {
  W: 165,
  H: 125,
  E: 110,
  P: 115,
  A: 122,
  R: 124,
  T: 115,
  O: 126,
};

const GIANT_BARLOW_WIDTHS: Record<string, number> = {
  R: 240,
  T: 230,
};

const LETTER_SPACING = 28;

export interface PosterCell {
  ch: string;
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  giant: boolean;
  id: string;
}

export interface PosterLayoutData {
  cells: PosterCell[];
  road: {
    left: number;
    right: number;
    width: number;
    centerX: number;
  };
  width: number;
  height: number;
}

export function computeWhereToParthLayout(): PosterLayoutData {
  const margin = 70;

  // Left Section Typography:
  // Top Row: W, H, E
  const leftRow0 = ['W', 'H', 'E'];
  let row0Width = 0;
  leftRow0.forEach((ch, idx) => {
    row0Width += (BARLOW_WIDTHS[ch] ?? 120) + (idx > 0 ? LETTER_SPACING : 0);
  });

  // Bottom Row: P, A
  const leftRow1 = ['P', 'A'];
  let row1Width = 0;
  leftRow1.forEach((ch, idx) => {
    row1Width += (BARLOW_WIDTHS[ch] ?? 120) + (idx > 0 ? LETTER_SPACING : 0);
  });

  const leftMaxW = Math.max(row0Width, row1Width);
  const cells: PosterCell[] = [];

  // Place Row 0 (W, H, E)
  let curX = margin;
  leftRow0.forEach((ch) => {
    const w = BARLOW_WIDTHS[ch] ?? 120;
    cells.push({
      ch,
      x: curX,
      y: TOP_MARGIN,
      w,
      h: LETTER_HEIGHT,
      row: 0,
      giant: false,
      id: `LEFT_R0_${ch}`,
    });
    curX += w + LETTER_SPACING;
  });

  // Place Row 1 (P, A) right-aligned against the Shared Giant R
  curX = margin + (leftMaxW - row1Width);
  leftRow1.forEach((ch) => {
    const w = BARLOW_WIDTHS[ch] ?? 120;
    cells.push({
      ch,
      x: curX,
      y: TOP_MARGIN + LETTER_HEIGHT + ROW_GAP,
      w,
      h: LETTER_HEIGHT,
      row: 1,
      giant: false,
      id: `LEFT_R1_${ch}`,
    });
    curX += w + LETTER_SPACING;
  });

  // Shared Giant R spanning both rows (final column of left section)
  const giantRX = margin + leftMaxW + LETTER_SPACING;
  const giantRW = GIANT_BARLOW_WIDTHS['R'];
  const giantR: PosterCell = {
    ch: 'R',
    x: giantRX,
    y: TOP_MARGIN,
    w: giantRW,
    h: GIANT_LETTER_HEIGHT,
    row: 0,
    giant: true,
    id: 'SHARED_GIANT_R',
  };
  cells.push(giantR);

  // Central Winding Road Corridor (between Shared R and Shared T)
  const roadLeft = giantRX + giantRW;
  const roadCorridorWidth = 420;
  const roadRight = roadLeft + roadCorridorWidth;

  // Right Section Typography:
  // Shared Giant T spanning both rows (first column of right section)
  const giantTW = GIANT_BARLOW_WIDTHS['T'];
  const giantT: PosterCell = {
    ch: 'T',
    x: roadRight,
    y: TOP_MARGIN,
    w: giantTW,
    h: GIANT_LETTER_HEIGHT,
    row: 0,
    giant: true,
    id: 'SHARED_GIANT_T',
  };
  cells.push(giantT);

  // Right Row 0: O
  const rightTextX = roadRight + giantTW + LETTER_SPACING;
  const oW = BARLOW_WIDTHS['O'] ?? 126;
  cells.push({
    ch: 'O',
    x: rightTextX,
    y: TOP_MARGIN,
    w: oW,
    h: LETTER_HEIGHT,
    row: 0,
    giant: false,
    id: 'RIGHT_R0_O',
  });

  // Right Row 1: H
  const hW = BARLOW_WIDTHS['H'] ?? 125;
  cells.push({
    ch: 'H',
    x: rightTextX,
    y: TOP_MARGIN + LETTER_HEIGHT + ROW_GAP,
    w: hW,
    h: LETTER_HEIGHT,
    row: 1,
    giant: false,
    id: 'RIGHT_R1_H',
  });

  const totalWidth = rightTextX + Math.max(oW, hW) + margin;

  return {
    cells,
    road: {
      left: roadLeft,
      right: roadRight,
      width: roadCorridorWidth,
      centerX: (roadLeft + roadRight) / 2,
    },
    width: totalWidth,
    height: POSTER_VIEWBOX_HEIGHT,
  };
}

// ----------------------------------------------------------------------------
// 5. CENTRAL WINDING ROAD AND NAVIC GPS TRACKER
// Continuous full-height motorsport circuit from top viewport boundary to bottom.
// Solid black road surface with clear white edge markings (#FFFFFF).
// Broken white centre line (#FFFFFF).
// Red (#FF0000) and Neon-Orange (#FF5F1F) kerb accents.
// Red GPS tracker (#FF0000) traveling continuously along the circuit.
// ----------------------------------------------------------------------------

export function generateRoadPath(minY: number, maxY: number, centerX = 1004): string {
  // Start slightly above minY and end slightly below maxY to guarantee
  // continuous intersection through the very top and very bottom viewport edges
  const startY = minY - 12;
  const endY = maxY + 12;
  const effectiveH = endY - startY;

  // Point 0: Top entrance (perfect vertical entry at top boundary)
  const p0 = { x: centerX, y: startY };

  // Segment 1: from top to upper-right curve (peaks around x = centerX + 56 = 1060)
  const p1 = { x: centerX + 56, y: startY + 0.26 * effectiveH };
  const c1a = { x: centerX, y: startY + 0.10 * effectiveH };
  const c1b = { x: centerX + 56, y: startY + 0.16 * effectiveH };

  // Segment 2: sweeping left through the central chicane (peaks around x = centerX - 60 = 944)
  const p2 = { x: centerX - 60, y: startY + 0.58 * effectiveH };
  const c2a = { x: centerX + 56, y: startY + 0.38 * effectiveH };
  const c2b = { x: centerX - 60, y: startY + 0.46 * effectiveH };

  // Segment 3: sweeping right back across center (peaks around x = centerX + 42 = 1046)
  const p3 = { x: centerX + 42, y: startY + 0.82 * effectiveH };
  const c3a = { x: centerX - 60, y: startY + 0.68 * effectiveH };
  const c3b = { x: centerX + 42, y: startY + 0.74 * effectiveH };

  // Segment 4: straightens into vertical exit at bottom boundary
  const p4 = { x: centerX, y: endY };
  const c4a = { x: centerX + 42, y: startY + 0.90 * effectiveH };
  const c4b = { x: centerX, y: startY + 0.95 * effectiveH };

  return [
    `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`,
    `C ${c1a.x.toFixed(1)} ${c1a.y.toFixed(1)}, ${c1b.x.toFixed(1)} ${c1b.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `C ${c2a.x.toFixed(1)} ${c2a.y.toFixed(1)}, ${c2b.x.toFixed(1)} ${c2b.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `C ${c3a.x.toFixed(1)} ${c3a.y.toFixed(1)}, ${c3b.x.toFixed(1)} ${c3b.y.toFixed(1)}, ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `C ${c4a.x.toFixed(1)} ${c4a.y.toFixed(1)}, ${c4b.x.toFixed(1)} ${c4b.y.toFixed(1)}, ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
  ].join(' ');
}

export const ROAD_SVG_PATH = generateRoadPath(-119.1, 819.1, 1004);

interface CentralRoadProps {
  roadPathD?: string;
  isIntro?: boolean;
  onTrackerComplete?: () => void;
}

export function CentralRoadAndTracker({
  roadPathD = ROAD_SVG_PATH,
  isIntro = false,
  onTrackerComplete,
}: CentralRoadProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [trackerPos, setTrackerPos] = useState({ x: 1004, y: -130, angle: 90 });
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const path = pathRef.current;
    if (!path) return;

    let pathLength = 0;
    try {
      pathLength = path.getTotalLength();
    } catch {
      pathLength = 1200;
    }

    // Set initial position at the very top entrance of the road
    try {
      const pStart = path.getPointAtLength(0);
      const pNext = path.getPointAtLength(Math.min(pathLength, 3));
      const initAngle = Math.atan2(pNext.y - pStart.y, pNext.x - pStart.x) * (180 / Math.PI);
      setTrackerPos({ x: pStart.x, y: pStart.y, angle: initAngle });
    } catch {
      // Fallback
    }

    // Full journey duration from top to bottom
    const tripDurationMs = 8000;
    const startDelayMs = isIntro ? 1800 : 350;

    const animateTracker = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < startDelayMs) {
        animId = requestAnimationFrame(animateTracker);
        return;
      }

      const activeElapsed = elapsed - startDelayMs;
      const progress = Math.min(1, Math.max(0, activeElapsed / tripDurationMs));
      const currentDist = progress * pathLength;

      try {
        const pt = path.getPointAtLength(currentDist);
        const delta = Math.min(pathLength, currentDist + 2);
        const ptNext = path.getPointAtLength(delta);
        const angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * (180 / Math.PI);

        setTrackerPos({ x: pt.x, y: pt.y, angle });

        if (progress >= 1.0) {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            if (onTrackerComplete) {
              onTrackerComplete();
            }
          }
          return;
        }
      } catch {
        // Fallback safety
      }

      animId = requestAnimationFrame(animateTracker);
    };

    animId = requestAnimationFrame(animateTracker);
    return () => cancelAnimationFrame(animId);
  }, [roadPathD, isIntro, onTrackerComplete]);

  return (
    <g className="wpl-central-road" aria-label="Central Circuit and NavIC Vehicle Tracker">
      {/* 1. Underlying Solid Black Track Base */}
      <path
        d={roadPathD}
        fill="none"
        stroke="#000000"
        strokeWidth="96"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />

      {/* 2. Outer Motorsport Kerbs: Alternating Red (#FF0000) and Neon-Orange (#FF5F1F) */}
      <path
        d={roadPathD}
        fill="none"
        stroke="#FF0000"
        strokeWidth="92"
        strokeLinecap="butt"
        strokeDasharray="24 24"
      />
      <path
        d={roadPathD}
        fill="none"
        stroke="#FF5F1F"
        strokeWidth="92"
        strokeLinecap="butt"
        strokeDasharray="24 24"
        strokeDashoffset="24"
      />

      {/* 3. Solid White Outer Road Markings */}
      <path
        d={roadPathD}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="78"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />

      {/* 4. Solid Black Road Surface */}
      <path
        d={roadPathD}
        fill="none"
        stroke="#000000"
        strokeWidth="72"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />

      {/* 5. Precision Broken White Centre Line */}
      <path
        ref={pathRef}
        d={roadPathD}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeDasharray="18 20"
        strokeLinecap="butt"
      />

      {/* 6. Red NavIC GPS Tracker (#FF0000) with Restrained Orange Glow (#FF5F1F) */}
      <g
        transform={`translate(${trackerPos.x}, ${trackerPos.y})`}
        style={{ pointerEvents: 'none' }}
      >
        {/* Restrained Neon Orange Outer Glow Rings */}
        <circle cx="0" cy="0" r="26" fill="none" stroke="#FF5F1F" strokeWidth="1" className="wpl-tracker-pulse-wide" />
        <circle cx="0" cy="0" r="14" fill="none" stroke="#FF5F1F" strokeWidth="2" className="wpl-tracker-pulse" />
        {/* Precision Red Reticle Ring */}
        <circle cx="0" cy="0" r="8" stroke="#FF0000" strokeWidth="2" fill="none" />
        {/* Core Red NavIC Tracking Dot with White Center */}
        <circle cx="0" cy="0" r="5" fill="#FF0000" />
        <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />

        {/* Direction Heading Pointer (#FF5F1F Neon Orange) */}
        <g transform={`rotate(${trackerPos.angle})`}>
          <polygon points="12,0 7,-3.5 7,3.5" fill="#FF5F1F" />
        </g>

        {/* Satellite Telemetry Tag (#000000 background, #FF0000 border, #FFFFFF text) */}
        <g transform="translate(18, -12)">
          <rect x="0" y="0" width="76" height="18" rx="2" fill="#000000" stroke="#FF0000" strokeWidth="1.5" />
          <text
            x="38"
            y="12.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.5"
            fontFamily="'Rajdhani', 'Orbitron', monospace"
            fontWeight="700"
            letterSpacing="0.8px"
          >
            NAVIC // L5 LOCK
          </text>
        </g>
      </g>
    </g>
  );
}

// ----------------------------------------------------------------------------
// 6. LETTER CELL WITH VERTICAL ROLLING SHUFFLE (INTRO & HOVER)
// ----------------------------------------------------------------------------
const SEED_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface LetterCellProps {
  cell: PosterCell;
  index: number;
  rollCount: number;
  isIntro: boolean;
  delay: number;
  color?: string;
  onHover?: () => void;
}

export function LetterCell({
  cell,
  index,
  rollCount,
  isIntro,
  delay,
  color = '#FF0000',
  onHover,
}: LetterCellProps) {
  const reelHeight = cell.h + 24;
  const isGiant = cell.giant;
  const shouldRoll = isIntro || rollCount > 0;
  const reelCount = rollCount > 0 ? 7 : isGiant ? 14 : 10;
  const fontSize = isGiant ? 510 : 252;

  // Intermediate alphabet sequence for mechanical slot-reel shuffling
  const intermediateLetters = useMemo(() => {
    const list: string[] = [];
    for (let step = 1; step < reelCount; step++) {
      const charIndex = Math.floor(
        pseudoRandom(index * 131 + rollCount * 977 + step * 53) * 26
      );
      list.push(SEED_ALPHABET[charIndex] || 'A');
    }
    return list;
  }, [index, rollCount, reelCount]);

  const animStyle = {
    '--dist': `${(reelCount - 1) * reelHeight}px`,
    '--delay': `${rollCount > 0 ? 0 : delay}s`,
    '--dur': rollCount > 0 ? '0.75s' : isGiant ? '1.1s' : '0.95s',
  } as React.CSSProperties;

  return (
    <g
      className={`wpl-cell ${isGiant ? 'wpl-giant' : ''}`}
      transform={`translate(${cell.x}, ${cell.y})`}
      onPointerEnter={onHover}
      style={{ cursor: 'pointer' }}
    >
      {/* Invisible hit-test area covering the entire letter cell */}
      <rect
        x={0}
        y={0}
        width={cell.w}
        height={cell.h}
        fill="transparent"
        pointerEvents="all"
      />

      {/* Clipped viewing aperture for vertical slot reel */}
      <svg
        x={0}
        y={0}
        width={cell.w}
        height={cell.h}
        viewBox={`0 0 ${cell.w} ${cell.h}`}
        overflow="hidden"
      >
        <g
          key={`${isIntro ? 'intro' : 'idle'}-${rollCount}`}
          className={`wpl-reel ${shouldRoll ? 'is-rolling' : ''}`}
          style={animStyle}
        >
          {/* Destination character in Bold Red (#FF0000) */}
          <text
            x={cell.w / 2}
            y={cell.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontFamily="'Barlow Condensed', 'Impact', 'Arial Narrow', sans-serif"
            fontWeight="800"
            fill={color}
            letterSpacing="-0.02em"
          >
            {cell.ch}
          </text>

          {/* Intermediate characters in vertical reel */}
          {intermediateLetters.map((ch, step) => (
            <text
              key={step}
              x={cell.w / 2}
              y={cell.h / 2 - (step + 1) * reelHeight}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontFamily="'Barlow Condensed', 'Impact', 'Arial Narrow', sans-serif"
              fontWeight="800"
              fill={step % 2 === 0 ? color : '#FF5F1F'}
              letterSpacing="-0.02em"
            >
              {ch}
            </text>
          ))}
        </g>
      </svg>
    </g>
  );
}

// ----------------------------------------------------------------------------
// 7. MAIN WAVING PORTFOLIO LANDING COMPONENT
// ----------------------------------------------------------------------------
export interface WavingPortfolioLandingProps {
  primaryRed?: string;
  neonOrange?: string;
  paperColor?: string;
  inkColor?: string;
  intro?: boolean;
  height?: string;
  className?: string;
  onProceed?: () => void;
}

export default function WavingPortfolioLanding({
  primaryRed = '#FF0000',
  neonOrange = '#FF5F1F',
  paperColor = '#000000',
  inkColor = '#FF0000',
  intro = true,
  height = '100svh',
  className = '',
  onProceed,
}: WavingPortfolioLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeoutsRef = useRef<number[]>([]);
  const lastRollTimeRef = useRef<number[]>([]);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [introDone, setIntroDone] = useState(!intro);
  const [rolls, setRolls] = useState<number[]>([]);

  const later = useCallback((callback: () => void, ms: number) => {
    const t = window.setTimeout(callback, ms);
    timeoutsRef.current.push(t);
    return t;
  }, []);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
          return;
        }
      }
      if (typeof window !== 'undefined') {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Listen for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = () => setReducedMotion(mq.matches);
    handleMotion();
    mq.addEventListener('change', handleMotion);
    return () => {
      mq.removeEventListener('change', handleMotion);
      timeoutsRef.current.forEach(clearTimeout);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Intro Sequence Timeline
  useEffect(() => {
    if (!intro || reducedMotion) {
      setIntroDone(true);
      return;
    }
    setIntroDone(false);

    // Car storm runs from 0.0s to 1.8s
    // Shutter curtain slices close between 1.35s and 1.80s
    // Letter vertical rolling shuffle starts at 1.85s and settles by 3.2s
    // Intro marks completed at 3.6s, making hover interactive
    const tFinish = later(() => setIntroDone(true), 3600);
    return () => {
      clearTimeout(tFinish);
    };
  }, [intro, reducedMotion, later]);

  // Compute exact typographic layout
  const posterLayout = useMemo(() => computeWhereToParthLayout(), []);

  // Compute exact viewport geometry so SVG and central circuit fit 100% full-height
  const viewGeometry = useMemo(() => {
    const CONTENT_W = posterLayout.width; // 1668
    const CONTENT_H = 700;
    const TYPO_CENTER_Y = 350;
    const TYPO_CENTER_X = CONTENT_W / 2;

    const containerAspect = dimensions.width / Math.max(1, dimensions.height);
    const contentAspect = CONTENT_W / CONTENT_H;

    let viewW: number, viewH: number, minX: number, minY: number;

    if (containerAspect >= contentAspect) {
      viewH = CONTENT_H;
      viewW = CONTENT_H * containerAspect;
      minY = 0;
      minX = TYPO_CENTER_X - viewW / 2;
    } else {
      viewW = CONTENT_W;
      viewH = CONTENT_W / containerAspect;
      minX = 0;
      minY = TYPO_CENTER_Y - viewH / 2;
    }

    const maxY = minY + viewH;
    return { minX, minY, viewW, viewH, maxY };
  }, [dimensions, posterLayout.width]);

  const roadPathD = useMemo(
    () => generateRoadPath(viewGeometry.minY, viewGeometry.maxY, posterLayout.road.centerX),
    [viewGeometry.minY, viewGeometry.maxY, posterLayout.road.centerX]
  );

  // Precompute F1 Car Storm lanes and choreography
  const stormRows = useMemo(() => generateCarStormRows(), []);

  // Subtle interactive mouse parallax
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || e.pointerType === 'touch') return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        const root = containerRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((clientY - rect.top) / rect.height) * 2 - 1;

        root.style.setProperty('--wpl-mx', normX.toFixed(3));
        root.style.setProperty('--wpl-my', normY.toFixed(3));
      });
    },
    [reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    const root = containerRef.current;
    if (root) {
      root.style.setProperty('--wpl-mx', '0');
      root.style.setProperty('--wpl-my', '0');
    }
  }, []);

  // Interactive vertical letter shuffle on hover
  const reroll = useCallback(
    (index: number) => {
      if (reducedMotion) return;
      const now = performance.now();
      if (now - (lastRollTimeRef.current[index] ?? 0) < 750) return;
      lastRollTimeRef.current[index] = now;
      setRolls((prev) => {
        const next = [...prev];
        next[index] = (next[index] ?? 0) + 1;
        return next;
      });
    },
    [reducedMotion]
  );

  // Optional keyboard interaction to proceed
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (onProceed) onProceed();
      }
    },
    [onProceed]
  );

  const introState = intro ? (introDone ? 'done' : 'on') : 'off';

  return (
    <div
      ref={containerRef}
      className={`wpl-root ${className}`}
      data-intro={introState}
      style={{
        '--wpl-paper': paperColor,
        '--wpl-ink': inkColor,
        '--wpl-accent': primaryRed,
        '--wpl-secondary': neonOrange,
        height,
      } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onProceed}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="banner"
      aria-label="WHERE TO PARTH Landing Poster"
    >
      {/* Screen Reader Semantic Header */}
      <h1 className="wpl-sr">WHERE TO PARTH — Lane-Level Navigation</h1>
      <p className="wpl-sr">Top row: WHERE TO. Bottom row: PAR TH. Shared R and shared T.</p>

      {/* Main Poster Stage (Solid Black #000000 with Bold Red #FF0000 Typography) */}
      <div className="wpl-stage">
        <svg
          className="wpl-poster"
          viewBox={`${viewGeometry.minX} ${viewGeometry.minY} ${viewGeometry.viewW} ${viewGeometry.viewH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 1. CENTRAL WINDING ROAD AND NAVIC GPS TRACKER */}
          <CentralRoadAndTracker
            roadPathD={roadPathD}
            isIntro={!introDone}
            onTrackerComplete={onProceed}
          />

          {/* 2. WHERE TO PARTH EDITORIAL TYPOGRAPHY */}
          <g className="wpl-par-letters" aria-hidden="true">
            {posterLayout.cells.map((cell, idx) => (
              <LetterCell
                key={cell.id}
                cell={cell}
                index={idx}
                rollCount={rolls[idx] ?? 0}
                isIntro={intro && !introDone}
                delay={
                  cell.giant
                    ? 2.15
                    : 1.85 + (cell.x / posterLayout.width) * 0.45 + cell.row * 0.1
                }
                color={inkColor}
                onHover={() => reroll(idx)}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* 3. DENSE F1 RACING CAR STORM INTRO WITH SHUTTER TRANSITION */}
      {intro && !introDone && (
        <div className="wpl-storm" aria-hidden="true">
          {stormRows.map((row) => (
            <div
              key={row.row}
              className="wpl-srow"
              data-dir={row.direction}
              style={{
                animationDelay: `${row.driveDelay}s, ${row.shutterDelay}s`,
              }}
            >
              <div
                className="wpl-car-lane"
                data-dir={row.direction}
                style={{
                  animationDuration: `${row.speedDuration}s`,
                  animationDelay: `${row.driveDelay}s`,
                }}
              >
                {row.cars.map((car) => (
                  <div
                    key={car.id}
                    className="wpl-car-item"
                    style={{
                      marginRight: row.direction === 'l' ? `${car.gapBefore}px` : undefined,
                      marginLeft: row.direction === 'r' ? `${car.gapBefore}px` : undefined,
                      transform: `scale(${car.scale})`,
                    }}
                  >
                    <F1RacingCar
                      primaryColor={car.primary}
                      secondaryColor={car.secondary}
                      accentColor={car.accent}
                      facing={row.direction === 'l' ? 'left' : 'right'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Component Stylesheet */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800&display=swap');

        .wpl-root {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #000000;
          color: #FF0000;
          container-type: size;
          isolation: isolate;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .wpl-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        .wpl-stage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
        }

        .wpl-poster {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          max-width: none;
          overflow: visible;
          z-index: 2;
        }

        /* Subtle interactive mouse parallax on letters */
        .wpl-par-letters {
          transform: translate(calc(var(--wpl-mx, 0) * -12px), calc(var(--wpl-my, 0) * -6px));
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .wpl-cell {
          cursor: pointer;
        }

        /* Vertical mechanical slot-reel rolling animation */
        .wpl-reel.is-rolling {
          animation: wpl-roll var(--dur, 0.95s) var(--delay, 0s) both;
          will-change: transform;
        }

        @keyframes wpl-roll {
          0% {
            transform: translateY(var(--dist));
            opacity: 0;
            animation-timing-function: cubic-bezier(0.5, 0, 0.25, 1);
          }
          6% {
            opacity: 1;
          }
          82% {
            transform: translateY(-18px);
            opacity: 1;
            animation-timing-function: cubic-bezier(0.2, 0.9, 0.3, 1);
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
          }
        }

        /* Poster settle thump */
        @keyframes wpl-thump {
          0% {
            transform: none;
          }
          30% {
            transform: translateY(6px) scale(1.01);
          }
          60% {
            transform: translateY(-2px);
          }
          100% {
            transform: none;
          }
        }

        .wpl-root[data-intro="on"] .wpl-poster {
          animation: wpl-thump 0.5s 2.3s both;
        }

        /* NavIC Tracker Beacon Pulses (Strict Neon Orange #FF5F1F) */
        @keyframes navicPulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 1;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.4;
          }
        }

        @keyframes navicPulseWide {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.2;
          }
        }

        .wpl-tracker-pulse {
          animation: navicPulse 1.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .wpl-tracker-pulse-wide {
          animation: navicPulseWide 2.4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        /* F1 Racing Car Storm Layer */
        .wpl-storm {
          position: absolute;
          inset: -25% -20%;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          gap: 1.8cqh;
          transform: rotate(-8deg);
          pointer-events: none;
          z-index: 20;
        }

        /* Shutter/Curtain Slice Transition on each car row */
        .wpl-srow {
          height: 14cqh;
          flex: none;
          overflow: visible;
          display: flex;
          align-items: center;
          animation: wpl-row-in 0.6s cubic-bezier(0.2, 0.9, 0.2, 1) both,
                     wpl-shutter 0.45s cubic-bezier(0.7, 0, 0.3, 1) forwards;
          transform-origin: center;
        }

        .wpl-srow[data-dir="r"] {
          animation-name: wpl-row-in-r, wpl-shutter;
        }

        .wpl-car-lane {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
          animation-fill-mode: forwards;
        }

        /* Direction 1: Top-Right to Bottom-Left (Car facing Left) */
        .wpl-car-lane[data-dir="l"] {
          animation-name: wpl-drive-left;
        }

        /* Direction 2: Bottom-Left to Top-Right (Car facing Right) */
        .wpl-car-lane[data-dir="r"] {
          animation-name: wpl-drive-right;
        }

        .wpl-car-item {
          flex: none;
          width: 170px;
          height: 60px;
        }

        /* Single-pass smooth racing animations */
        @keyframes wpl-drive-left {
          0% {
            transform: translateX(120vw);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-160vw);
            opacity: 0;
          }
        }

        @keyframes wpl-drive-right {
          0% {
            transform: translateX(-160vw);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(120vw);
            opacity: 0;
          }
        }

        /* Entrance and Shutter Animations */
        @keyframes wpl-row-in {
          from {
            transform: translateX(35%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes wpl-row-in-r {
          from {
            transform: translateX(-35%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Original 21st.dev Vertical Shutter/Curtain Reveal */
        @keyframes wpl-shutter {
          from {
            transform: scaleY(1);
            opacity: 1;
          }
          to {
            transform: scaleY(0);
            opacity: 0;
          }
        }

        @container (max-aspect-ratio: 9/10) {
          .wpl-poster {
            left: 2%;
            width: 96%;
            top: 8%;
            height: 82%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wpl-root *,
          .wpl-root *::before,
          .wpl-root *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
