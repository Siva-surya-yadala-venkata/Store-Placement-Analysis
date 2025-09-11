const express = require('express');
const router = express.Router();
const Area = require('../models/Area');
const Order = require('../models/Order');
const competitorService = require('../services/competitorService');
const kafkaService = require('../services/kafkaService');
const aiRecommendationService = require('../services/aiRecommendationService');
const realTimeScrapingService = require('../services/realTimeScrapingService');

// Get comprehensive analysis for an area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { includeCompetitors = true } = req.query;
    
    const area = await Area.findOne({ areaId, isActive: true });
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }

    // Time ranges
    const now = new Date();
    const start30 = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // last 30 days
    const startYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); // last 12 months
    const startEpoch = new Date(0);

    // Stats for different windows
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const monthlyStats = await Order.getAreaStats(areaId, start30, endDate);
    const yearlyStats = await Order.getAreaStats(areaId, startYear, endDate);
    const lifetimeStats = await Order.getAreaStats(areaId, startEpoch, endDate);

    // Alias for existing downstream code (keeps compatibility)
    const orderStats = monthlyStats;

    // Market size & share
    const totalMarketSize = area.totalMarketSize;
    const blinkitMarketShare = area.blinkitMarketShare;

    // AI recommendation (uses local heuristic if no API key)
    const aiRecommendation = await aiRecommendationService.getRecommendation({
      area: area.name,
      monthlyStats,
      yearlyStats,
      lifetimeStats,
      warehouseRecommendation: area.warehouseRecommendation,
      marketShare: blinkitMarketShare
    });
    const peakHours = await Order.getPeakHours(areaId, startDate, endDate);
    const popularCategories = await Order.getPopularCategories(areaId, startDate, endDate);

    // Get competitor analysis if requested
    let competitorAnalysis = null;
    if (includeCompetitors === 'true') {
      const competitorResult = await competitorService.fetchCompetitorAnalysis(
        areaId,
        area.coordinates
      );
      if (competitorResult.success) {
        competitorAnalysis = competitorResult.data;
      }
    }

    // Calculate market share
    
    // Generate heatmap data
    const heatmapData = generateHeatmapData(area, orderStats);

    const analysis = {
      area: {
        id: area.areaId,
        name: area.name,
        city: area.city,
        state: area.state,
        coordinates: area.coordinates,
        population: area.population,
        infrastructure: area.infrastructure
      },
      blinkitPerformance: {
        // default 30-day window
        totalOrders: monthlyStats.totalOrders,
        totalRevenue: monthlyStats.totalValue,
        averageOrderValue: monthlyStats.avgOrderValue,
        customerCount: area.blinkitData.customerCount,
        deliveryTime: monthlyStats.avgDeliveryTime,
        customerRating: monthlyStats.avgRating,
        windows: {
          monthly: monthlyStats,
          yearly: yearlyStats,
          lifetime: lifetimeStats
        }
      },
      marketAnalysis: {
        totalMarketSize,
        blinkitMarketShare,
        competitorPresence: area.competitorData
      },
      operationalInsights: {
        peakHours,
        popularCategories,
        orderTrends: await getOrderTrends(areaId, 7) // Last 7 days
      },
      warehouseRecommendation: area.warehouseRecommendation,
      heatmapData,
      lastUpdated: new Date().toISOString()
    };

    // Publish analysis to Kafka
    await kafkaService.publishMessage('area-analysis', {
      areaId,
      analysis,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error generating area analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate area analysis'
    });
  }
});

