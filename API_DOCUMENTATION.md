# BlockHeaven Server API Documentation

## Overview
BlockHeaven server provides a comprehensive API for managing users, FAQs, testimonials, and contact forms with proper authentication and authorization.

## Authentication
Most endpoints require authentication using Bearer tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Contact Form Endpoints

### Public Endpoints
- `POST /api/contact` - Submit contact form (No authentication required)

### Protected Endpoints (Authenticated Users)
- `GET /api/contacts` - Get all contact submissions
- `GET /api/contacts/:id` - Get specific contact submission
- `DELETE /api/contacts/:id` - Delete contact submission

### Contact Form Submission Details

#### POST /api/contact
Submit a contact form. This endpoint is public and doesn't require authentication.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "subject": "Inquiry about services",
  "message": "I would like to know more about your blockchain services."
}
```

**Required Fields:**
- `name` (string, max 100 characters)
- `email` (string, max 255 characters, valid email format)
- `message` (string, max 2000 characters)

**Optional Fields:**
- `phone` (string, max 20 characters)
- `subject` (string, max 200 characters)

**Response (201 Created):**
```json
{
  "message": "Contact form submitted successfully! We'll get back to you soon.",
  "contact": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-10-01T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - Server or email sending errors

#### GET /api/contacts
Get all contact form submissions (Admin only).

**Response (200 OK):**
```json
{
  "message": "Contacts retrieved successfully",
  "contacts": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "subject": "Inquiry about services",
      "message": "I would like to know more...",
      "createdAt": "2025-10-01T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/contacts/:id
Get a specific contact submission by ID (Admin only).

#### DELETE /api/contacts/:id
Delete a contact submission (Admin only).

### Email Configuration
When a contact form is submitted, an email notification is automatically sent to the configured admin email address with the contact details.

## User Endpoints

### Public Endpoints
- `POST /api/users/signup` - User registration
- `POST /api/users/login` - User login (supports 2FA)
- `POST /api/users/verify-2fa` - Verify two-factor authentication code

### Protected Endpoints (Authenticated Users)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Update password
- `PUT /api/users/enable-2fa` - Enable two-factor authentication
- `PUT /api/users/disable-2fa` - Disable two-factor authentication

## FAQ Endpoints

### Public Endpoints
- `GET /api/faqs/public` - Get active FAQs for public display
  - Query params: `search` (optional)
- `GET /api/faqs/search` - Search FAQs
  - Query params: `keyword`, `active_only` (true/false)

### Protected Endpoints (Authenticated Users)
- `GET /api/faqs/:id` - Get FAQ by ID

### Admin-Only Endpoints
- `GET /api/faqs` - Get all FAQs
  - Query params: `is_active` (true/false), `search`
- `POST /api/faqs` - Create new FAQ
- `PUT /api/faqs/:id` - Update FAQ
- `DELETE /api/faqs/:id` - Delete FAQ
- `PATCH /api/faqs/:id/toggle` - Toggle FAQ status
- `PATCH /api/faqs/:id/pause` - Pause FAQ
- `PATCH /api/faqs/:id/activate` - Activate FAQ
- `GET /api/faqs/admin/stats` - Get FAQ statistics
- `POST /api/faqs/bulk/status` - Bulk update FAQ status

## Testimonial Endpoints

### Public Endpoints
- `GET /api/testimonials/public` - Get approved testimonials
  - Query params: `rating` (1-5, optional)

### Protected Endpoints (Logged-in Users)
- `GET /api/testimonials/my` - Get user's own testimonial
- `POST /api/testimonials` - Create new testimonial
- `PUT /api/testimonials/:id` - Update testimonial (own testimonial)
- `DELETE /api/testimonials/:id` - Delete testimonial (own testimonial)
- `GET /api/testimonials/:id` - Get testimonial by ID

### Admin-Only Endpoints
- `GET /api/testimonials` - Get all testimonials
  - Query params: `is_approved` (true/false), `rating` (1-5), `userId`
- `GET /api/testimonials/admin/pending` - Get pending testimonials
- `GET /api/testimonials/admin/stats` - Get testimonial statistics
- `PATCH /api/testimonials/:id/approve` - Approve testimonial
- `PATCH /api/testimonials/:id/reject` - Reject testimonial
- `POST /api/testimonials/bulk/approve` - Bulk approve testimonials
- `POST /api/testimonials/bulk/reject` - Bulk reject testimonials

## Service Fee Endpoints

### Public Endpoints
- `GET /api/service-fees/current` - Get current service fee configuration
- `GET /api/service-fees/calculate` - Calculate service fee for amount
  - Query params: `amount` (required)
- `GET /api/service-fees/calculate-base` - Calculate base amount from total
  - Query params: `totalAmount` (required)

### Admin-Only Endpoints
- `PUT /api/service-fees` - Update service fee configuration
- `POST /api/service-fees/set-floating` - Set floating rate percentage
- `POST /api/service-fees/set-fixed` - Set fixed rate percentage
- `GET /api/service-fees/history` - Get service fee configuration history
- `GET /api/service-fees/stats` - Get service fee statistics
- `POST /api/service-fees/reset` - Reset to default configuration
- `POST /api/service-fees/validate` - Validate service fee configuration

## Request/Response Examples

### User Signup
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "customer"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response (Normal Login - No 2FA):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "customer",
      "two_factor_enabled": false
    },
    "token": "jwt-token"
  }
}
```

**Response (2FA Required):**
```json
{
  "success": true,
  "requiresTwoFactor": true,
  "message": "Two-factor authentication code sent to your email",
  "pendingToken": "pending-token-for-verification"
}
```

### Two-Factor Authentication Verification
```bash
curl -X POST http://localhost:3000/api/users/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "pendingToken": "pending-token-received-from-login"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "customer",
      "two_factor_enabled": true
    },
    "token": "jwt-token"
  }
}
```

### Enable Two-Factor Authentication
```bash
curl -X PUT http://localhost:3000/api/users/enable-2fa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully"
}
```

### Disable Two-Factor Authentication
```bash
curl -X PUT http://localhost:3000/api/users/disable-2fa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication disabled successfully"
}
```

### Create Testimonial
```bash
curl -X POST http://localhost:3000/api/testimonials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "rating": 5,
    "text": "Great service! Highly recommend."
  }'
```

### Create FAQ (Admin Only)
```bash
curl -X POST http://localhost:3000/api/faqs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "question": "How do I get started?",
    "answer": "Simply sign up and follow our onboarding guide.",
    "is_active": true
  }'
```

### Calculate Service Fee
```bash
curl -X GET "http://localhost:3000/api/service-fees/calculate?amount=100.00"
```

### Set Service Fee Rate (Admin Only)
```bash
curl -X POST http://localhost:3000/api/service-fees/set-floating \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "percentage": 2.5
  }'
```

## Key Features

### User Management
- User registration and authentication
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (admin/customer)
- Profile management

### FAQ Management
- CRUD operations for FAQs
- Public access to active FAQs
- Admin-only management features
- Search functionality
- Bulk operations
- Statistics dashboard

### Testimonial Management
- User-submitted testimonials
- Admin approval workflow
- Rating system (1-5 stars)
- CRUD operations with proper authorization
- Bulk approval/rejection
- Statistics and analytics

### Service Fee Management
- Configurable service fee rates
- Two service types: fixed-rate and floating (both percentage-based)
- Real-time fee calculations
- Configuration history tracking
- Admin-only management
- Automatic calculation for transactions

### Security Features
- JWT token authentication
- Role-based authorization
- Input validation and sanitization
- SQL injection prevention
- Password hashing and salting

## Environment Variables
Create a `.env` file in the root directory:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=blockhaven
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

## Database Schema
The application uses PostgreSQL with TypeORM. The main entities are:
- **User**: User accounts with authentication
- **FAQ**: Frequently asked questions
- **Testimonial**: User testimonials with approval workflow
- **ServiceFee**: Configurable service fee rates with history tracking

## Running the Server
```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Clean build files
npm run clean
```

## Error Handling
All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "details": "Additional error details (in development)"
}
```

## Success Responses
All successful responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## Exchange Endpoints (ChangeNow Integration)

### Public Endpoints
- `GET /api/exchanges/currencies` - Get available currencies for exchange
- `GET /api/exchanges/estimate` - Get estimated exchange amount
  - Query params: `fromCurrency`, `toCurrency`, `fromAmount`, `fromNetwork` (optional), `toNetwork` (optional), `flow` (optional), `type` (optional)
- `POST /api/exchanges` - Create new exchange transaction (No authentication required)

### Protected Endpoints (Authenticated Users)
- `GET /api/exchanges` - Get all user's exchange transactions
- `GET /api/exchanges/:id` - Get specific exchange by ID
- `GET /api/exchanges/transaction/:transactionId` - Get exchange by ChangeNow transaction ID
- `PUT /api/exchanges/:transactionId/status` - Update exchange status from ChangeNow

### Exchange Transaction Creation Details

#### POST /api/exchanges
Create a new exchange transaction using ChangeNow API. This endpoint is public and doesn't require authentication.

**Request Body:**
```json
{
  "fromCurrency": "btc",
  "fromNetwork": "btc",
  "toCurrency": "eth",
  "toNetwork": "eth",
  "fromAmount": "0.003",
  "address": "0x57f31ad4b64095347F87eDB1675566DAfF5EC886",
  "flow": "standard",
  "type": "direct",
  "contactEmail": "user@example.com",
  "refundAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
}
```

**Required Fields:**
- `fromCurrency` (string) - Source currency ticker (e.g., "btc")
- `fromNetwork` (string) - Source currency network (e.g., "btc")
- `toCurrency` (string) - Target currency ticker (e.g., "eth")
- `toNetwork` (string) - Target currency network (e.g., "eth")
- `address` (string) - Destination wallet address

**Optional Fields:**
- `fromAmount` (string) - Amount to exchange (for direct type)
- `toAmount` (string) - Amount to receive (for reverse type)
- `extraId` (string) - Extra ID for destination (if required)
- `refundAddress` (string) - Refund address (recommended)
- `refundExtraId` (string) - Refund extra ID (if needed)
- `contactEmail` (string) - Contact email for notifications
- `flow` (string) - Exchange flow type: "standard" or "fixed-rate" (default: "standard")
- `type` (string) - Exchange direction: "direct" or "reverse" (default: "direct")
- `rateId` (string) - Rate ID for fixed-rate exchanges

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Exchange transaction created successfully",
  "data": {
    "id": "abc123def456",
    "fromAmount": 0.003,
    "toAmount": 0.045,
    "flow": "standard",
    "type": "direct",
    "payinAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "payoutAddress": "0x57f31ad4b64095347F87eDB1675566DAfF5EC886",
    "payinExtraId": null,
    "payoutExtraId": null,
    "fromCurrency": "btc",
    "fromNetwork": "btc",
    "toCurrency": "eth",
    "toNetwork": "eth",
    "refundAddress": null,
    "refundExtraId": null,
    "payoutExtraIdName": null,
    "rateId": null
  }
}
```

