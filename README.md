# Blinkit Store Placement Analysis

A dynamic web application for Blinkit to analyze store placement opportunities using real-time data, heatmaps, and competitive analysis. This MERN stack application with Kafka integration provides comprehensive insights for warehouse placement decisions.

## 🚀 Features

### Core Functionality
- **Real-time Order Analysis**: Live tracking of Blinkit orders across different areas
- **Competitive Intelligence**: Analysis of Zepto and Swiggy Instamart performance
- **Warehouse Recommendations**: AI-powered scoring system for optimal warehouse placement
- **Heatmap Visualization**: Interactive maps showing order density and revenue patterns
- **Area Performance Metrics**: Comprehensive analytics for each geographical area

### Key Metrics Analyzed
1. **Order Volume & Value**: Total orders and average order value per area
2. **Market Share Analysis**: Blinkit's position vs competitors
3. **Infrastructure Assessment**: Metro, highways, malls, hospitals, schools
4. **Population Demographics**: Income levels, urbanization, family size
5. **Operational Insights**: Peak hours, popular categories, delivery times

### Real-time Capabilities
- Live order updates via WebSocket connections
- Kafka streaming for real-time data processing
- Instant competitor data updates
- Real-time dashboard refreshes

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful APIs**: Comprehensive endpoints for data retrieval and analysis
- **MongoDB**: Scalable document database for storing area and order data
- **Kafka Integration**: Real-time message streaming and processing
- **Socket.IO**: WebSocket support for live updates
- **JWT Authentication**: Secure API access

### Frontend (React)
- **Modern UI/UX**: Responsive design with Tailwind CSS
- **Real-time Updates**: Live data visualization and notifications
- **Interactive Maps**: Leaflet integration for geographical analysis
- **Charts & Graphs**: Recharts for data visualization
- **Mobile Responsive**: Optimized for all device sizes

### Data Processing
- **Real-time Analytics**: Live calculation of warehouse scores
- **Competitive Analysis**: Automated competitor data processing
- **Heatmap Generation**: Dynamic heatmap data based on real metrics
- **Trend Analysis**: Historical data analysis and forecasting

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Kafka** - Message streaming
- **Socket.IO** - Real-time communication
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Styling framework
- **Recharts** - Chart library
- **Leaflet** - Mapping library
- **Socket.IO Client** - Real-time updates
- **React Query** - Data fetching

### DevOps & Tools
- **Docker** - Containerization
- **Kafka** - Message broker
- **MongoDB Atlas** - Cloud database
- **Git** - Version control

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **Apache Kafka** (local or cloud instance)
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd blinkit-store-placement-analysis
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Copy the environment example file and configure your variables:
```bash
cp env.example .env
```

Update the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/blinkit-analysis

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=blinkit-analysis-client
KAFKA_GROUP_ID=blinkit-analysis-group

# API Keys (Get these from respective services)
BLINKIT_API_KEY=your_blinkit_api_key
ZEPTO_API_KEY=your_zepto_api_key
SWIGGY_API_KEY=your_swiggy_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Start Services

#### Start MongoDB
```bash
# Local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Start Kafka
```bash
# Local Kafka (requires Java)
# Download and start Kafka from https://kafka.apache.org/downloads

# Or use Docker
docker-compose up -d kafka
```

#### Start the Application
```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only
npm run client
```

## 🌐 API Endpoints

### Orders
- `GET /api/orders/area/:areaId` - Get orders for a specific area
- `GET /api/orders/area/:areaId/stats` - Get order statistics
- `GET /api/orders/area/:areaId/realtime` - Get real-time orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:orderId/status` - Update order status

### Areas
- `GET /api/areas` - Get all areas with filtering
- `GET /api/areas/:areaId` - Get specific area details
- `GET /api/areas/recommendation/:level` - Get areas by recommendation level
- `GET /api/areas/top-performing` - Get top performing areas
- `POST /api/areas` - Create new area
- `PUT /api/areas/:areaId` - Update area data
- `POST /api/areas/:areaId/refresh` - Refresh area data from APIs

### Analysis
- `GET /api/analysis/area/:areaId` - Get comprehensive area analysis
- `GET /api/analysis/comparative` - Get comparative analysis across areas
- `GET /api/analysis/heatmap/:areaId` - Get heatmap data
- `GET /api/analysis/warehouse-recommendations` - Get warehouse recommendations
- `GET /api/analysis/dashboard` - Get dashboard data

## 📊 Data Models

### Order Schema
```javascript
{
  orderId: String,
  areaId: String,
  total: Number,
  items: [OrderItem],
  status: String,
  deliveryAddress: Object,
  createdAt: Date,
  customerRating: Number
}
```

### Area Schema
```javascript
{
  areaId: String,
  name: String,
  coordinates: {lat: Number, lng: Number},
  population: Number,
  infrastructure: Object,
  blinkitData: Object,
  competitorData: Object,
  warehouseRecommendation: Object
}
```

## 🔄 Real-time Features

### WebSocket Events
- `new-order` - New order received
- `competitor-update` - Competitor data updated
- `analysis-update` - Area analysis updated

### Kafka Topics
- `blinkit-orders` - Order data streaming
- `competitor-data` - Competitor information
- `area-analysis` - Analysis results

## 📱 Usage Examples

### 1. View Dashboard
Navigate to the main dashboard to see:
- Real-time order statistics
- Top performing areas
- Warehouse recommendations
- Live updates

### 2. Area Analysis
Click on any area to view:
- Detailed performance metrics
- Competitive analysis
- Infrastructure assessment
- Warehouse score calculation

### 3. Map View
Use the interactive map to:
- Visualize order density
- Compare areas geographically
- Identify warehouse opportunities
- View real-time data

### 4. Real-time Orders
Monitor live order activity:
- New order notifications
- Status updates
- Delivery tracking
- Performance metrics

## 🔧 Configuration Options

### Time Ranges
- Last Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days

### Recommendation Levels
- High (80-100 score)
- Medium (60-79 score)
- Low (40-59 score)
- Not Recommended (<40 score)

### Heatmap Types
- Order Density
- Revenue Density
- Competitor Presence

## 🚨 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongod --version
# Start MongoDB service
sudo systemctl start mongod
```

#### Kafka Connection Error
```bash
# Check Kafka status
kafka-topics.sh --list --bootstrap-server localhost:9092
# Start Kafka service
bin/kafka-server-start.sh config/server.properties
```

#### Frontend Build Error
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=*
```

## 📈 Performance Optimization

### Database Indexes
- Area coordinates (2dsphere)
- Order timestamps
- Area performance scores

### Caching Strategy
- Redis for frequently accessed data
- In-memory caching for real-time metrics
- CDN for static assets

### Scaling Considerations
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Microservices architecture for specific features

## 🔒 Security Features

- JWT token authentication
- API rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Machine learning for predictive analytics
- Advanced heatmap algorithms
- Mobile application
- Integration with more competitor platforms
- Advanced reporting and exports
- Multi-language support

---

**Built with ❤️ for Blinkit's growth and success**
