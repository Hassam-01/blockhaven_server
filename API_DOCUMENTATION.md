# BlockHeaven Server API Documentation

## Overview
BlockHeaven server provides a comprehensive API for managing users, FAQs, and testimonials with proper authentication and authorization.

## Authentication
Most endpoints require authentication using Bearer tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Endpoints

### Public Endpoints
- `POST /api/users/signup` - User registration
- `POST /api/users/login` - User login

### Protected Endpoints (Authenticated Users)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Update password

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