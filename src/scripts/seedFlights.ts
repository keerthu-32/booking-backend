import 'dotenv/config';
import mongoose from 'mongoose';
import { Flight } from '../models/Flight';
import { User } from '../models/User';

const sampleFlights = [
  {
    flightNumber: 'AA101',
    airline: 'American Airlines',
    origin: {
      iataCode: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '8'
    },
    destination: {
      iataCode: 'LAX',
      city: 'Los Angeles',
      country: 'USA',
      terminal: '4'
    },
    departureTime: new Date('2026-06-01T08:00:00Z'),
    arrivalTime: new Date('2026-06-01T11:30:00Z'),
    duration: 330,
    stops: 0,
    aircraft: 'Boeing 777-300ER',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 200,
        availableSeats: 150,
        baseFare: 299,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 40,
        availableSeats: 25,
        baseFare: 899,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 12,
        availableSeats: 8,
        baseFare: 1499,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Meals', 'Power Outlets']
  },
  {
    flightNumber: 'DL205',
    airline: 'Delta Airlines',
    origin: {
      iataCode: 'ATL',
      city: 'Atlanta',
      country: 'USA',
      terminal: 'S'
    },
    destination: {
      iataCode: 'MIA',
      city: 'Miami',
      country: 'USA',
      terminal: 'N'
    },
    departureTime: new Date('2026-06-02T14:30:00Z'),
    arrivalTime: new Date('2026-06-02T16:45:00Z'),
    duration: 135,
    stops: 0,
    aircraft: 'Airbus A320',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 150,
        availableSeats: 100,
        baseFare: 189,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 20,
        availableSeats: 12,
        baseFare: 549,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'Snacks', 'Beverages']
  },
  {
    flightNumber: 'UA789',
    airline: 'United Airlines',
    origin: {
      iataCode: 'ORD',
      city: 'Chicago',
      country: 'USA',
      terminal: '1'
    },
    destination: {
      iataCode: 'SFO',
      city: 'San Francisco',
      country: 'USA',
      terminal: '3'
    },
    departureTime: new Date('2026-06-03T10:15:00Z'),
    arrivalTime: new Date('2026-06-03T13:00:00Z'),
    duration: 285,
    stops: 0,
    aircraft: 'Boeing 787-9 Dreamliner',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 180,
        availableSeats: 120,
        baseFare: 349,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 48,
        availableSeats: 30,
        baseFare: 999,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 8,
        availableSeats: 5,
        baseFare: 1799,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Premium Meals', 'Lie-flat Seats', 'Power Outlets']
  },
  {
    flightNumber: 'BA117',
    airline: 'British Airways',
    origin: {
      iataCode: 'LHR',
      city: 'London',
      country: 'UK',
      terminal: '5'
    },
    destination: {
      iataCode: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '7'
    },
    departureTime: new Date('2026-06-04T18:00:00Z'),
    arrivalTime: new Date('2026-06-04T21:30:00Z'),
    duration: 450,
    stops: 0,
    aircraft: 'Airbus A380',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 300,
        availableSeats: 200,
        baseFare: 599,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 80,
        availableSeats: 50,
        baseFare: 2499,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 14,
        availableSeats: 10,
        baseFare: 4999,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Gourmet Meals', 'Bar', 'Shower Spa', 'Power Outlets']
  },
  {
    flightNumber: 'EK215',
    airline: 'Emirates',
    origin: {
      iataCode: 'DXB',
      city: 'Dubai',
      country: 'UAE',
      terminal: '3'
    },
    destination: {
      iataCode: 'LAX',
      city: 'Los Angeles',
      country: 'USA',
      terminal: 'B'
    },
    departureTime: new Date('2026-06-05T03:00:00Z'),
    arrivalTime: new Date('2026-06-05T09:45:00Z'),
    duration: 945,
    stops: 0,
    aircraft: 'Airbus A380',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 350,
        availableSeats: 250,
        baseFare: 799,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 76,
        availableSeats: 45,
        baseFare: 3499,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 14,
        availableSeats: 8,
        baseFare: 7999,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Gourmet Meals', 'Onboard Lounge', 'Shower Spa', 'Private Suites']
  },
  {
    flightNumber: 'SW456',
    airline: 'Southwest Airlines',
    origin: {
      iataCode: 'LAS',
      city: 'Las Vegas',
      country: 'USA',
      terminal: '1'
    },
    destination: {
      iataCode: 'DEN',
      city: 'Denver',
      country: 'USA',
      terminal: 'W'
    },
    departureTime: new Date('2026-06-06T12:00:00Z'),
    arrivalTime: new Date('2026-06-06T14:15:00Z'),
    duration: 135,
    stops: 0,
    aircraft: 'Boeing 737-800',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 175,
        availableSeats: 130,
        baseFare: 129,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'Snacks', 'Free Checked Bags']
  },
  {
    flightNumber: 'AF083',
    airline: 'Air France',
    origin: {
      iataCode: 'CDG',
      city: 'Paris',
      country: 'France',
      terminal: '2E'
    },
    destination: {
      iataCode: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '1'
    },
    departureTime: new Date('2026-06-07T11:30:00Z'),
    arrivalTime: new Date('2026-06-07T14:15:00Z'),
    duration: 465,
    stops: 0,
    aircraft: 'Boeing 777-300ER',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 220,
        availableSeats: 160,
        baseFare: 649,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 58,
        availableSeats: 35,
        baseFare: 2799,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 8,
        availableSeats: 4,
        baseFare: 5499,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'French Cuisine', 'Champagne', 'Power Outlets']
  },
  {
    flightNumber: 'QF12',
    airline: 'Qantas',
    origin: {
      iataCode: 'SYD',
      city: 'Sydney',
      country: 'Australia',
      terminal: '1'
    },
    destination: {
      iataCode: 'LAX',
      city: 'Los Angeles',
      country: 'USA',
      terminal: 'B'
    },
    departureTime: new Date('2026-06-08T22:00:00Z'),
    arrivalTime: new Date('2026-06-09T06:30:00Z'),
    duration: 750,
    stops: 0,
    aircraft: 'Airbus A380',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 340,
        availableSeats: 220,
        baseFare: 899,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 70,
        availableSeats: 40,
        baseFare: 3999,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 14,
        availableSeats: 9,
        baseFare: 8999,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Premium Meals', 'Onboard Lounge', 'Lie-flat Beds']
  },
  {
    flightNumber: 'LH456',
    airline: 'Lufthansa',
    origin: {
      iataCode: 'FRA',
      city: 'Frankfurt',
      country: 'Germany',
      terminal: '1'
    },
    destination: {
      iataCode: 'ORD',
      city: 'Chicago',
      country: 'USA',
      terminal: '5'
    },
    departureTime: new Date('2026-06-09T16:45:00Z'),
    arrivalTime: new Date('2026-06-09T19:30:00Z'),
    duration: 525,
    stops: 0,
    aircraft: 'Boeing 747-8',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 250,
        availableSeats: 180,
        baseFare: 699,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 80,
        availableSeats: 55,
        baseFare: 2999,
        currency: 'USD'
      },
      {
        type: 'first',
        totalSeats: 8,
        availableSeats: 6,
        baseFare: 6499,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Premium Meals', 'Bar', 'Power Outlets']
  },
  {
    flightNumber: 'SQ25',
    airline: 'Singapore Airlines',
    origin: {
      iataCode: 'SIN',
      city: 'Singapore',
      country: 'Singapore',
      terminal: '3'
    },
    destination: {
      iataCode: 'JFK',
      city: 'New York',
      country: 'USA',
      terminal: '4'
    },
    departureTime: new Date('2026-06-10T23:30:00Z'),
    arrivalTime: new Date('2026-06-11T06:00:00Z'),
    duration: 1110,
    stops: 0,
    aircraft: 'Airbus A350-900ULR',
    status: 'scheduled',
    cabinClasses: [
      {
        type: 'economy',
        totalSeats: 94,
        availableSeats: 60,
        baseFare: 1299,
        currency: 'USD'
      },
      {
        type: 'business',
        totalSeats: 67,
        availableSeats: 40,
        baseFare: 5999,
        currency: 'USD'
      }
    ],
    amenities: ['WiFi', 'In-flight Entertainment', 'Gourmet Meals', 'Lie-flat Beds', 'Premium Amenity Kits']
  }
];

