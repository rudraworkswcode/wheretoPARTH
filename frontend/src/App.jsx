import React, { useState } from 'react';
import Header from './components/Header';
import WelcomePage from './components/WelcomePage';
import RouteSelectionPage from './components/RouteSelectionPage';
import NavigationDashboard from './components/NavigationDashboard';
import { DEFAULT_ROUTE_ID } from './data/routesData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [selectedRouteId, setSelectedRouteId] = useState(DEFAULT_ROUTE_ID);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--parth-black)' }}>
      {/* Global Header with functional logo routing back to initial homepage brief */}
      <Header onNavigateHome={() => setCurrentPage('welcome')} />

      {/* Main Consolidated Navigation Flow with Smooth State Transition Animation */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentPage === 'welcome' && (
          <div key="welcome" className="view-transition-wrapper">
            <WelcomePage
              onProceed={() => setCurrentPage('routes')}
            />
          </div>
        )}

        {currentPage === 'routes' && (
          <div key="routes" className="view-transition-wrapper">
            <RouteSelectionPage
              selectedRouteId={selectedRouteId}
              setSelectedRouteId={setSelectedRouteId}
              onLaunchSimulation={() => setCurrentPage('cockpit')}
            />
          </div>
        )}

        {currentPage === 'cockpit' && (
          <div key="cockpit" className="view-transition-wrapper">
            <NavigationDashboard
              selectedRouteId={selectedRouteId}
            />
          </div>
        )}
      </main>
    </div>
  );
}
