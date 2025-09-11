import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { AnalysisProvider } from './context/AnalysisContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import LocationSelection from './pages/LocationSelection';
import RealTimeAnalysis from './pages/RealTimeAnalysis';
import AreaAnalysis from './pages/AreaAnalysis';
import MapView from './pages/MapView';
import WarehouseRecommendations from './pages/WarehouseRecommendations';
import RealTimeOrders from './pages/RealTimeOrders';

// Styles
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AnalysisProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Navigate to="/locations" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/locations" element={<LocationSelection />} />
                  <Route path="/analysis/:locationName" element={<RealTimeAnalysis />} />
                  <Route path="/area-analysis" element={<AreaAnalysis />} />
                  <Route path="/map-view" element={<MapView />} />
                  <Route path="/warehouse-recommendations" element={<WarehouseRecommendations />} />
                  <Route path="/real-time-orders" element={<RealTimeOrders />} />
                </Routes>
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AnalysisProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
