# Two-Factor Authentication (2FA) Implementation

## Overview
This implementation adds email-based two-factor authentication to the BlockHeaven server. When 2FA is enabled for a user, they will receive a 6-digit verification code via email during login.

## Features
- **Email-based 2FA**: Verification codes sent to registered email address
- **Secure code generation**: Random 6-digit codes with 10-minute expiry
- **Pending token system**: Secure token-based verification process
- **User control**: Users can enable/disable 2FA for their accounts
- **Admin support**: Admins can manage 2FA settings for users

## Database Changes
The following columns have been added to the `users` table:

```sql
- two_factor_code VARCHAR NULL          -- Stores the 6-digit verification code
- two_factor_expires TIMESTAMP NULL     -- Expiry time for the verification code
- two_factor_enabled BOOLEAN DEFAULT false -- Whether 2FA is enabled for the user
- pending_login_token VARCHAR NULL      -- Token for pending login verification
```

## API Endpoints

### 1. User Login (Modified)
**Endpoint**: `POST /api/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA Disabled)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

**Response (2FA Enabled)**:
```json
{
  "success": true,
  "requiresTwoFactor": true,
  "message": "Two-factor authentication code sent to your email",
  "pendingToken": "pending-verification-token"
}
```

### 2. Verify 2FA Code
**Endpoint**: `POST /api/users/verify-2fa`

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "pendingToken": "token-from-login-response"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Two-factor authentication verified successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

### 3. Enable 2FA
**Endpoint**: `PUT /api/users/enable-2fa`
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully"
}
```

### 4. Disable 2FA
**Endpoint**: `PUT /api/users/disable-2fa`
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Two-factor authentication disabled successfully"
}
```

## Security Features

### Code Generation
- 6-digit random codes (100000-999999)
- Cryptographically secure random generation
- 10-minute expiry time
- One-time use (codes are cleared after verification)

### Token Security
- Pending login tokens use cryptographically secure random generation
- 32-byte hex tokens for pending verification
- Tokens are invalidated after successful verification or expiry

### Email Security
- Professional email templates with security warnings
- Clear expiry information in emails
- Warning messages for unauthorized attempts

## Email Template
The 2FA email includes:
- Clear branding with BlockHeaven header
- Large, prominent verification code display
- Expiry time information (10 minutes)
- Security warning for unauthorized attempts
- Professional styling with responsive design

## Database Migration
For existing databases, run the migration file:

```sql
-- migration_2fa.sql
ALTER TABLE users ADD COLUMN two_factor_code VARCHAR;
ALTER TABLE users ADD COLUMN two_factor_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN;
ALTER TABLE users ADD COLUMN pending_login_token VARCHAR;

UPDATE users SET two_factor_enabled = false WHERE two_factor_enabled IS NULL;
```

## Frontend Integration

### Login Flow with 2FA
1. User submits login credentials
2. Check response for `requiresTwoFactor` flag
3. If true, show 2FA verification form
4. User enters code received via email
5. Submit verification with email, code, and pendingToken
6. Receive JWT token upon successful verification

### 2FA Management
- Add toggle switch in user settings
- Allow users to enable/disable 2FA
- Show current 2FA status in profile

## Error Handling
The system handles various error scenarios:
- Invalid verification codes
- Expired verification codes
- Invalid pending tokens
- Missing required fields
- Email delivery failures

## Testing
Test the 2FA system by:
1. Creating a user account
2. Enabling 2FA via the API
3. Logging out and logging back in
4. Verifying the email is sent with a 6-digit code
5. Testing code verification
6. Testing expiry (wait 10+ minutes)
7. Testing invalid codes

## Environment Variables
Ensure your email service is properly configured:
```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=your-from-email
```