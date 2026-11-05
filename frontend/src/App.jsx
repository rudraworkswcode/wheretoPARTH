import React, { useState } from 'react';
import Header from './components/Header';
import WelcomePage from './components/WelcomePage';
import ParticleGlobeTransition from './components/ParticleGlobeTransition';
import BriefPage from './components/BriefPage';
import RouteSelectionPage from './components/RouteSelectionPage';
import TrafficTransition from './components/TrafficTransition';
import NavigationDashboard from './components/NavigationDashboard';
import { DEFAULT_ROUTE_ID } from './data/routesData';

/**
 * Required exact application flow:
 * WelcomePage -> ParticleGlobeTransition -> BriefPage -> RouteSelectionPage -> TrafficTransition -> NavigationDashboard
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [selectedRouteId, setSelectedRouteId] = useState(DEFAULT_ROUTE_ID);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--parth-black)' }}>
      {/* Global Header */}
      <Header onNavigateHome={() => setCurrentPage('welcome')} />

      {/* Main Consolidated Navigation Flow */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* 1. Welcome Page */}
        {currentPage === 'welcome' && (
          <WelcomePage
            onProceed={() => setCurrentPage('transition_globe')}
          />
        )}

        {/* 2. Transition A: Particle Dissolution -> Globe Formation -> Separation */}
        {currentPage === 'transition_globe' && (
          <ParticleGlobeTransition
            onComplete={() => setCurrentPage('brief')}
          />
        )}

        {/* 3. Brief Page */}
        {currentPage === 'brief' && (
          <BriefPage
            onProceed={() => setCurrentPage('routes')}
            onBack={() => setCurrentPage('welcome')}
          />
        )}

        {/* 4. Route Selection Page */}
        {currentPage === 'routes' && (
          <RouteSelectionPage
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            onLaunchSimulation={() => setCurrentPage('transition_traffic')}
          />
        )}

        {/* 5. Transition B: Parallel Opposite F1 Traffic Flow */}
        {currentPage === 'transition_traffic' && (
          <TrafficTransition
            onComplete={() => setCurrentPage('cockpit')}
          />
        )}

        {/* 6. Navigation Cockpit / Map */}
        {currentPage === 'cockpit' && (
          <NavigationDashboard
            selectedRouteId={selectedRouteId}
          />
        )}
      </main>
    </div>
  );
}