#### GET /api/exchanges/estimate
Get estimated exchange amount for currency pair.

**Query Parameters:**
- `fromCurrency` (required) - Source currency ticker
- `toCurrency` (required) - Target currency ticker  
- `fromAmount` (required) - Amount to exchange
- `fromNetwork` (optional) - Source currency network
- `toNetwork` (optional) - Target currency network
- `flow` (optional) - Exchange flow: "standard" or "fixed-rate"
- `type` (optional) - Direction: "direct" or "reverse"

**Example Request:**
```
GET /api/exchanges/estimate?fromCurrency=btc&toCurrency=eth&fromAmount=0.01&flow=standard
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Estimated amount retrieved successfully",
  "data": {
    "estimatedAmount": "0.15",
    "transactionSpeedForecast": "10-30",
    "warningMessage": null
  }
}
```

#### GET /api/exchanges
Get all exchange transactions for the authenticated user.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Exchanges retrieved successfully",
  "data": [
    {
      "id": 1,
      "transactionId": "abc123def456",
      "fromCurrency": "btc",
      "toCurrency": "eth",
      "fromAmount": 0.003,
      "toAmount": 0.045,
      "status": "finished",
      "createdAt": "2025-10-05T10:30:00.000Z"
    }
  ]
}
```

### Exchange Status Types
- `waiting` - Waiting for deposit
- `confirming` - Confirming deposit
- `exchanging` - Performing exchange
- `sending` - Sending to destination
- `finished` - Exchange completed
- `failed` - Exchange failed
- `refunded` - Funds refunded
- `verifying` - Verifying transaction

### Exchange Request Examples

#### Create Exchange Transaction
```bash
curl -X POST http://localhost:3000/api/exchanges \
  -H "Content-Type: application/json" \
  -d '{
    "fromCurrency": "btc",
    "fromNetwork": "btc",
    "toCurrency": "eth",
    "toNetwork": "eth",
    "fromAmount": "0.003",
    "address": "0x57f31ad4b64095347F87eDB1675566DAfF5EC886",
    "flow": "standard"
  }'
```

#### Get Exchange Estimation
```bash
curl -X GET "http://localhost:3000/api/exchanges/estimate?fromCurrency=btc&toCurrency=eth&fromAmount=0.01"
```

#### Get Available Currencies
```bash
curl -X GET http://localhost:3000/api/exchanges/currencies
```

#### Update Exchange Status
```bash
curl -X PUT http://localhost:3000/api/exchanges/abc123def456/status \
  -H "Authorization: Bearer <your-token>"
```

### Environment Variables for ChangeNow
Add these to your `.env` file:
```
# ChangeNow API Configuration
CHANGENOW_API_KEY=your-changenow-api-key-here
```