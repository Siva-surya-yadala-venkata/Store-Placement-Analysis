const axios = require('axios');
const kafkaService = require('./kafkaService');

class BlinkitService {
  constructor() {
    this.apiKey = process.env.BLINKIT_API_KEY;
    this.baseUrl = process.env.BLINKIT_API_URL || 'https://api.blinkit.com';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async fetchAreaOrders(areaId, startDate, endDate) {
    try {
      const response = await this.axiosInstance.get(`/orders/area/${areaId}`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          limit: 1000
        }
      });

      const orders = response.data.orders || [];
      
      // Calculate area statistics
      const areaStats = this.calculateAreaStats(orders);
      
      // Publish to Kafka for real-time processing
      await kafkaService.publishMessage('blinkit-orders', {
        areaId,
        orders,
        stats: areaStats,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          orders,
          stats: areaStats,
          totalOrders: orders.length
        }
      };
    } catch (error) {
      console.error('Error fetching Blinkit area orders:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchRealTimeOrders(areaId) {
    try {
      // Simulate real-time order fetching (replace with actual WebSocket or polling)
      const response = await this.axiosInstance.get(`/orders/realtime/${areaId}`);
      
      const realTimeOrders = response.data.orders || [];
      
      // Process each order in real-time
      for (const order of realTimeOrders) {
        await kafkaService.publishMessage('blinkit-orders', {
          orderId: order.id,
          areaId,
          orderData: order,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        data: realTimeOrders
      };
    } catch (error) {
      console.error('Error fetching real-time Blinkit orders:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchAreaDetails(areaId) {
    try {
      const response = await this.axiosInstance.get(`/areas/${areaId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching area details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchWarehouseLocations(areaId) {
    try {
      const response = await this.axiosInstance.get(`/warehouses/area/${areaId}`);
      
      return {
        success: true,
        data: response.data.warehouses || []
      };
    } catch (error) {
      console.error('Error fetching warehouse locations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateAreaStats(orders) {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalValue: 0,
        averageOrderValue: 0,
        peakHours: [],
        popularCategories: []
      };
    }

    const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalValue / orders.length;

    // Calculate peak hours
    const hourCounts = {};
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate popular categories
    const categoryCounts = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const category = item.category || 'Unknown';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    const popularCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      totalOrders: orders.length,
      totalValue,
      averageOrderValue,
      peakHours,
      popularCategories
    };
  }

  async simulateRealTimeData(areaId) {
    // Simulate real-time data for development/testing
    setInterval(async () => {
      const mockOrder = {
        id: `order_${Date.now()}`,
        areaId,
        total: Math.floor(Math.random() * 500) + 100,
        items: [
          {
            name: 'Mock Item',
            category: 'Groceries',
            price: Math.floor(Math.random() * 100) + 20
          }
        ],
        created_at: new Date().toISOString()
      };

      await kafkaService.publishMessage('blinkit-orders', {
        orderId: mockOrder.id,
        areaId,
        orderData: mockOrder,
        timestamp: new Date().toISOString()
      });
    }, 30000); // Simulate new order every 30 seconds
  }
}

module.exports = new BlinkitService();
