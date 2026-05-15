import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flight_booking';

    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    process.exit(1);
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
