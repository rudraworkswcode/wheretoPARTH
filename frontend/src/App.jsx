import React, { useState } from 'react';
import Header from './components/Header';
import WelcomePage from './components/WelcomePage';
import RouteSelectionPage from './components/RouteSelectionPage';
import NavigationDashboard from './components/NavigationDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [simulationData, setSimulationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleLaunchSimulation = async (requestPayload) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch('/api/simulate', {
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
      setCurrentPage('cockpit');
    } catch (err) {
      setApiError({
        error: 'BACKEND_CONNECTION_FAILED',
        message: 'Unable to connect to local navigation backend via /api/simulate. Ensure the FastAPI server and local OSRM Docker container are active.'
      });
      setIsLoading(false);
    }
  };

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
              onLaunchSimulation={handleLaunchSimulation}
              isLoading={isLoading}
              apiError={apiError}
              onClearError={() => setApiError(null)}
            />
          </div>
        )}

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