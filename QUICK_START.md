# Quick Start: Running the Implementation

## Prerequisites
- Node.js 18+ installed
- PostgreSQL running (as per docker-compose.yml)
- Redis running (for caching and rate limiting)

## Step 1: Install Dependencies

```bash
# Server
cd elspace/server
npm install

# Client
cd ../client
npm install
```

## Step 2: Environment Setup

The `.env.local` files have been created with your credentials:
- `elspace/server/.env.local` - Server configuration
- `elspace/client/.env.local` - Client configuration

**Important:** These files contain sensitive credentials. Do NOT commit these to git.

## Step 3: Database Setup

```bash
cd elspace/server

# Create migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed test data (optional)
npm run db:seed
```

## Step 4: Run Development Servers

**Terminal 1 - Backend:**
```bash
cd elspace/server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd elspace/client
npm run dev
# Client runs on http://localhost:3000
```

## Step 5: Test the Implementation

### Test Wallet System
1. Go to `http://localhost:3000/wallet/withdrawals`
2. Click "Request Withdrawal"
3. Fill in details for your preferred payment method
4. Submit the request
5. Check your email for confirmation

### Test Admin Dashboard
1. Go to `http://localhost:3000/admin-login`
2. Log in with admin credentials (check database seed)
3. Navigate to "Withdrawals" tab
4. See pending withdrawal requests
5. Click "Approve" or "Reject"

### Test Cloudinary Upload
Files uploaded through the platform will be stored in Cloudinary with the folder structure: `elspace/{document-type}`

### Test Email Service
All withdrawal notifications are sent through Brevo:
- Withdrawal request confirmation
- Withdrawal approval notification
- Withdrawal rejection with reason

## Troubleshooting

### `ECONNREFUSED` Error
- Ensure PostgreSQL is running on localhost:5432
- Ensure Redis is running on localhost:6379
- Check DATABASE_URL in .env.local

### Upload Failures
- Verify Cloudinary credentials in .env.local
- Check that CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET are correct

### Email Not Sending
- Verify BREVO_API_KEY is correct
- Check that BREVO_SENDER_EMAIL is set
- Ensure your Brevo account has credits

### JWT Token Errors
- Verify JWT_SECRET is set in .env.local
- Check that tokens are being sent with "Bearer" prefix

## API Endpoints (requires authentication)

### Wallet Endpoints
```
GET    /api/wallet              - Get wallet
GET    /api/wallet/summary      - Get wallet summary
GET    /api/wallet/transactions - Get transaction history
POST   /api/wallet/deposit      - Add funds
POST   /api/wallet/withdrawal   - Request withdrawal
POST   /api/wallet/transfer     - Transfer between users
```

### Admin Endpoints (requires ADMIN role)
```
GET    /api/admin/dashboard           - Dashboard overview
GET    /api/admin/users               - Get users
GET    /api/admin/transactions        - Get transactions
GET    /api/admin/withdrawals         - Get withdrawals
POST   /api/admin/withdrawals/:id/approve - Approve
POST   /api/admin/withdrawals/:id/reject  - Reject
POST   /api/admin/notifications/send  - Send notification
POST   /api/admin/email/broadcast     - Broadcast email
GET    /api/admin/analytics           - Get analytics
```

## Next Steps

1. **Rotate Credentials** (URGENT)
   - Log into Cloudinary and regenerate API keys
   - Log into Brevo and regenerate API keys
   - Update .env.local with new credentials

2. **Customize Email Templates**
   - Edit Brevo email templates for withdrawal confirmations
   - Brand emails with your logo and colors

3. **Test in Staging**
   - Set up a staging environment
   - Test full withdrawal workflow
   - Load test admin dashboard

4. **Connect Real Payment Processor**
   - Integrate Stripe or PayPal for actual payouts
   - Set up webhook handlers for payment confirmations

5. **Deploy to Production**
   - Use your hosting platform's secrets manager
   - Enable HTTPS
   - Set up monitoring and alerting

## Support

For issues or questions:
1. Check the IMPLEMENTATION_SUMMARY.md for detailed documentation
2. Review error messages in server/client console logs
3. Check that all environment variables are set correctly
4. Verify database connectivity

## Files You Should Know About

- `IMPLEMENTATION_SUMMARY.md` - Complete technical documentation
- `server/src/modules/wallet/` - Wallet business logic
- `server/src/modules/admin/` - Admin operations
- `server/src/modules/email/` - Email service
- `server/src/modules/upload/` - File upload service
- `client/src/app/(main)/wallet/withdrawals/` - Withdrawal UI
- `client/src/app/(main)/admin/` - Admin dashboard

