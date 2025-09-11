const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  sku: String
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  areaId: {
    type: String,
    required: true,
    index: true
  },
  customerId: String,
  total: {
    type: Number,
    required: true
  },
  subtotal: Number,
  deliveryFee: Number,
  tax: Number,
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cod', 'wallet'],
    default: 'online'
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deliveredAt: Date,
  deliveryTime: Number, // in minutes
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  source: {
    type: String,
    enum: ['app', 'website', 'phone'],
    default: 'app'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ areaId: 1, createdAt: -1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Static method to get area statistics
orderSchema.statics.getAreaStats = async function(areaId, startDate, endDate) {
  const matchStage = {
    areaId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalValue: { $sum: '$total' },
        avgOrderValue: { $avg: '$total' },
        avgDeliveryTime: { $avg: '$deliveryTime' },
        avgRating: { $avg: '$customerRating' }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalValue: 0,
    avgOrderValue: 0,
    avgDeliveryTime: 0,
    avgRating: 0
  };
};

// Static method to get peak hours
orderSchema.statics.getPeakHours = async function(areaId, startDate, endDate) {
  const matchStage = {
    areaId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const peakHours = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return peakHours.map(hour => ({
    hour: hour._id,
    count: hour.count
  }));
};

// Static method to get popular categories
orderSchema.statics.getPopularCategories = async function(areaId, startDate, endDate) {
  const matchStage = {
    areaId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const categories = await this.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        count: { $sum: '$items.quantity' },
        totalValue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return categories;
};

module.exports = mongoose.model('Order', orderSchema);
