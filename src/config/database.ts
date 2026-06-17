import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flight_booking';

    if (!process.env.MONGO_URI) {
      console.warn('⚠ MONGO_URI not set, using default localhost connection');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected successfully');
    console.log('✓ Database:', mongoose.connection.db?.databaseName);

    // Programmatically drop legacy single flightNumber unique index if it exists
    // to allow consecutive daily flights with the same flightNumber.
    mongoose.connection.db?.collection('flights').dropIndex('flightNumber_1').catch((err) => {
      if (err.codeName !== 'IndexNotFound') {
        console.log('Note: Legacy flightNumber index drop skipped/failed:', err.message);
      }
    });
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    console.error('✗ Connection string prefix:', process.env.MONGO_URI?.substring(0, 30));
    throw error; // Don't exit, let the app handle it
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error);
  }
};

export const dropDatabase = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Database drop is only allowed in test environment');
    }
    await mongoose.connection.db?.dropDatabase();
    console.log('✓ Database dropped');
  } catch (error) {
    console.error('✗ Database drop failed:', error);
  }
};