// Get comparative analysis across multiple areas
router.get('/comparative', async (req, res) => {
  try {
    const { cities, states, limit = 10 } = req.query;
    
    let query = { isActive: true };
    if (cities) query.city = { $in: cities.split(',') };
    if (states) query.state = { $in: states.split(',') };

    const areas = await Area.find(query)
      .sort({ 'warehouseRecommendation.score': -1 })
      .limit(parseInt(limit));

    const comparativeData = areas.map(area => ({
      areaId: area.areaId,
      name: area.name,
      city: area.city,
      state: area.state,
      coordinates: area.coordinates,
      blinkitPerformance: {
        totalOrders: area.blinkitData.totalOrders,
        totalRevenue: area.blinkitData.totalRevenue,
        avgOrderValue: area.blinkitData.avgOrderValue
      },
      marketShare: area.blinkitMarketShare,
      warehouseScore: area.warehouseRecommendation.score,
      recommendation: area.warehouseRecommendation.recommendation
    }));

    // Calculate benchmarks
    const totalOrders = comparativeData.reduce((sum, area) => sum + area.blinkitPerformance.totalOrders, 0);
    const avgOrders = totalOrders / comparativeData.length;
    const totalRevenue = comparativeData.reduce((sum, area) => sum + area.blinkitPerformance.totalRevenue, 0);
    const avgRevenue = totalRevenue / comparativeData.length;

    const benchmarks = {
      avgOrders,
      avgRevenue,
      topPerformer: comparativeData[0],
      areas: comparativeData.length
    };

    res.json({
      success: true,
      data: {
        comparativeData,
        benchmarks
      }
    });
  } catch (error) {
    console.error('Error generating comparative analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comparative analysis'
    });
  }
});

// Get heatmap data for visualization
router.get('/heatmap/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { type = 'orders' } = req.query; // orders, revenue, competitors
    
    const area = await Area.findOne({ areaId, isActive: true });
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }

    let heatmapData;
    switch (type) {
      case 'orders':
        heatmapData = area.heatmapData.orderDensity || generateDefaultHeatmap();
        break;
      case 'revenue':
        heatmapData = area.heatmapData.revenueDensity || generateDefaultHeatmap();
        break;
      case 'competitors':
        heatmapData = area.heatmapData.competitorDensity || generateDefaultHeatmap();
        break;
      default:
        heatmapData = area.heatmapData.orderDensity || generateDefaultHeatmap();
    }

    res.json({
      success: true,
      data: {
        areaId,
        type,
        heatmapData,
        metadata: {
          gridSize: heatmapData.length,
          lastUpdated: area.heatmapData.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch heatmap data'
    });
  }
});

// Get warehouse placement recommendations
router.get('/warehouse-recommendations', async (req, res) => {
  try {
    const { minScore = 60, limit = 20 } = req.query;
    
    const allData = realTimeScrapingService.getScrapedData();
    
    if (allData.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          total: 0,
          criteria: {
            minScore: parseInt(minScore),
            limit: parseInt(limit)
          }
        }
      });
    }

    const recommendations = allData
      .filter(data => (data.analysis?.warehouseScore || 0) >= parseInt(minScore))
      .map(data => ({
        area: {
          id: data.location.name,
          name: data.location.name,
          city: data.location.city,
          state: data.location.state,
          coordinates: data.location.coordinates
        },
        recommendation: {
          score: data.analysis?.warehouseScore || 0,
          factors: data.analysis?.factors || {},
          summary: data.analysis?.recommendation || 'Insufficient data'
        },
        performance: {
          blinkitOrders: data.blinkit?.estimatedOrders || 0,
          blinkitRevenue: (data.blinkit?.estimatedOrders || 0) * (data.blinkit?.averageOrderValue || 0),
          marketShare: data.analysis?.marketShare || 0
        },
        competitors: {
          zepto: data.zepto?.estimatedOrders || 0,
          swiggy: data.swiggy?.estimatedOrders || 0
        },
        lastUpdated: data.timestamp
      }))
      .sort((a, b) => b.recommendation.score - a.recommendation.score)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        recommendations: recommendations,
        total: recommendations.length,
        criteria: {
          minScore: parseInt(minScore),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting warehouse recommendations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get warehouse recommendations' 
    });
  }
});

