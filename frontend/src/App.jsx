import React, { useState } from 'react';
import Header from './components/Header';
import WelcomePage from './components/WelcomePage';
import BriefPage from './components/BriefPage';
import RouteSelectionPage from './components/RouteSelectionPage';
import NavigationDashboard from './components/NavigationDashboard';
import { DEFAULT_ROUTE_ID, ROUTE_LIST } from './data/routesData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [selectedRouteId, setSelectedRouteId] = useState(DEFAULT_ROUTE_ID);
  const [useBackendApi, setUseBackendApi] = useState(false);

  // Noise Configuration aligned with noise_config.json
  const [noiseConfig, setNoiseConfig] = useState({
    latitude_variance: 0.00005,
    longitude_variance: 0.00005,
    drift_bias_lat: 0.00001,
    drift_bias_lon: -0.00001,
    dropout_percentage: 0.02,
    average_dropout_duration: 2
  });

  const activeRoute = ROUTE_LIST.find(r => r.id === selectedRouteId) || ROUTE_LIST[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--parth-black)' }}>
      {/* Global Navigation Header */}
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedRoute={activeRoute}
      />

      {/* Main Page Views */}
      <main style={{ flex: 1 }}>
        {currentPage === 'welcome' && (
          <WelcomePage
            onProceed={() => setCurrentPage('brief')}
          />
        )}

        {currentPage === 'brief' && (
          <BriefPage
            onProceed={() => setCurrentPage('routes')}
            onBack={() => setCurrentPage('welcome')}
          />
        )}

        {currentPage === 'routes' && (
          <RouteSelectionPage
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            noiseConfig={noiseConfig}
            setNoiseConfig={setNoiseConfig}
            onLaunchSimulation={() => setCurrentPage('cockpit')}
            useBackendApi={useBackendApi}
            setUseBackendApi={setUseBackendApi}
          />
        )}

        {currentPage === 'cockpit' && (
          <NavigationDashboard
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            noiseConfig={noiseConfig}
            useBackendApi={useBackendApi}
          />
        )}
      </main>
    </div>
  );
}

