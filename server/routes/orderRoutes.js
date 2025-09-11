const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const blinkitService = require('../services/blinkitService');
const kafkaService = require('../services/kafkaService');

// Get all orders for an area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { startDate, endDate, limit = 100, page = 1 } = req.query;

    let query = { areaId };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('areaId', 'name city');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Get order statistics for an area
router.get('/area/:areaId/stats', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Order.getAreaStats(areaId, start, end);
    const peakHours = await Order.getPeakHours(areaId, start, end);
    const popularCategories = await Order.getPopularCategories(areaId, start, end);

    res.json({
      success: true,
      data: {
        ...stats,
        peakHours,
        popularCategories,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics'
    });
  }
});

// Get real-time orders for an area
router.get('/area/:areaId/realtime', async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const result = await blinkitService.fetchRealTimeOrders(areaId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error fetching real-time orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time orders'
    });
  }
});

// Create a new order (for testing/development)
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.orderId || !orderData.areaId || !orderData.total) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, areaId, total'
      });
    }

    const order = new Order(orderData);
    await order.save();

    // Publish to Kafka for real-time processing
    await kafkaService.publishMessage('blinkit-orders', {
      orderId: order.orderId,
      areaId: order.areaId,
      orderData: order,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { 
        status,
        ...(status === 'delivered' && { deliveredAt: new Date() })
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Publish status update to Kafka
    await kafkaService.publishMessage('blinkit-orders', {
      orderId: order.orderId,
      areaId: order.areaId,
      statusUpdate: { status, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId }).populate('areaId', 'name city');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Delete order (for testing/development)
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOneAndDelete({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    });
  }
});

module.exports = router;