// Get real-time analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Get real-time data from scraping service
    const allData = realTimeScrapingService.getScrapedData();
    
    if (allData.length === 0) {
      // Return simulated dashboard data if no real data available
      const simulatedData = {
        timeRange,
        period: { 
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), 
          end: new Date() 
        },
        overview: {
          totalOrders: Math.floor(Math.random() * 5000) + 1000,
          totalRevenue: Math.floor(Math.random() * 500000) + 100000,
          activeAreas: 9
        },
        topAreas: [
          { areaId: 'nellore', name: 'Nellore', city: 'Nellore', state: 'Andhra Pradesh', blinkitData: { totalOrders: 1049 }, warehouseRecommendation: { score: 70 } },
          { areaId: 'guntur', name: 'Guntur', city: 'Guntur', state: 'Andhra Pradesh', blinkitData: { totalOrders: 946 }, warehouseRecommendation: { score: 80 } },
          { areaId: 'bangalore', name: 'Bangalore', city: 'Bangalore', state: 'Karnataka', blinkitData: { totalOrders: 1000 }, warehouseRecommendation: { score: 80 } }
        ],
        recentOrders: [
          { orderId: 'ORD001', areaId: { name: 'Nellore' }, total: 450, status: 'delivered', createdAt: new Date() },
          { orderId: 'ORD002', areaId: { name: 'Guntur' }, total: 320, status: 'out_for_delivery', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
          { orderId: 'ORD003', areaId: { name: 'Bangalore' }, total: 680, status: 'preparing', createdAt: new Date(Date.now() - 60 * 60 * 1000) }
        ],
        lastUpdated: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: simulatedData
      });
    }

    // Calculate real statistics from scraped data
    const totalOrders = allData.reduce((sum, data) => sum + (data.blinkit?.estimatedOrders || 0), 0);
    const totalRevenue = allData.reduce((sum, data) => sum + ((data.blinkit?.estimatedOrders || 0) * (data.blinkit?.averageOrderValue || 0)), 0);
    const activeAreas = allData.filter(data => data.blinkit?.serviceAvailable).length;

    // Generate top areas from scraped data
    const topAreas = allData
      .map(data => ({
        areaId: data.location.name.toLowerCase(),
        name: data.location.name,
        city: data.location.city,
        state: data.location.state,
        blinkitData: { totalOrders: data.blinkit?.estimatedOrders || 0 },
        warehouseRecommendation: { score: data.analysis?.warehouseScore || 0 }
      }))
      .sort((a, b) => b.blinkitData.totalOrders - a.blinkitData.totalOrders)
      .slice(0, 5);

    // Generate simulated recent orders
    const recentOrders = allData.slice(0, 5).map((data, index) => ({
      orderId: `ORD${String(index + 1).padStart(3, '0')}`,
      areaId: { name: data.location.name },
      total: Math.floor(Math.random() * 500) + 200,
      status: ['delivered', 'out_for_delivery', 'preparing', 'pending'][Math.floor(Math.random() * 4)],
      createdAt: new Date(Date.now() - index * 30 * 60 * 1000)
    }));

    const dashboardData = {
      timeRange,
      period: { 
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), 
        end: new Date() 
      },
      overview: {
        totalOrders,
        totalRevenue,
        activeAreas
      },
      topAreas,
      recentOrders,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Get real-time statistics across all locations
