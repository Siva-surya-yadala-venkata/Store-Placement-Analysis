const { Kafka } = require('kafkajs');

class KafkaService {
  constructor() {
    this.producer = null;
    this.consumer = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  async initialize() {
    try {
      console.log('🚀 Attempting to connect to Kafka...');
      
      // Create Kafka instance
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'blinkit-analysis-client',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        retry: {
          initialRetryTime: 1000,
          retries: 3
        }
      });

      // Try to connect with timeout
      await this.connectWithTimeout();
      
    } catch (error) {
      console.log('⚠️  Kafka connection failed, continuing without Kafka...');
      console.log('💡 You can still use all features - real-time data will be simulated');
      this.isConnected = false;
    }
  }

  async connectWithTimeout() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Kafka connection timeout'));
      }, 10000); // 10 second timeout

      this.connect()
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  async connect() {
    try {
      // Test connection by creating a simple producer
      this.producer = this.kafka.producer();
      await this.producer.connect();
      
      // Test connection by creating a simple consumer
      this.consumer = this.kafka.consumer({
        groupId: process.env.KAFKA_GROUP_ID || 'blinkit-analysis-group'
      });
      await this.consumer.connect();
      
      this.isConnected = true;
      console.log('✅ Successfully connected to Kafka');
      
      // Start consuming messages
      await this.startConsumer();
      
    } catch (error) {
      console.error('❌ Kafka connection error:', error.message);
      throw error;
    }
  }

  async startConsumer() {
    if (!this.consumer || !this.isConnected) return;

    try {
      await this.consumer.subscribe({ 
        topic: 'location-data-update', 
        fromBeginning: false 
      });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            console.log(`📨 Received message from ${topic}:`, data.location?.name);
            
            // Here you would emit to Socket.IO if available
            // For now, just log the message
            
          } catch (error) {
            console.error('Error processing Kafka message:', error);
          }
        }
      });

      console.log('✅ Kafka consumer started successfully');
      
    } catch (error) {
      console.error('❌ Error starting Kafka consumer:', error);
    }
  }

  async publishMessage(topic, message) {
    if (!this.producer || !this.isConnected) {
      console.log(`📤 Simulating Kafka publish to ${topic}:`, message.location?.name || 'Unknown');
      return true;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          { 
            value: JSON.stringify(message),
            timestamp: Date.now()
          }
        ]
      });
      
      console.log(`✅ Message published to ${topic}:`, message.location?.name || 'Unknown');
      return true;
      
    } catch (error) {
      console.error(`❌ Error publishing to ${topic}:`, error);
      return false;
    }
  }

  async stop() {
    try {
      if (this.producer && this.isConnected) {
        await this.producer.disconnect();
      }
      
      if (this.consumer && this.isConnected) {
        await this.consumer.disconnect();
      }
      
      this.isConnected = false;
      console.log('✅ Kafka service stopped');
      
    } catch (error) {
      console.error('❌ Error stopping Kafka service:', error);
    }
  }

  // Helper method to check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

module.exports = new KafkaService();
