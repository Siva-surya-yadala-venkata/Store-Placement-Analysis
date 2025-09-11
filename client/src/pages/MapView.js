import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useAnalysis } from '../context/AnalysisContext';
import LoadingSpinner from '../components/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

const MapView = () => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const { realTimeOrders, competitorUpdates } = useAnalysis();

  const { data: areas, isLoading } = useQuery(
    'areas',
    () => axios.get('/api/areas').then(res => res.data)
  );

  const { data: heatmap } = useQuery(
    'heatmap',
    () => axios.get('/api/analysis/heatmap').then(res => res.data)
  );

  useEffect(() => {
    if (heatmap) {
      setHeatmapData(heatmap);
    }
  }, [heatmap]);

  if (isLoading) return <LoadingSpinner />;

  const defaultCenter = [15.9129, 79.7400]; // Nellore coordinates
  const defaultZoom = 8;

  const getHeatmapColor = (intensity) => {
    if (intensity > 80) return '#ff0000'; // Red - High
    if (intensity > 60) return '#ff6600'; // Orange - Medium-High
    if (intensity > 40) return '#ffcc00'; // Yellow - Medium
    if (intensity > 20) return '#99ff00'; // Light Green - Low-Medium
    return '#00ff00'; // Green - Low
  };

  const getRadius = (intensity) => {
    return Math.max(10, Math.min(50, intensity / 2));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Interactive Map View</h1>
          <p className="text-gray-600">Visualize warehouse opportunities and order density across locations</p>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-sm border-r overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Area Information</h2>
            
            {selectedArea ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">{selectedArea.name}</h3>
                  <p className="text-sm text-blue-700">{selectedArea.city}, {selectedArea.state}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Orders:</span>
                    <span className="font-medium">{selectedArea.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="font-medium">₹{selectedArea.totalRevenue?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Market Share:</span>
                    <span className="font-medium">{selectedArea.marketShare || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Warehouse Score:</span>
                    <span className="font-medium">{selectedArea.warehouseScore || 0}/100</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Competitor Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zepto:</span>
                      <span>₹{selectedArea.zeptoRevenue?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Swiggy:</span>
                      <span>₹{selectedArea.swiggyRevenue?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Click on a location on the map to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Heatmap Markers */}
            {heatmapData.map((point, index) => (
              <CircleMarker
                key={index}
                center={[point.lat, point.lng]}
                radius={getRadius(point.intensity)}
                fillColor={getHeatmapColor(point.intensity)}
                color={getHeatmapColor(point.intensity)}
                weight={2}
                opacity={0.8}
                fillOpacity={0.6}
                eventHandlers={{
                  click: () => setSelectedArea(point.area)
                }}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900">{point.area?.name}</h3>
                    <p className="text-sm text-gray-600">{point.area?.city}</p>
                    <p className="text-sm text-gray-600">Intensity: {point.intensity}%</p>
                    <p className="text-sm text-gray-600">Orders: {point.area?.totalOrders || 0}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Area Markers */}
            {areas?.map((area) => (
              <CircleMarker
                key={area._id}
                center={[area.coordinates.lat, area.coordinates.lng]}
                radius={8}
                fillColor="#3b82f6"
                color="#1d4ed8"
                weight={2}
                opacity={1}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => setSelectedArea(area)
                }}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900">{area.name}</h3>
                    <p className="text-sm text-gray-600">{area.city}</p>
                    <p className="text-sm text-gray-600">Orders: {area.totalOrders || 0}</p>
                    <p className="text-sm text-gray-600">Score: {area.warehouseScore || 0}/100</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
            <h3 className="font-medium text-gray-900 mb-2">Heatmap Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span>High (80%+)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                <span>Medium-High (60-80%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <span>Medium (40-60%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-lime-500 rounded-full mr-2"></div>
                <span>Low-Medium (20-40%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span>Low (0-20%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
