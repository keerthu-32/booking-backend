require('dotenv/config');
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'NOT SET';

console.log('Testing MongoDB connection...');
console.log('MONGO_URI set:', !!process.env.MONGO_URI);
console.log('Connection string prefix:', mongoUri.substring(0, 30) + '...');

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✓ MongoDB connected successfully!');
  console.log('✓ Database:', mongoose.connection.db.databaseName);
  process.exit(0);
})
.catch((error) => {
  console.error('✗ MongoDB connection failed:');
  console.error(error.message);
  process.exit(1);
});
