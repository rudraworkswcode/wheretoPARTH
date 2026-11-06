import React, { useState } from 'react';
import Header from './components/Header';
import WavingPortfolioLanding from './components/ui/waving-portfolio-landing';
import ParticleGlobeTransition from './components/ParticleGlobeTransition';
import BriefPage from './components/BriefPage';
import RouteSelectionPage from './components/RouteSelectionPage';
import TrafficTransition from './components/TrafficTransition';
import NavigationDashboard from './components/NavigationDashboard';

/**
 * WHERE TO PARTH — Unified Application Architecture
 * Combines all UI components of master:
 *  1. WavingPortfolioLanding: Animated waving typography, F1 car storm, and NavIC GPS tracker
 *  2. ParticleGlobeTransition: 3D rotating spherical particle dissolution & horizontal separation
 *  3. BriefPage: Mission briefing, Hackathon problem ID, and technical pillars
 *  4. TrafficTransition: Parallel opposite F1 traffic flow animation
 * With all functionality of no-osrm:
 *  5. RouteSelectionPage: Interactive Leaflet map with Start and Destination pin-dropping anywhere
 *  6. NavigationDashboard: Live navigation cockpit with top-level Pause/Resume/Restart controls,
 *     real-time telemetry HUD, Kalman filter fallback, and maneuver alerts
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [simulationData, setSimulationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleLaunchSimulation = async (requestPayload) => {
    setIsLoading(true);
    setApiError(null);

    const endpoints = ['/api/simulate', 'http://127.0.0.1:8080/api/simulate'];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_lon: requestPayload.start_lon,
            start_lat: requestPayload.start_lat,
            end_lon: requestPayload.end_lon,
            end_lat: requestPayload.end_lat,
          }),
        });

        if (!response.ok) {
          let errDetail = {
            error: `HTTP Error ${response.status}`,
            message: 'Failed to generate simulation route from local OSRM service.'
          };
          try {
            const errData = await response.json();
            if (errData.detail) {
              if (typeof errData.detail === 'object') {
                errDetail = errData.detail;
              } else {
                errDetail.message = String(errData.detail);
              }
            }
          } catch (e) { }
          setApiError(errDetail);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setSimulationData(data);
        setIsLoading(false);
        // Seamlessly transition through opposite parallel F1 traffic flow into cockpit
        setCurrentPage('transition_traffic');
        return;
      } catch (err) {
        continue;
      }
    }

    setApiError({
      error: 'BACKEND_CONNECTION_FAILED',
      message: 'Unable to connect to local navigation backend via /api/simulate or http://127.0.0.1:8080. Ensure the FastAPI server is running.'
    });
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--parth-black)' }}>
      {/* Global Header with Tab Navigation */}
      <Header
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        onNavigateHome={() => setCurrentPage('welcome')}
      />

      {/* Main Navigation Flow */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* 1. Cool Waving Portfolio & F1 Car Storm Intro Animation */}
        {currentPage === 'welcome' && (
          <div key="welcome" className="view-transition-wrapper" style={{ flex: 1 }}>
            <WavingPortfolioLanding
              height="calc(100vh - 65px)"
              onProceed={() => setCurrentPage('transition_globe')}
            />
          </div>
        )}

        {/* 2. Particle Globe Formation & Outward Split Transition */}
        {currentPage === 'transition_globe' && (
          <ParticleGlobeTransition
            onComplete={() => setCurrentPage('brief')}
          />
        )}

        {/* 3. Phase 02: Mission Briefing & PARTH Philosophy */}
        {currentPage === 'brief' && (
          <div key="brief" className="view-transition-wrapper">
            <BriefPage
              onProceed={() => setCurrentPage('routes')}
              onBack={() => setCurrentPage('welcome')}
            />
          </div>
        )}

        {/* 4. Interactive Map Route & Pin Selection */}
        {currentPage === 'routes' && (
          <div key="routes" className="view-transition-wrapper">
            <RouteSelectionPage
              onLaunchSimulation={handleLaunchSimulation}
              isLoading={isLoading}
              apiError={apiError}
              onClearError={() => setApiError(null)}
            />
          </div>
        )}

        {/* 5. Parallel Opposite F1 Traffic Flow Transition */}
        {currentPage === 'transition_traffic' && (
          <TrafficTransition
            onComplete={() => setCurrentPage('cockpit')}
          />
        )}

        {/* 6. Live Navigation Dashboard Cockpit */}
        {currentPage === 'cockpit' && (
          <div key="cockpit" className="view-transition-wrapper">
            <NavigationDashboard
              simulationData={simulationData}
              onBackToSelection={() => setCurrentPage('routes')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
