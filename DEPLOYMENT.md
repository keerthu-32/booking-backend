# Backend Deployment Guide for Render

## Prerequisites
- GitHub repository connected to Render
- MongoDB Atlas account (free tier available)
- Stripe account for payments
- Email service (SendGrid or Gmail)

## Environment Variables to Set on Render

### Required Variables
```
NODE_ENV=production
PORT=5000
API_VERSION=v1
FRONTEND_URL=https://booking-frontend-n6pv.onrender.com

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/flight_booking?retryWrites=true&w=majority

# JWT Secrets (Generate strong random strings)
JWT_ACCESS_SECRET=<generate-strong-secret-32-chars>
JWT_REFRESH_SECRET=<generate-different-strong-secret-32-chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Security
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=info
```

### Optional Variables (Add as needed)

#### Redis (for BullMQ job queues)
```
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
```

#### Stripe Payment
```
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Email - SendGrid
```
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Email - Gmail (Alternative)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### SMS - Twilio
```
TWILIO_ACCOUNT_SID=AC_your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Amadeus Flight API
```
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_BASE_URL=https://api.amadeus.com
```

## Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. **On Render Dashboard**
   - Go to your backend service
   - Navigate to "Environment" tab
   - Add all required environment variables
   - Click "Save Changes"

3. **Verify Deployment**
   - Check build logs for errors
   - Test health endpoint: `https://booking-backend-4-8bxx.onrender.com/health`
   - Test API endpoint: `https://booking-backend-4-8bxx.onrender.com/api/v1/flights/search`

## MongoDB Atlas Setup

1. Create free cluster at https://cloud.mongodb.com
2. Create database user with password
3. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
4. Get connection string and add to `MONGO_URI`

## Generate JWT Secrets

Use Node.js to generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

- **CORS errors**: Verify `FRONTEND_URL` is set correctly
- **Database connection fails**: Check MongoDB Atlas IP whitelist and connection string
- **404 errors**: Ensure you're using `/api/v1` prefix in API calls
- **Build fails**: Check build logs on Render dashboard

## Health Check

The backend includes a health check endpoint at `/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```