async function seedFlights() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@flightbook.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        firstName: 'FlightBook',
        lastName: 'Admin',
        email: adminEmail,
        passwordHash: adminPassword,
        phone: '+10000000000',
        role: 'admin',
        isVerified: true,
      });
      console.log(`✓ Created admin user: ${adminEmail}`);
    } else if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      existingAdmin.passwordHash = adminPassword;
      await existingAdmin.save();
      console.log(`✓ Promoted existing user to admin: ${adminEmail}`);
    } else {
      console.log(`✓ Admin user already exists: ${adminEmail}`);
    }

    // Clear existing flights
    console.log('Clearing existing flights...');
    await Flight.deleteMany({});
    console.log('✓ Cleared existing flights');

    // Insert sample flights
    console.log('Inserting sample flights...');
    const result = await Flight.insertMany(sampleFlights);
    console.log(`✓ Successfully inserted ${result.length} flights`);

    // Display inserted flights
    console.log('\nInserted Flights:');
    result.forEach((flight, index) => {
      console.log(`${index + 1}. ${flight.flightNumber} - ${flight.airline}`);
      console.log(`   ${flight.origin.city} (${flight.origin.iataCode}) → ${flight.destination.city} (${flight.destination.iataCode})`);
      console.log(`   Departure: ${flight.departureTime.toISOString()}`);
      console.log(`   Economy: $${flight.cabinClasses.find(c => c.type === 'economy')?.baseFare}`);
      console.log('');
    });

    console.log('✓ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding flights:', error);
    process.exit(1);
  }
}

// Run the seed function
seedFlights();
