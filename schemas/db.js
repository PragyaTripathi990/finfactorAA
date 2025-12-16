const mongoose = require('mongoose');

/**
 * MongoDB Connection Configuration
 */
const DB_CONFIG = {
  // Default MongoDB URI (update with your MongoDB connection string)
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finfactor_aa',
  options: {
    // Mongoose connection options
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(DB_CONFIG.uri, DB_CONFIG.options);
    console.log('✅ MongoDB connected successfully');
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnect error:', error);
    throw error;
  }
}

/**
 * Get connection status
 */
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Check if connected
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  isConnected,
  mongoose
};

