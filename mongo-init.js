// MongoDB initialization script for Blinkit Analysis
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('blinkit-analysis');

// Create collections
db.createCollection('orders');
db.createCollection('areas');

// Create indexes for better performance
db.orders.createIndex({ "areaId": 1, "createdAt": -1 });
db.orders.createIndex({ "deliveryAddress.coordinates": "2dsphere" });
db.orders.createIndex({ "status": 1, "createdAt": -1 });

db.areas.createIndex({ "coordinates": "2dsphere" });
db.areas.createIndex({ "city": 1, "state": 1 });
db.areas.createIndex({ "warehouseRecommendation.score": -1 });
db.areas.createIndex({ "blinkitData.totalOrders": -1 });

// Insert sample area data for testing
db.areas.insertMany([
  {
    areaId: "nellore",
    name: "Nellore",
    city: "Nellore",
    state: "Andhra Pradesh",
    pincode: "524001",
    coordinates: {
      lat: 14.4426,
      lng: 79.9865
    },
    population: 558548,
    areaSize: 150.0,
    demographics: {
      avgIncome: 45000,
      avgAge: 32,
      familySize: 4.2,
      urbanizationLevel: "urban"
    },
    infrastructure: {
      hasMetro: false,
      hasHighway: true,
      hasAirport: false,
      hasMall: true,
      hasHospital: true,
      hasSchool: true
    },
    blinkitData: {
      totalOrders: 1250,
      totalRevenue: 875000,
      avgOrderValue: 700,
      customerCount: 450,
      deliveryTime: 45,
      lastUpdated: new Date()
    },
    competitorData: {
      zepto: {
        totalOrders: 890,
        avgOrderValue: 650,
        marketShare: 41.6,
        lastUpdated: new Date()
      },
      swiggy: {
        totalOrders: 720,
        avgOrderValue: 680,
        marketShare: 33.6,
        lastUpdated: new Date()
      }
    },
    warehouseRecommendation: {
      score: 78,
      factors: [
        {
          name: "Order Volume",
          weight: 30,
          score: 75,
          description: "High order volume: 1250 orders"
        },
        {
          name: "Revenue Generation",
          weight: 25,
          score: 70,
          description: "Revenue: ₹875,000"
        },
        {
          name: "Market Share",
          weight: 20,
          score: 85,
          description: "Market share: 43.8%"
        },
        {
          name: "Infrastructure",
          weight: 15,
          score: 80,
          description: "Infrastructure availability assessment"
        },
        {
          name: "Population",
          weight: 10,
          score: 75,
          description: "Population: 558,548"
        }
      ],
      recommendation: "high",
      lastCalculated: new Date()
    },
    heatmapData: {
      orderDensity: [],
      revenueDensity: [],
      competitorDensity: [],
      lastUpdated: new Date()
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    areaId: "guntur",
    name: "Guntur",
    city: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522001",
    coordinates: {
      lat: 16.2991,
      lng: 80.4575
    },
    population: 743354,
    areaSize: 168.0,
    demographics: {
      avgIncome: 52000,
      avgAge: 30,
      familySize: 4.0,
      urbanizationLevel: "urban"
    },
    infrastructure: {
      hasMetro: false,
      hasHighway: true,
      hasAirport: false,
      hasMall: true,
      hasHospital: true,
      hasSchool: true
    },
    blinkitData: {
      totalOrders: 980,
      totalRevenue: 686000,
      avgOrderValue: 700,
      customerCount: 380,
      deliveryTime: 42,
      lastUpdated: new Date()
    },
    competitorData: {
      zepto: {
        totalOrders: 650,
        avgOrderValue: 620,
        marketShare: 39.8,
        lastUpdated: new Date()
      },
      swiggy: {
        totalOrders: 520,
        avgOrderValue: 650,
        marketShare: 31.9,
        lastUpdated: new Date()
      }
    },
    warehouseRecommendation: {
      score: 72,
      factors: [
        {
          name: "Order Volume",
          weight: 30,
          score: 65,
          description: "Good order volume: 980 orders"
        },
        {
          name: "Revenue Generation",
          weight: 25,
          score: 60,
          description: "Revenue: ₹686,000"
        },
        {
          name: "Market Share",
          weight: 20,
          score: 80,
          description: "Market share: 45.5%"
        },
        {
          name: "Infrastructure",
          weight: 15,
          score: 80,
          description: "Infrastructure availability assessment"
        },
        {
          name: "Population",
          weight: 10,
          score: 85,
          description: "Population: 743,354"
        }
      ],
      recommendation: "medium",
      lastCalculated: new Date()
    },
    heatmapData: {
      orderDensity: [],
      revenueDensity: [],
      competitorDensity: [],
      lastUpdated: new Date()
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample order data for testing
db.orders.insertMany([
  {
    orderId: "ORD001",
    areaId: "nellore",
    customerId: "CUST001",
    total: 750,
    subtotal: 700,
    deliveryFee: 30,
    tax: 20,
    items: [
      {
        name: "Fresh Vegetables Pack",
        category: "Groceries",
        price: 200,
        quantity: 1,
        sku: "VEG001"
      },
      {
        name: "Organic Milk",
        category: "Dairy",
        price: 80,
        quantity: 2,
        sku: "DAIRY001"
      },
      {
        name: "Whole Wheat Bread",
        category: "Bakery",
        price: 40,
        quantity: 1,
        sku: "BAKERY001"
      }
    ],
    status: "delivered",
    paymentMethod: "online",
    deliveryAddress: {
      street: "123 Main Street",
      city: "Nellore",
      state: "Andhra Pradesh",
      pincode: "524001",
      coordinates: {
        lat: 14.4426,
        lng: 79.9865
      }
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    deliveryTime: 60,
    customerRating: 5,
    feedback: "Excellent service and fresh products!",
    source: "app"
  },
  {
    orderId: "ORD002",
    areaId: "nellore",
    customerId: "CUST002",
    total: 1200,
    subtotal: 1150,
    deliveryFee: 30,
    tax: 20,
    items: [
      {
        name: "Premium Rice",
        category: "Groceries",
        price: 150,
        quantity: 2,
        sku: "GROC001"
      },
      {
        name: "Fresh Fruits Basket",
        category: "Groceries",
        price: 300,
        quantity: 1,
        sku: "FRUIT001"
      },
      {
        name: "Organic Eggs",
        category: "Dairy",
        price: 120,
        quantity: 1,
        sku: "DAIRY002"
      }
    ],
    status: "out_for_delivery",
    paymentMethod: "cod",
    deliveryAddress: {
      street: "456 Park Avenue",
      city: "Nellore",
      state: "Andhra Pradesh",
      pincode: "524001",
      coordinates: {
        lat: 14.4426,
        lng: 79.9865
      }
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    deliveryTime: null,
    customerRating: null,
    feedback: null,
    source: "website"
  }
]);

print("MongoDB initialization completed successfully!");
print("Created collections: orders, areas");
print("Inserted sample data for testing");
print("Database: blinkit-analysis");
print("Collections: orders, areas");
