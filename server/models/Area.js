const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  areaId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: String,
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: [[[Number]]] // Array of coordinate pairs
  },
  population: Number,
  areaSize: Number, // in square kilometers
  demographics: {
    avgIncome: Number,
    avgAge: Number,
    familySize: Number,
    urbanizationLevel: String // urban, suburban, rural
  },
  infrastructure: {
    hasMetro: Boolean,
    hasHighway: Boolean,
    hasAirport: Boolean,
    hasMall: Boolean,
    hasHospital: Boolean,
    hasSchool: Boolean
  },
  blinkitData: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    avgOrderValue: {
      type: Number,
      default: 0
    },
    customerCount: {
      type: Number,
      default: 0
    },
    deliveryTime: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  competitorData: {
    zepto: {
      totalOrders: { type: Number, default: 0 },
      avgOrderValue: { type: Number, default: 0 },
      marketShare: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    swiggy: {
      totalOrders: { type: Number, default: 0 },
      avgOrderValue: { type: Number, default: 0 },
      marketShare: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  warehouseRecommendation: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    factors: [{
      name: String,
      weight: Number,
      score: Number,
      description: String
    }],
    recommendation: {
      type: String,
      enum: ['high', 'medium', 'low', 'not_recommended'],
      default: 'not_recommended'
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  },
  heatmapData: {
    orderDensity: [[Number]], // 2D array representing order density
    revenueDensity: [[Number]], // 2D array representing revenue density
    competitorDensity: [[Number]], // 2D array representing competitor presence
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
areaSchema.index({ coordinates: '2dsphere' });
areaSchema.index({ city: 1, state: 1 });
areaSchema.index({ 'warehouseRecommendation.score': -1 });
areaSchema.index({ 'blinkitData.totalOrders': -1 });

// Virtual for total market size
areaSchema.virtual('totalMarketSize').get(function() {
  const blinkitOrders = this.blinkitData.totalOrders || 0;
  const zeptoOrders = this.competitorData.zepto.totalOrders || 0;
  const swiggyOrders = this.competitorData.swiggy.totalOrders || 0;
  return blinkitOrders + zeptoOrders + swiggyOrders;
});

// Virtual for Blinkit market share
areaSchema.virtual('blinkitMarketShare').get(function() {
  const totalMarket = this.totalMarketSize;
  if (totalMarket === 0) return 0;
  return (this.blinkitData.totalOrders / totalMarket) * 100;
});

// Method to calculate warehouse recommendation score
areaSchema.methods.calculateWarehouseScore = function() {
  let totalScore = 0;
  const factors = [];

  // Order volume factor (30% weight)
  const orderVolumeScore = Math.min(this.blinkitData.totalOrders / 100, 1) * 100;
  factors.push({
    name: 'Order Volume',
    weight: 30,
    score: orderVolumeScore,
    description: `High order volume: ${this.blinkitData.totalOrders} orders`
  });
  totalScore += (orderVolumeScore * 0.3);

  // Revenue factor (25% weight)
  const revenueScore = Math.min(this.blinkitData.totalRevenue / 100000, 1) * 100;
  factors.push({
    name: 'Revenue Generation',
    weight: 25,
    score: revenueScore,
    description: `Revenue: ₹${this.blinkitData.totalRevenue.toLocaleString()}`
  });
  totalScore += (revenueScore * 0.25);

  // Market share factor (20% weight)
  const marketShareScore = this.blinkitMarketShare;
  factors.push({
    name: 'Market Share',
    weight: 20,
    score: marketShareScore,
    description: `Market share: ${marketShareScore.toFixed(1)}%`
  });
  totalScore += (marketShareScore * 0.2);

  // Infrastructure factor (15% weight)
  let infrastructureScore = 0;
  if (this.infrastructure.hasMetro) infrastructureScore += 20;
  if (this.infrastructure.hasHighway) infrastructureScore += 20;
  if (this.infrastructure.hasMall) infrastructureScore += 20;
  if (this.infrastructure.hasHospital) infrastructureScore += 20;
  if (this.infrastructure.hasSchool) infrastructureScore += 20;
  
  factors.push({
    name: 'Infrastructure',
    weight: 15,
    score: infrastructureScore,
    description: 'Infrastructure availability assessment'
  });
  totalScore += (infrastructureScore * 0.15);

  // Population factor (10% weight)
  const populationScore = Math.min(this.population / 100000, 1) * 100;
  factors.push({
    name: 'Population',
    weight: 10,
    score: populationScore,
    description: `Population: ${this.population?.toLocaleString() || 'Unknown'}`
  });
  totalScore += (populationScore * 0.1);

  // Determine recommendation level
  let recommendation = 'not_recommended';
  if (totalScore >= 80) recommendation = 'high';
  else if (totalScore >= 60) recommendation = 'medium';
  else if (totalScore >= 40) recommendation = 'low';

  this.warehouseRecommendation = {
    score: Math.round(totalScore),
    factors,
    recommendation,
    lastCalculated: new Date()
  };

  return this.warehouseRecommendation;
};

// Static method to get areas by recommendation level
areaSchema.statics.getByRecommendation = function(level) {
  return this.find({ 'warehouseRecommendation.recommendation': level })
    .sort({ 'warehouseRecommendation.score': -1 });
};

// Static method to get top performing areas
areaSchema.statics.getTopPerforming = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'blinkitData.totalOrders': -1 })
    .limit(limit);
};

module.exports = mongoose.model('Area', areaSchema);
