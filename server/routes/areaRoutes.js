const express = require('express');
const router = express.Router();
const Area = require('../models/Area');
const blinkitService = require('../services/blinkitService');
const competitorService = require('../services/competitorService');
const kafkaService = require('../services/kafkaService');

// Get all areas
router.get('/', async (req, res) => {
  try {
    const { city, state, recommendation, limit = 50, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    if (city) query.city = new RegExp(city, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (recommendation) query['warehouseRecommendation.recommendation'] = recommendation;

    const skip = (page - 1) * limit;
    
    const areas = await Area.find(query)
      .sort({ 'warehouseRecommendation.score': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Area.countDocuments(query);

    res.json({
      success: true,
      data: {
        areas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch areas'
    });
  }
});

// Get area by ID
router.get('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const area = await Area.findOne({ areaId, isActive: true });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }

    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error fetching area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch area'
    });
  }
});

// Get areas by recommendation level
router.get('/recommendation/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const { limit = 20 } = req.query;
    
    const areas = await Area.getByRecommendation(level).limit(parseInt(limit));
    
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching areas by recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch areas by recommendation'
    });
  }
});

// Get top performing areas
router.get('/top-performing', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const areas = await Area.getTopPerforming(parseInt(limit));
    
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching top performing areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top performing areas'
    });
  }
});

// Create new area
router.post('/', async (req, res) => {
  try {
    const areaData = req.body;
    
    // Validate required fields
    if (!areaData.areaId || !areaData.name || !areaData.city || !areaData.state || !areaData.coordinates) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: areaId, name, city, state, coordinates'
      });
    }

    // Check if area already exists
    const existingArea = await Area.findOne({ areaId: areaData.areaId });
    if (existingArea) {
      return res.status(400).json({
        success: false,
        error: 'Area with this ID already exists'
      });
    }

    const area = new Area(areaData);
    
    // Calculate initial warehouse recommendation score
    area.calculateWarehouseScore();
    
    await area.save();

    res.status(201).json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create area'
    });
  }
});

// Update area data
router.put('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const updateData = req.body;
    
    const area = await Area.findOneAndUpdate(
      { areaId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }

    // Recalculate warehouse recommendation score
    area.calculateWarehouseScore();
    await area.save();

    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update area'
    });
  }
});

// Refresh area data from external APIs
router.post('/:areaId/refresh', async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const area = await Area.findOne({ areaId });
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }

    // Fetch fresh data from Blinkit
    const blinkitResult = await blinkitService.fetchAreaOrders(
      areaId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      new Date()
    );

    // Fetch competitor data
    const competitorResult = await competitorService.fetchCompetitorAnalysis(
      areaId,
      area.coordinates
    );

    // Update area with fresh data
    if (blinkitResult.success) {
      const stats = blinkitResult.data.stats;
      area.blinkitData = {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalValue,
        avgOrderValue: stats.averageOrderValue,
        lastUpdated: new Date()
      };
    }

    if (competitorResult.success) {
      const analysis = competitorResult.data.analysis;
      if (analysis.competitors.zepto) {
        area.competitorData.zepto = {
          totalOrders: analysis.competitors.zepto.totalOrders,
          avgOrderValue: analysis.competitors.zepto.averageOrderValue,
          lastUpdated: new Date()
        };
      }
      if (analysis.competitors.swiggy) {
        area.competitorData.swiggy = {
          totalOrders: analysis.competitors.swiggy.totalOrders,
          avgOrderValue: analysis.competitors.swiggy.averageOrderValue,
          lastUpdated: new Date()
        };
      }
    }

    // Recalculate warehouse recommendation score
    area.calculateWarehouseScore();
    await area.save();

    // Publish updated area data to Kafka
    await kafkaService.publishMessage('area-analysis', {
      areaId,
      area: area.toObject(),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: area,
      message: 'Area data refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing area data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh area data'
    });
  }
});

// Get areas within radius (for map visualization)
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.params; // Default 10km radius
    
    const areas = await Area.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      isActive: true
    }).sort({ 'warehouseRecommendation.score': -1 });

    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching nearby areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby areas'
    });
  }
});

// Delete area (for testing/development)
router.delete('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const area = await Area.findOneAndDelete({ areaId });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }

    res.json({
      success: true,
      message: 'Area deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete area'
    });
  }
});

module.exports = router;
