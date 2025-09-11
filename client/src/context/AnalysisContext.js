import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const AnalysisContext = createContext();

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};

export const useAnalysisUpdates = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisUpdates must be used within an AnalysisProvider');
  }
  return {
    analysisUpdates: context.analysisUpdates,
    addAnalysisUpdate: context.addAnalysisUpdate
  };
};

export const useCompetitorUpdates = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useCompetitorUpdates must be used within an AnalysisProvider');
  }
  return {
    competitorUpdates: context.competitorUpdates,
    addCompetitorUpdate: context.addCompetitorUpdate
  };
};

export const useRealTimeOrders = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useRealTimeOrders must be used within an AnalysisProvider');
  }
  return {
    realTimeOrders: context.realTimeOrders,
    addRealTimeOrder: context.addRealTimeOrder
  };
};

export const AnalysisProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [realTimeData, setRealTimeData] = useState({
    orders: [],
    competitorUpdates: [],
    analysisUpdates: []
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for real-time data updates
    socket.on('new-order', (data) => {
      setRealTimeData(prev => ({
        ...prev,
        orders: [data, ...prev.orders.slice(0, 49)] // Keep last 50 orders
      }));
    });

    socket.on('competitor-update', (data) => {
      setRealTimeData(prev => ({
        ...prev,
        competitorUpdates: [data, ...prev.competitorUpdates.slice(0, 19)] // Keep last 20 updates
      }));
    });

    socket.on('analysis-update', (data) => {
      setRealTimeData(prev => ({
        ...prev,
        analysisUpdates: [data, ...prev.analysisUpdates.slice(0, 19)] // Keep last 20 updates
      }));
    });

    socket.on('location-data-update', (data) => {
      setRealTimeData(prev => ({
        ...prev,
        analysisUpdates: [data, ...prev.analysisUpdates.slice(0, 19)]
      }));
    });

    return () => {
      socket.off('new-order');
      socket.off('competitor-update');
      socket.off('analysis-update');
      socket.off('location-data-update');
    };
  }, [socket, isConnected]);

  const addRealTimeOrder = (order) => {
    setRealTimeData(prev => ({
      ...prev,
      orders: [order, ...prev.orders.slice(0, 49)]
    }));
  };

  const addCompetitorUpdate = (update) => {
    setRealTimeData(prev => ({
      ...prev,
      competitorUpdates: [update, ...prev.competitorUpdates.slice(0, 19)]
    }));
  };

  const addAnalysisUpdate = (update) => {
    setRealTimeData(prev => ({
      ...prev,
      analysisUpdates: [update, ...prev.analysisUpdates.slice(0, 19)]
    }));
  };

  const value = {
    ...realTimeData,
    addRealTimeOrder,
    addCompetitorUpdate,
    addAnalysisUpdate,
    clearOrders: () => setRealTimeData(prev => ({ ...prev, orders: [] })),
    clearCompetitorUpdates: () => setRealTimeData(prev => ({ ...prev, competitorUpdates: [] })),
    clearAnalysisUpdates: () => setRealTimeData(prev => ({ ...prev, analysisUpdates: [] }))
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

export { AnalysisContext };
