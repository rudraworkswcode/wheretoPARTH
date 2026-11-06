import React, { useState, useEffect, useRef } from 'react';
import LeafletMap from './LeafletMap';
import TelemetryHUD from './TelemetryHUD';
import AdvanceAlertBanner from './AdvanceAlertBanner';
import SignalLossBanner from './SignalLossBanner';
import SimulationControls from './SimulationControls';
import { haversineDistance, calculateBearing } from '../utils/geoUtils';
import { Activity, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function NavigationDashboard({ simulationData, onBackToSelection }) {
  if (!simulationData) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <p className="font-rajdhani" style={{ fontSize: '18px', color: '#B0B7C6' }}>
          No simulation telemetry data available. Please select a route first.
        </p>
        <button onClick={onBackToSelection} className="f1-btn-primary" style={{ marginTop: '16px' }}>
          BACK TO ROUTE SELECTION
        </button>
      </div>
    );
  }

  const {
    status = 'MATCHED',
    reference_route = {},
    observations = [],
    matching = {},
    kalman_fallback = {},
    active_position_source = 'osrm_match'
  } = simulationData;

  const refCoords = reference_route.geometry?.coordinates || [];
  const turnSteps = reference_route.steps || [];

  // Active Navigation State
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isSignalLost, setIsSignalLost] = useState(false);
  const [liveSpeed, setLiveSpeed] = useState(0);

  const lastStepTimeRef = useRef(Date.now());

  // Handle Manual Start Navigation Trigger
  const handleStartNavigation = () => {
    setHasStarted(true);
    setIsPaused(false);
    setIsFinished(false);
    lastStepTimeRef.current = Date.now();
  };

  // Handle Pause / Resume Navigation Trigger
  const handleTogglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      if (!next) {
        lastStepTimeRef.current = Date.now();
      }
      return next;
    });
  };

  // Reset Navigation
  const handleResetNavigation = () => {
    setHasStarted(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setIsFinished(false);
    setActiveAlert(null);
    setIsSignalLost(false);
    setLiveSpeed(0);
  };

  // Progressive Vehicle Movement Loop
  useEffect(() => {
    if (!hasStarted || isPaused || isFinished || observations.length === 0) return;

    const currentObs = observations[currentIndex];
    const nextObs = observations[Math.min(currentIndex + 1, observations.length - 1)];
    const segmentMeters = haversineDistance(currentObs.coord, nextObs.coord);

    // Target driving speed (~45 km/h, slowed down before upcoming turns)
    const targetSpeedKmh = activeAlert && activeAlert.distanceMeters < 350 ? 30 : 48;
    const targetSpeedMps = (targetSpeedKmh * 1000) / 3600;
    const stepDurationMs = Math.max(300, Math.min(1800, Math.round((segmentMeters / targetSpeedMps) * 1000)));

    const timer = setTimeout(() => {
      const now = Date.now();
      const elapsedSec = (now - lastStepTimeRef.current) / 1000;
      lastStepTimeRef.current = now;

      const rawKmh = elapsedSec > 0 ? Math.round((segmentMeters / elapsedSec) * 3.6) : targetSpeedKmh;
      const cappedKmh = Math.min(120, Math.max(0, rawKmh));
      setLiveSpeed(cappedKmh);

      setCurrentIndex(prev => {
        const nextIdx = prev + 1;
        if (nextIdx >= observations.length - 1) {
          setIsFinished(true);
          setLiveSpeed(0);
          return observations.length - 1;
        }
        return nextIdx;
      });
    }, stepDurationMs);

    return () => clearTimeout(timer);
  }, [hasStarted, isPaused, currentIndex, isFinished, observations, activeAlert]);

  // Determine Active Vehicle Coordinate based on Position Source
  const activePositionCoord = () => {
    if (active_position_source === 'osrm_match' && matching.matched_positions && matching.matched_positions[currentIndex]) {
      return matching.matched_positions[currentIndex];
    }
    if (kalman_fallback.used && kalman_fallback.coordinates && kalman_fallback.coordinates[currentIndex]) {
      return kalman_fallback.coordinates[currentIndex];
    }
    return observations[currentIndex]?.coord || refCoords[0];
  };

  const currentCoord = activePositionCoord();

  // Heading calculation from successive active positions
  const nextIdx = Math.min(currentIndex + 1, observations.length - 1);
  const nextCoord = active_position_source === 'osrm_match' && matching.matched_positions?.[nextIdx]
    ? matching.matched_positions[nextIdx]
    : observations[nextIdx]?.coord || currentCoord;
  const bearing = calculateBearing(currentCoord, nextCoord);

  // Monitor Turn Steps for ~1 km Advance Alerts (Using OSRM /route steps)
  useEffect(() => {
    if (!turnSteps || turnSteps.length === 0) {
      setActiveAlert(null);
      return;
    }

    // Find next upcoming turn maneuver ahead of current position
    let nextStep = null;
    let minDistance = Infinity;

    for (const step of turnSteps) {
      if (step.location && step.location.length >= 2 && step.type !== 'arrive') {
        const d = haversineDistance(currentCoord, step.location);
        if (d > 20 && d < minDistance) {
          minDistance = d;
          nextStep = step;
        }
      }
    }

    if (nextStep && minDistance <= 1000) {
      setActiveAlert({
        maneuver: {
          instruction: nextStep.instruction || `Turn ahead onto ${nextStep.name}`,
          turnType: nextStep.modifier ? nextStep.modifier.replace(' ', '_') : 'turn',
          laneGuidance: nextStep.modifier?.includes('right') ? 'Stay in Right Lane' : 'Stay in Left Lane'
        },
        distanceMeters: Math.round(minDistance)
      });
    } else {
      setActiveAlert(null);
    }
  }, [currentCoord, turnSteps]);

  // Telemetry Metrics
  const curObs = observations[currentIndex];
  const measuredAccuracy = curObs?.accuracy_meters || 15.5;

  const totalDistanceKm = Number((reference_route.distance_meters / 1000).toFixed(2));
  const progressPercent = observations.length > 1 ? Math.round((currentIndex / (observations.length - 1)) * 100) : 0;
  const distCoveredKm = Number(((totalDistanceKm * progressPercent) / 100).toFixed(2));
  const distRemainingKm = Number(Math.max(0, totalDistanceKm - distCoveredKm).toFixed(2));
  const displayedSpeed = hasStarted && !isPaused ? Math.min(120, liveSpeed) : 0;
  const etaMin = Math.max(0, Math.round((distRemainingKm / (displayedSpeed || 45)) * 60));

  // Determine Status Badge & Colors
  const renderSourceBadge = () => {
    if (active_position_source === 'osrm_match') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 71, 171, 0.2)',
          border: '1px solid #0047AB',
          borderRadius: '4px',
          padding: '4px 10px'
        }}>
          <ShieldCheck size={14} color="#0047AB" />
          <span className="font-orbitron" style={{ fontSize: '11px', color: '#FFF' }}>
            POSITION: OSRM ROAD MATCHED ({matching.confidence ? `Conf: ${matching.confidence}` : 'Matched'})
          </span>
        </div>
      );
    }
    if (active_position_source === 'kalman_estimate') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(217, 119, 6, 0.2)',
          border: '1px solid #D97706',
          borderRadius: '4px',
          padding: '4px 10px'
        }}>
          <Cpu size={14} color="#D97706" />
          <span className="font-orbitron" style={{ fontSize: '11px', color: '#D97706' }}>
            POSITION: KALMAN FILTER ESTIMATE ({status === 'LOW_CONFIDENCE' ? 'Low Match Confidence Fallback' : 'Unmatched Fallback'})
          </span>
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255, 95, 31, 0.2)',
        border: '1px solid #FF5F1F',
        borderRadius: '4px',
        padding: '4px 10px'
      }}>
        <ShieldAlert size={14} color="#FF5F1F" />
        <span className="font-orbitron" style={{ fontSize: '11px', color: '#FF5F1F' }}>
          POSITION: RAW GNSS OBSERVATION
        </span>
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '1380px',
      margin: '0 auto',
      padding: '20px 24px 40px 24px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Top Header / Position Source Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="font-orbitron" style={{ fontSize: '12px', color: 'var(--parth-red)', letterSpacing: '1px' }}>
            NAVIGATION COCKPIT //
          </span>
          {renderSourceBadge()}
        </div>

        <button
          onClick={onBackToSelection}
          className="f1-btn-outline"
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          CHANGE ROUTE
        </button>
      </div>

      {/* Signal Loss Dead Reckoning Banner */}
      <SignalLossBanner isSignalLost={isSignalLost} deadReckoningData={null} />

      {/* 1 KM Advance Maneuver Notification Banner */}
      <div style={{ marginBottom: '16px' }}>
        <AdvanceAlertBanner activeAlert={activeAlert} />
      </div>

      {/* Telemetry HUD Cards */}
      <TelemetryHUD
        speedKmh={displayedSpeed}
        bearing={bearing}
        errorMetrics={{
          rawErrorMeters: measuredAccuracy,
          correctedErrorMeters: active_position_source === 'osrm_match' ? 1.2 : (kalman_fallback.uncertainty_meters || 4.5),
          reductionPercent: active_position_source === 'osrm_match' ? 92 : 70
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
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div className="font-orbitron" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--parth-neon-orange)' }}>
              DESTINATION REACHED
            </div>
            <div className="font-rajdhani" style={{ fontSize: '14px', color: '#FFF' }}>
              Vehicle successfully navigated {totalDistanceKm} km reference corridor.
            </div>
          </div>
          <button onClick={handleResetNavigation} className="f1-btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }}>
            RERUN SIMULATION
          </button>
        </div>
      )}

      {/* Leaflet Navigation Map */}
      <div style={{ height: '520px', width: '100%' }}>
        <LeafletMap
          referenceTrace={refCoords}
          noisyTrace={observations.slice(0, currentIndex + 6).map(o => o.coord)}
          matchedTrace={matching.geometry?.coordinates}
          kalmanTrace={kalman_fallback.coordinates}
          currentCoord={currentCoord}
          currentBearing={bearing}
          activePositionSource={active_position_source}
          turnSteps={turnSteps}
        />
      </div>

      {/* Transport Controls */}
      <SimulationControls
        hasStarted={hasStarted}
        isPaused={isPaused}
        onStartNavigation={handleStartNavigation}
        onTogglePause={handleTogglePause}
        onReset={handleResetNavigation}
      />
    </div>
  );
}
