# Flight Booking Backend

A comprehensive flight booking system backend built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Flight Management**: Search, filter, and manage flight listings
- **Booking System**: Create, view, cancel bookings with real-time seat availability
- **Payment Integration**: Razorpay payment gateway integration
- **Admin Dashboard**: Analytics, reports, and booking management for administrators
- **Real-time Updates**: WebSocket support for live booking and payment status
- **Notifications**: Email and in-app notification system

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local instance or MongoDB Atlas)
- **Git**

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flight-booking?retryWrites=true&w=majority

# JWT Secrets
JWT_ACCESS_SECRET=your_access_token_secret_key
JWT_REFRESH_SECRET=your_refresh_token_secret_key

# CORS
FRONTEND_URL=http://localhost:5173

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/booking-backend.git
cd booking-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Initialize the database with seed data (optional):
```bash
npm run seed:flights
npm run ensure:admin
```

## Running Locally

### Development Mode (with hot reload):
```bash
npm run dev
```

The server will start at `http://localhost:5000`

### Production Mode:
```bash
npm run build
npm start
```

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile

### Flight Endpoints

- `GET /api/v1/flights` - Search flights with filters
- `GET /api/v1/flights/:id` - Get flight details
- `GET /api/v1/flights/airports` - Get available airports
- `POST /api/v1/flights` - Create flight (admin only)
- `PUT /api/v1/flights/:id` - Update flight (admin only)
- `DELETE /api/v1/flights/:id` - Delete flight (admin only)

### Booking Endpoints

- `POST /api/v1/bookings` - Create new booking
- `GET /api/v1/bookings` - Get user's bookings
- `GET /api/v1/bookings/:id` - Get booking details
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking
- `GET /api/v1/bookings/flights/:flightId/occupied-seats` - Get occupied seats
- `GET /api/v1/bookings/insights` - Get homepage insights
- `GET /api/v1/bookings/admin/all` - Get all bookings (admin only)
- `GET /api/v1/bookings/admin/analytics` - Get analytics dashboard (admin only)

### Payment Endpoints

- `POST /api/v1/payments/create-order` - Create Razorpay order
- `POST /api/v1/payments/verify` - Verify payment signature
- `GET /api/v1/payments/:id` - Get payment details

## Database Seeding

### Seed Flight Data:
```bash
npm run seed:flights
```

### Create Admin User:
```bash
npm run ensure:admin
```
This creates an admin account with:
- Email: `admin@flightbook.com`
- Password: `Admin@123`

## Project Structure

```
booking-backend/
├── src/
│   ├── config/          # Database and logger configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication and error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── validators/      # Request validation schemas
│   ├── realtime/        # WebSocket configuration
│   └── app.ts           # Express app entry point
├── logs/                # Application logs
├── .env                 # Environment variables
└── package.json
```

## Deployment

### Deploy to Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Configure environment variables in Render dashboard
5. Set build command: `npm install && npm run build`
6. Set start command: `node dist/app.js`

See `DEPLOYMENT.md` for detailed deployment instructions.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### MongoDB Connection Issues
- Verify your `MONGO_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure MongoDB service is running (for local instances)

### Payment Integration Issues
- Verify Razorpay credentials are correct
- Check if Razorpay keys are for the correct environment (test/live)

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript version compatibility
- Ensure all dependencies are production dependencies if deploying

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the GitHub repository.
