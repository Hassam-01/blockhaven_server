# BlockHeaven Server

A Node.js/TypeScript server for the BlockHeaven cryptocurrency exchange platform built with Fastify and TypeORM.

## Features

- **User Management**: Registration, login, 2FA authentication
- **Exchange Services**: Integration with ChangeNOW API for cryptocurrency exchanges
- **Content Management**: FAQs, testimonials, service fees, contact forms
- **Database**: PostgreSQL with TypeORM
- **Email Services**: Nodemailer integration
- **Security**: JWT authentication, bcrypt password hashing, 2FA support

## API Endpoints

### Core Services
- `/api/users` - User management (registration, login, 2FA)
- `/api/exchanges` - Exchange transaction management
- `/api/faqs` - FAQ management
- `/api/testimonials` - Testimonial management
- `/api/service-fees` - Service fee management
- `/api/contact` - Contact form submissions

### ChangeNOW Integration
- `/api/changenow` - Comprehensive ChangeNOW API proxy with 16 endpoints

For detailed ChangeNOW API documentation, see [CHANGENOW_API_ENDPOINTS.md](./CHANGENOW_API_ENDPOINTS.md)

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=blockhaven

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# ChangeNOW API
CHANGENOW_API_KEY=your_changenow_api_key

# Frontend
WEB_HOST=http://localhost:9009
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockHaven-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb blockhaven
   
   # Run migrations
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:prod` - Start with NODE_ENV=production
- `npm run migrate` - Run database migrations
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build directory

## Docker

Build and run with Docker:

```bash
# Build image
npm run docker:build

# Run with docker-compose
npm run docker:run

# Stop containers
npm run docker:stop
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **User**: User accounts with 2FA support
- **Exchange**: Exchange transaction records
- **FAQ**: Frequently asked questions
- **Testimonial**: User testimonials
- **ServiceFee**: Service fee configurations
- **Contact**: Contact form submissions

See `schema.sql` for the complete database schema.

## Authentication

The API uses JWT tokens for authentication:

1. Register/login to get an access token
2. Include the token in the Authorization header: `Bearer <token>`
3. 2FA is supported for enhanced security

## ChangeNOW Integration

The server provides a comprehensive proxy layer for ChangeNOW's API with 16 endpoints covering:

- Currency and trading pair information
- Exchange amount calculations and estimates
- Transaction status tracking
- Fiat-to-crypto exchanges
- Exchange management actions

All ChangeNOW endpoints are accessible under `/api/changenow/*` and automatically handle:
- API key authentication
- Request/response formatting
- Error handling and validation
- Parameter transformation

## Testing

Test the ChangeNOW endpoints:

```bash
node test-changenow-endpoints.js
```

This will test all 16 ChangeNOW proxy endpoints to ensure they're working correctly.

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- 2FA with time-based codes
- CORS configuration
- Environment variable validation
- SQL injection protection via TypeORM
- Input validation with Fastify schemas

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Success responses:

```json
{
  "success": true,
  "data": { ... }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information here]

## Support

For support, email [your-email] or create an issue in the repository.