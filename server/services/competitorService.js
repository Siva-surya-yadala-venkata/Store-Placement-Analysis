const axios = require('axios');
const kafkaService = require('./kafkaService');

class CompetitorService {
  constructor() {
    this.zeptoApiKey = process.env.ZEPTO_API_KEY;
    this.swiggyApiKey = process.env.SWIGGY_API_KEY;
    this.zeptoBaseUrl = process.env.ZEPTO_API_URL || 'https://api.zepto.in';
    this.swiggyBaseUrl = process.env.SWIGGY_API_URL || 'https://api.swiggy.com';
    
    this.zeptoInstance = axios.create({
      baseURL: this.zeptoBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.zeptoApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    this.swiggyInstance = axios.create({
      baseURL: this.swiggyBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.swiggyApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async fetchZeptoData(areaId, coordinates) {
    try {
      const response = await this.zeptoInstance.get('/orders/area', {
        params: {
          area_id: areaId,
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 5000, // 5km radius
          limit: 100
        }
      });

      const zeptoData = response.data || {};
      
      // Publish to Kafka for real-time processing
      await kafkaService.publishMessage('competitor-data', {
        competitor: 'zepto',
        areaId,
        data: zeptoData,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: zeptoData
      };
    } catch (error) {
      console.error('Error fetching Zepto data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchSwiggyData(areaId, coordinates) {
    try {
      const response = await this.swiggyInstance.get('/instamart/orders', {
        params: {
          area_id: areaId,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          radius: 5000, // 5km radius
          limit: 100
        }
      });

      const swiggyData = response.data || {};
      
      // Publish to Kafka for real-time processing
      await kafkaService.publishMessage('competitor-data', {
        competitor: 'swiggy',
        areaId,
        data: swiggyData,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: swiggyData
      };
    } catch (error) {
      console.error('Error fetching Swiggy data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchCompetitorAnalysis(areaId, coordinates) {
    try {
      const [zeptoResult, swiggyResult] = await Promise.allSettled([
        this.fetchZeptoData(areaId, coordinates),
        this.fetchSwiggyData(areaId, coordinates)
      ]);

      const analysis = {
        areaId,
        timestamp: new Date().toISOString(),
        competitors: {}
      };

      if (zeptoResult.status === 'fulfilled' && zeptoResult.value.success) {
        analysis.competitors.zepto = this.analyzeCompetitorData(zeptoResult.value.data);
      }

      if (swiggyResult.status === 'fulfilled' && swiggyResult.value.success) {
        analysis.competitors.swiggy = this.analyzeCompetitorData(swiggyResult.value.data);
      }

      // Publish analysis to Kafka
      await kafkaService.publishMessage('area-analysis', {
        areaId,
        analysis,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      console.error('Error in competitor analysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  analyzeCompetitorData(data) {
    if (!data || !data.orders) {
      return {
        totalOrders: 0,
        averageOrderValue: 0,
        peakHours: [],
        marketShare: 0
      };
    }

    const orders = data.orders;
    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Calculate peak hours
    const hourCounts = {};
    orders.forEach(order => {
      const hour = new Date(order.created_at || order.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      totalOrders,
      averageOrderValue,
      peakHours,
      marketShare: 0 // Will be calculated based on total market
    };
  }

  async simulateCompetitorData(areaId) {
    // Simulate competitor data for development/testing
    setInterval(async () => {
      const mockZeptoData = {
        competitor: 'zepto',
        areaId,
        data: {
          orders: [
            {
              id: `zepto_${Date.now()}`,
              total: Math.floor(Math.random() * 400) + 80,
              created_at: new Date().toISOString()
            }
          ]
        },
        timestamp: new Date().toISOString()
      };

      const mockSwiggyData = {
        competitor: 'swiggy',
        areaId,
        data: {
          orders: [
            {
              id: `swiggy_${Date.now()}`,
              total: Math.floor(Math.random() * 450) + 90,
              created_at: new Date().toISOString()
            }
          ]
        },
        timestamp: new Date().toISOString()
      };

      await kafkaService.publishMessage('competitor-data', mockZeptoData);
      await kafkaService.publishMessage('competitor-data', mockSwiggyData);
    }, 45000); // Simulate competitor data every 45 seconds
  }

  calculateMarketShare(blinkitOrders, competitorOrders) {
    const totalMarketOrders = blinkitOrders + competitorOrders;
    if (totalMarketOrders === 0) return 0;
    
    return (blinkitOrders / totalMarketOrders) * 100;
  }
}

module.exports = new CompetitorService();