router.get('/real-time-stats', async (req, res) => {
  try {
    const allData = realTimeScrapingService.getScrapedData();
    
    if (allData.length === 0) {
      // Return simulated data if no real data available
      return res.json({
        liveOrders: Math.floor(Math.random() * 5000) + 1000,
        revenuePerHour: Math.floor(Math.random() * 50000) + 10000,
        activeAreas: Math.floor(Math.random() * 50) + 20,
        marketShare: Math.floor(Math.random() * 30) + 25,
        lastUpdated: new Date()
      });
    }

    const totalOrders = allData.reduce((sum, data) => sum + (data.blinkit?.estimatedOrders || 0), 0);
    const totalRevenue = allData.reduce((sum, data) => sum + (data.blinkit?.averageOrderValue || 0), 0);
    const activeAreas = allData.filter(data => data.blinkit?.serviceAvailable).length;
    const avgMarketShare = allData.reduce((sum, data) => sum + (data.analysis?.marketShare || 0), 0) / allData.length;

    res.json({
      liveOrders: totalOrders,
      revenuePerHour: totalRevenue,
      activeAreas,
      marketShare: avgMarketShare.toFixed(1),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    res.status(500).json({ error: 'Failed to get real-time statistics' });
  }
});

// Get available locations for analysis
router.get('/locations/available', async (req, res) => {
  try {
    const locations = await realTimeScrapingService.getBlinkitServiceLocations();
    
    // Enhance locations with real-time data
    const enhancedLocations = locations.map(location => {
      const locationData = realTimeScrapingService.getLocationData(location.name);
      
      if (locationData) {
        return {
          ...location,
          blinkitOrders: locationData.blinkit?.estimatedOrders || 0,
          averageOrderValue: locationData.blinkit?.averageOrderValue || 0,
          competitorCount: [locationData.zepto?.serviceAvailable, locationData.swiggy?.serviceAvailable].filter(Boolean).length,
          marketShare: locationData.analysis?.marketShare || 0,
          warehouseScore: locationData.analysis?.warehouseScore || 0,
          aiRecommendation: locationData.analysis?.aiRecommendation || locationData.analysis?.recommendation || 'Analyzing...',
          monthlyOrders: locationData.analysis?.blinkitPerformance?.windows?.monthly?.totalOrders || 0,
          yearlyOrders: locationData.analysis?.blinkitPerformance?.windows?.yearly?.totalOrders || 0,
          lifetimeOrders: locationData.analysis?.blinkitPerformance?.windows?.lifetime?.totalOrders || 0,
          lastUpdated: locationData.timestamp
        };
      }
      
      // Return basic location data if no analysis available
      return {
        ...location,
        blinkitOrders: 0,
        averageOrderValue: 0,
        competitorCount: 0,
        marketShare: 0,
        warehouseScore: 0,
        recommendation: 'Data collection in progress...',
        lastUpdated: new Date()
      };
    });

    res.json(enhancedLocations);
  } catch (error) {
    console.error('Error getting available locations:', error);
    res.status(500).json({ error: 'Failed to get available locations' });
  }
});

// Get detailed analysis for a specific location
router.get('/location/:locationName', async (req, res) => {
  try {
    const { locationName } = req.params;
    const locationData = realTimeScrapingService.getLocationData(locationName);
    
    if (!locationData) {
      // If no real data, trigger scraping for this location
      const locations = await realTimeScrapingService.getBlinkitServiceLocations();
      const location = locations.find(loc => loc.name.toLowerCase() === locationName.toLowerCase());
      
      if (location) {
        const scrapedData = await realTimeScrapingService.scrapeLocationData(location);
        if (scrapedData) {
          return res.json(scrapedData);
        }
      }
      
      return res.status(404).json({ error: 'Location not found or data unavailable' });
    }

    res.json(locationData);
  } catch (error) {
    console.error('Error getting location analysis:', error);
    res.status(500).json({ error: 'Failed to get location analysis' });
  }
});

// Get competitor analysis for a specific location
router.get('/competitors/:locationName', async (req, res) => {
  try {
    const { locationName } = req.params;
    const locationData = realTimeScrapingService.getLocationData(locationName);
    
    if (!locationData) {
      return res.status(404).json({ error: 'Location data not found' });
    }

    const competitorAnalysis = {
      blinkit: locationData.blinkit,
      zepto: locationData.zepto,
      swiggy: locationData.swiggy,
      marketShare: locationData.analysis?.marketShare || 0,
      competitorCount: locationData.analysis?.competitorCount || 0,
      analysis: {
        blinkitAdvantage: locationData.analysis?.warehouseScore > 60,
        marketPosition: locationData.analysis?.marketShare > 50 ? 'Leader' : 'Challenger',
        competitiveGap: Math.max(0, 100 - (locationData.analysis?.warehouseScore || 0))
      }
    };

    res.json(competitorAnalysis);
  } catch (error) {
    console.error('Error getting competitor analysis:', error);
    res.status(500).json({ error: 'Failed to get competitor analysis' });
  }
});

// Get heatmap data for a specific location
router.get('/heatmap/:locationName', async (req, res) => {
  try {
    const { locationName } = req.params;
    const locationData = realTimeScrapingService.getLocationData(locationName);
    
    if (!locationData) {
      return res.status(404).json({ error: 'Location data not found' });
    }

    // Generate heatmap data based on service areas and order density
    const heatmapData = locationData.blinkit?.serviceAreas?.map((area, index) => {
      const baseLat = locationData.location.coordinates.lat;
      const baseLng = locationData.location.coordinates.lng;
      
      // Generate coordinates around the main location
      const lat = baseLat + (Math.random() - 0.5) * 0.1;
      const lng = baseLng + (Math.random() - 0.5) * 0.1;
      
      // Calculate intensity based on coverage and population
      const intensity = Math.min(100, (area.coverage * 0.6) + (area.population / 1000 * 0.4));
      
      return {
        lat,
        lng,
        intensity: Math.round(intensity),
        area: {
          name: area.name,
          city: locationData.location.city,
          totalOrders: Math.floor(area.population * 0.01), // Simulate order volume
          coverage: area.coverage,
          population: area.population
        }
      };
    }) || [];

    // Add main location point
    heatmapData.unshift({
      lat: locationData.location.coordinates.lat,
      lng: locationData.location.coordinates.lng,
      intensity: Math.min(100, locationData.analysis?.warehouseScore || 50),
      area: {
        name: locationData.location.name,
        city: locationData.location.city,
        totalOrders: locationData.blinkit?.estimatedOrders || 0,
        coverage: 100,
        population: 100000
      }
    });

    res.json(heatmapData);
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    res.status(500).json({ error: 'Failed to get heatmap data' });
  }
});



// Trigger manual data scraping for a location
router.post('/scrape/:locationName', async (req, res) => {
  try {
    const { locationName } = req.params;
    const locations = await realTimeScrapingService.getBlinkitServiceLocations();
    const location = locations.find(loc => loc.name.toLowerCase() === locationName.toLowerCase());
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const scrapedData = await realTimeScrapingService.scrapeLocationData(location);
    
    if (scrapedData) {
      res.json({ 
        message: 'Data scraping completed successfully',
        data: scrapedData 
      });
    } else {
      res.status(500).json({ error: 'Data scraping failed' });
    }
  } catch (error) {
    console.error('Error triggering data scraping:', error);
    res.status(500).json({ error: 'Failed to trigger data scraping' });
  }
});

// Get scraping service status
router.get('/scraping-status', async (req, res) => {
  try {
    const status = {
      isScraping: realTimeScrapingService.isScraping,
      lastScraped: realTimeScrapingService.getScrapedData().length > 0 ? 
        Math.max(...realTimeScrapingService.getScrapedData().map(d => d.timestamp)) : null,
      totalLocations: realTimeScrapingService.getScrapedData().length,
      scrapingInterval: process.env.SCRAPING_INTERVAL || 10000
    };

    res.json(status);
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({ error: 'Failed to get scraping status' });
  }
});

// Helper functions
function generateHeatmapData(area, orderStats) {
  // Generate a 20x20 grid for heatmap visualization
  const gridSize = 20;
  const heatmap = [];
  
  for (let i = 0; i < gridSize; i++) {
    const row = [];
    for (let j = 0; j < gridSize; j++) {
      // Generate heatmap intensity based on area data
      const distanceFromCenter = Math.sqrt(Math.pow(i - gridSize/2, 2) + Math.pow(j - gridSize/2, 2));
      const maxDistance = Math.sqrt(Math.pow(gridSize/2, 2) + Math.pow(gridSize/2, 2));
      
      // Higher intensity in center, lower at edges
      const intensity = Math.max(0, 1 - (distanceFromCenter / maxDistance));
      
      // Factor in order density and revenue
      const orderFactor = Math.min(orderStats.totalOrders / 100, 1);
      const revenueFactor = Math.min(orderStats.totalValue / 100000, 1);
      
      const finalIntensity = intensity * (0.4 + 0.3 * orderFactor + 0.3 * revenueFactor);
      
      row.push(Math.round(finalIntensity * 100));
    }
    heatmap.push(row);
  }
  
  return heatmap;
}

function generateDefaultHeatmap() {
  const gridSize = 20;
  const heatmap = [];
  
  for (let i = 0; i < gridSize; i++) {
    const row = [];
    for (let j = 0; j < gridSize; j++) {
      row.push(Math.floor(Math.random() * 50));
    }
    heatmap.push(row);
  }
  
  return heatmap;
}

async function getOrderTrends(areaId, days) {
  const trends = [];
  const endDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const startDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    
    const dailyStats = await Order.getAreaStats(areaId, startDate, endDate);
    
    trends.push({
      date: startDate.toISOString().split('T')[0],
      orders: dailyStats.totalOrders,
      revenue: dailyStats.totalValue
    });
  }
  
  return trends;
}

module.exports = router;
