import React, { useState, Component } from 'react';
import WavingPortfolioLanding from './components/ui/waving-portfolio-landing';
import ParticleGlobeTransition from './components/ParticleGlobeTransition';
import RouteSelectionPage from './components/RouteSelectionPage';
import TrafficTransition from './components/TrafficTransition';
import NavigationDashboard from './components/NavigationDashboard';
import { AlertCircle, RotateCcw } from 'lucide-react';

// Robust Error Boundary to guarantee no blank screen can ever happen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PARTH Navigation Error caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '720px',
          margin: '60px auto',
          padding: '28px',
          background: 'rgba(22, 25, 32, 0.95)',
          border: '2px solid var(--parth-red)',
          borderRadius: '8px',
          color: '#FFF',
          textAlign: 'center',
          boxShadow: '0 0 30px rgba(255, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <AlertCircle size={48} color="var(--parth-red)" />
          </div>
          <h2 className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--parth-red)', marginBottom: '8px' }}>
            NAVIGATION TELEMETRY ERROR
          </h2>
          <p className="font-rajdhani" style={{ fontSize: '15px', color: '#B0B7C6', marginBottom: '20px' }}>
            An unexpected error occurred while rendering the navigation cockpit:
            <br />
            <code style={{ color: 'var(--parth-neon-orange)', fontSize: '13px', background: '#0D0F14', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '8px' }}>
              {this.state.error?.message || 'Rendering exception'}
            </code>
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="f1-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              fontSize: '13px'
            }}
          >
            <RotateCcw size={16} />
            <span>RETURN TO ROUTE SELECTION</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * WHERE TO PARTH — Streamlined Application Flow
 * 1. WavingPortfolioLanding: Animated waving typography, F1 car storm, and NavIC GPS tracker
 * 2. ParticleGlobeTransition: 3D rotating spherical particle dissolution opening directly into Route Selection
 * 3. RouteSelectionPage: Interactive Leaflet map with Start and Destination pin-dropping
 * 4. TrafficTransition: Parallel opposite F1 traffic flow animation into cockpit
 * 5. NavigationDashboard: Live navigation cockpit with telemetry HUD, 3-lane guidance, and Kalman fallback
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
      {/* Main Navigation Flow — Clean & Immersive without top header bar */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <ErrorBoundary onReset={() => setCurrentPage('routes')}>
          {/* 1. Cool Waving Portfolio & F1 Car Storm Intro Animation (Full Viewport) */}
          {currentPage === 'welcome' && (
            <div key="welcome" className="view-transition-wrapper" style={{ flex: 1, height: '100vh' }}>
              <WavingPortfolioLanding
                height="100vh"
                onProceed={() => setCurrentPage('transition_globe')}
              />
            </div>
          )}

          {/* 2. Particle Globe Formation — Directly opens into Route Selection Page */}
          {currentPage === 'transition_globe' && (
            <ParticleGlobeTransition
              onComplete={() => setCurrentPage('routes')}
            />
          )}

          {/* 3. Interactive Map Route & Pin Selection */}
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

          {/* 4. Parallel Opposite F1 Traffic Flow Transition */}
          {currentPage === 'transition_traffic' && (
            <TrafficTransition
              onComplete={() => setCurrentPage('cockpit')}
            />
          )}

          {/* 5. Live Navigation Dashboard Cockpit */}
          {currentPage === 'cockpit' && (
            <div key="cockpit" className="view-transition-wrapper">
              <NavigationDashboard
                simulationData={simulationData}
                onBackToSelection={() => setCurrentPage('routes')}
              />
            </div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
