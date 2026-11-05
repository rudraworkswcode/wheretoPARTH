import React, { useState, useEffect, useRef } from 'react';
import LeafletMap from './LeafletMap';
import TelemetryHUD from './TelemetryHUD';
import AdvanceAlertBanner from './AdvanceAlertBanner';
import SignalLossBanner from './SignalLossBanner';
import SimulationControls from './SimulationControls';
import TechnicalExplainer from './TechnicalExplainer';
import { ROUTE_LIST } from '../data/routesData';
import {
  generateNoisyPoint,
  calculateBearing,
  haversineDistance,
  estimateDeadReckoning
} from '../utils/geoUtils';
import { HelpCircle } from 'lucide-react';

export default function NavigationDashboard({ selectedRouteId }) {
  const currentRoute = ROUTE_LIST.find(r => r.id === selectedRouteId) || ROUTE_LIST[0];
  const coords = currentRoute.coordinates;

  // Navigation State: manual start required, stopped initially
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Progressive lookahead & observed noisy trace
  const [observedNoisyTrace, setObservedNoisyTrace] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isSignalLost, setIsSignalLost] = useState(false);
  const [deadReckoningData, setDeadReckoningData] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [liveSpeed, setLiveSpeed] = useState(0);

  const LOOKAHEAD_WINDOW = 6;
  const lastStepTimeRef = useRef(Date.now());

  // Reset state when route changes
  useEffect(() => {
    setHasStarted(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setIsFinished(false);
    setActiveAlert(null);
    setIsSignalLost(false);
    setLiveSpeed(0);

    // Initial starting point only
    if (coords && coords.length > 0) {
      const initialNoisy = generateNoisyPoint(coords[0], 0);
      setObservedNoisyTrace([initialNoisy]);
    }
  }, [selectedRouteId, coords]);

  // Handle Manual Start Navigation Trigger
  const handleStartNavigation = () => {
    setHasStarted(true);
    setIsPaused(false);
    setIsFinished(false);
    lastStepTimeRef.current = Date.now();
  };

  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
    lastStepTimeRef.current = Date.now();
  };

  const handleResetNavigation = () => {
    setHasStarted(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setIsFinished(false);
    setActiveAlert(null);
    setIsSignalLost(false);
    setLiveSpeed(0);
    if (coords && coords.length > 0) {
      setObservedNoisyTrace([generateNoisyPoint(coords[0], 0)]);
    }
  };

  // Progressive Animation & Lookahead advancement
  useEffect(() => {
    if (!hasStarted || isPaused || isFinished || !coords.length) return;

    // Realistic navigation pace based on segment distance
    const c1 = coords[currentIndex];
    const c2 = coords[Math.min(currentIndex + 1, coords.length - 1)];
    const segmentMeters = haversineDistance(c1, c2);

    // Target velocity: realistic road speed (30 km/h near turns, 52 km/h cruise)
    const targetSpeedKmh = activeAlert && activeAlert.distanceMeters < 350 ? 30 : 52;
    const targetSpeedMps = (targetSpeedKmh * 1000) / 3600;
    const stepDurationMs = Math.max(400, Math.min(2200, Math.round((segmentMeters / targetSpeedMps) * 1000)));

    const timer = setTimeout(() => {
      const now = Date.now();
      const elapsedSec = (now - lastStepTimeRef.current) / 1000;
      lastStepTimeRef.current = now;

      // Real velocity derived from actual coordinate displacement and elapsed time
      const actualKmh = elapsedSec > 0 ? Math.round((segmentMeters / elapsedSec) * 3.6) : targetSpeedKmh;
      // Hard limit velocity to maximum 120 km/h
      const cappedKmh = Math.min(120, Math.max(0, actualKmh));
      setLiveSpeed(cappedKmh);

      setCurrentIndex(prev => {
        const nextIdx = prev + 1;
        if (nextIdx >= coords.length - 1) {
          setIsFinished(true);
          setLiveSpeed(0);
          return coords.length - 1;
        }

        // Generate and append new coordinates progressively as vehicle approaches
        const lookaheadTarget = Math.min(coords.length - 1, nextIdx + LOOKAHEAD_WINDOW);
        setObservedNoisyTrace(currentObserved => {
          const nextTrace = [...currentObserved];
          for (let i = currentObserved.length; i <= lookaheadTarget; i++) {
            nextTrace.push(generateNoisyPoint(coords[i], i));
          }
          return nextTrace;
        });

        return nextIdx;
      });
    }, stepDurationMs);

    return () => clearTimeout(timer);
  }, [hasStarted, isPaused, currentIndex, isFinished, coords, activeAlert]);

  // Current Coordinates & Heading
  const currentCoord = coords[currentIndex] || coords[0];
  const nextCoord = coords[Math.min(currentIndex + 1, coords.length - 1)];
  const bearing = calculateBearing(currentCoord, nextCoord);

  // Monitor Maneuvers for 1 km Advance Alert
  useEffect(() => {
    if (!currentRoute.maneuvers || currentRoute.maneuvers.length === 0) {
      setActiveAlert(null);
      return;
    }

    const upcoming = currentRoute.maneuvers.find(m => m.index > currentIndex && m.turnType !== 'destination');

    if (upcoming) {
      let distMeters = 0;
      for (let i = currentIndex; i < upcoming.index; i++) {
        distMeters += haversineDistance(coords[i], coords[i + 1]);
      }
      distMeters = Math.round(distMeters);

      if (distMeters <= 1000) {
        setActiveAlert({
          maneuver: upcoming,
          distanceMeters: distMeters
        });
      } else {
        setActiveAlert(null);
      }
    } else {
      setActiveAlert(null);
    }
  }, [currentIndex, currentRoute, coords]);

  // Error Metrics
  const currentNoisyPoint = observedNoisyTrace[currentIndex];
  const rawError = currentNoisyPoint ? currentNoisyPoint.errorMeters : 6.0;
  const correctedError = Number((rawError * 0.12).toFixed(1));
  const errorReduction = Math.round(((rawError - correctedError) / rawError) * 100);

  // Progress metrics
  const progressPercent = Math.round((currentIndex / (coords.length - 1)) * 100);
  const distCoveredKm = Number(((currentRoute.totalDistanceKm * progressPercent) / 100).toFixed(2));
  const distRemainingKm = Number((currentRoute.totalDistanceKm - distCoveredKm).toFixed(2));
  const etaMin = Math.max(0, Math.round((distRemainingKm / (liveSpeed || 45)) * 60));

  const displayedSpeed = isPaused ? 0 : hasStarted ? Math.min(120, liveSpeed || 48) : 0;

  return (
    <div style={{
      maxWidth: '1380px',
      margin: '0 auto',
      padding: '16px 20px 24px 20px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Top Header Row with Route info on Left, START/STOP Navigation on Extreme Right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '12px'
      }}>
        {/* Left: Sector / Route Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="font-orbitron" style={{ fontSize: '11px', color: 'var(--parth-red)', letterSpacing: '1px' }}>
            NAVIGATION COCKPIT //
          </span>
          <span className="font-rajdhani" style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
            {currentRoute.from} → {currentRoute.to}
          </span>
        </div>

        {/* Right: Controls placed upfront on extreme right so no scrolling is needed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SimulationControls
            hasStarted={hasStarted}
            isPaused={isPaused}
            onStartNavigation={handleStartNavigation}
            onTogglePause={handleTogglePause}
            onReset={handleResetNavigation}
          />

          <button
            onClick={() => setShowExplainer(true)}
            className="f1-btn-outline"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            <HelpCircle size={13} color="var(--parth-neon-orange)" />
            <span>CRITERIA</span>
          </button>
        </div>
      </div>

      {/* Signal Loss Dead Reckoning Banner */}
      <SignalLossBanner isSignalLost={isSignalLost} deadReckoningData={deadReckoningData} />

      {/* 1 KM Advance Maneuver Notification Banner */}
      <div style={{ marginBottom: '10px' }}>
        <AdvanceAlertBanner activeAlert={activeAlert} />
      </div>

      {/* Single Line Compact Cockpit Telemetry HUD */}
      <TelemetryHUD
        speedKmh={displayedSpeed}
        bearing={bearing}
        errorMetrics={{
          rawErrorMeters: Number(rawError.toFixed(1)),
          correctedErrorMeters: correctedError,
          reductionPercent: errorReduction
        }}
        progressPercent={progressPercent}
        distanceCoveredKm={distCoveredKm}
        distanceRemainingKm={distRemainingKm}
        etaMinutes={etaMin}
      />

      {/* Arrival Destination Banner */}
      {isFinished && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 95, 31, 0.25) 0%, #161920 100%)',
          border: '2px solid var(--parth-neon-orange)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div className="font-orbitron" style={{ fontSize: '14px', fontWeight: 900, color: 'var(--parth-neon-orange)' }}>
              DESTINATION REACHED
            </div>
            <div className="font-rajdhani" style={{ fontSize: '13px', color: '#FFF' }}>
              Vehicle successfully navigated {currentRoute.totalDistanceKm} km to {currentRoute.to}.
            </div>
          </div>
        </div>
      )}

      {/* Dark Styled Leaflet Map */}
      <div style={{ height: 'calc(100vh - 280px)', minHeight: '440px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
        <LeafletMap
          route={currentRoute}
          noisyTrace={observedNoisyTrace}
          matchedTrace={currentRoute.coordinates}
          currentCoord={currentCoord}
          currentBearing={bearing}
          activeAlertManeuver={activeAlert?.maneuver}
        />
      </div>

      {/* Technical Criteria Modal */}
      <TechnicalExplainer isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
    </div>
  );
}
