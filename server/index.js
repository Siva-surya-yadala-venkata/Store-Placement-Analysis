const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import services
const kafkaService = require('./services/kafkaService');
const realTimeScrapingService = require('./services/realTimeScrapingService');

// Import routes
const orderRoutes = require('./routes/orderRoutes');
const areaRoutes = require('./routes/areaRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blinkit-analysis', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-location', (locationName) => {
    socket.join(`location-${locationName}`);
    console.log(`📍 Client ${socket.id} joined location: ${locationName}`);
  });

  socket.on('leave-location', (locationName) => {
    socket.leave(`location-${locationName}`);
    console.log(`📍 Client ${socket.id} left location: ${locationName}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      kafka: 'initializing',
      scraping: 'initializing'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Kafka service
    console.log('🚀 Initializing Kafka service...');
    await kafkaService.initialize();
    console.log('✅ Kafka service initialized');

    // Initialize real-time scraping service
    console.log('🚀 Initializing real-time scraping service...');
    await realTimeScrapingService.initialize();
    console.log('✅ Real-time scraping service initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Real-time data scraping: ${process.env.SCRAPING_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`⏱️  Scraping interval: ${process.env.SCRAPING_INTERVAL || 10000}ms`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    await realTimeScrapingService.stop();
    await kafkaService.stop();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  try {
    await realTimeScrapingService.stop();
    await kafkaService.stop();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();
