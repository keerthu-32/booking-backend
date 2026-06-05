import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flight_booking';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@flightbook.com').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

async function ensureAdmin() {
  try {
    await mongoose.connect(mongoUri);

    const existingUser = await User.findOne({ email: adminEmail });

    if (!existingUser) {
      await User.create({
        firstName: 'FlightBook',
        lastName: 'Admin',
        email: adminEmail,
        passwordHash: adminPassword,
        phone: '+10000000000',
        role: 'admin',
        isVerified: true,
      });
      console.log(`Admin user created: ${adminEmail}`);
      return;
    }

    existingUser.role = 'admin';
    existingUser.isVerified = true;
    existingUser.passwordHash = adminPassword;
    await existingUser.save();

    console.log(`Admin user repaired: ${adminEmail}`);
  } finally {
    await mongoose.disconnect();
  }
}

ensureAdmin().catch((error) => {
  console.error('Failed to ensure admin user:', error);
  process.exit(1);
});
