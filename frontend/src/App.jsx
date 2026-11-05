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
      {/* Global Header */}
      <Header />

      {/* Main Consolidated Navigation Flow */}
      <main style={{ flex: 1 }}>
        {currentPage === 'welcome' && (
          <WelcomePage
            onProceed={() => setCurrentPage('routes')}
          />
        )}

        {currentPage === 'routes' && (
          <RouteSelectionPage
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            onLaunchSimulation={() => setCurrentPage('cockpit')}
          />
        )}

        {currentPage === 'cockpit' && (
          <NavigationDashboard
            selectedRouteId={selectedRouteId}
          />
        )}
      </main>
    </div>
  );
}
