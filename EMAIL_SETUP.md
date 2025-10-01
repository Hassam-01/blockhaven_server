# Email Setup Guide for BlockHeaven Server

## Overview
This guide explains how to configure email functionality for the BlockHeaven server using Hostinger's SMTP service.

## Environment Variables Setup

Add the following environment variables to your `.env` file:

```bash
# SMTP Configuration for Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM_EMAIL=your-email@yourdomain.com
CONTACT_RECEIVE_EMAIL=your-receive-email@yourdomain.com
```

## Hostinger SMTP Settings

### Common Hostinger SMTP Configurations:
- **SMTP Host:** `smtp.hostinger.com`
- **SMTP Port:** `587` (recommended) or `465` (SSL)
- **Security:** STARTTLS (for port 587) or SSL/TLS (for port 465)
- **Authentication:** Required

### For Port 587 (STARTTLS):
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
```

### For Port 465 (SSL):
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
```

## Setting Up Your Hostinger Email Account

1. **Create an Email Account:**
   - Log into your Hostinger control panel
   - Go to "Email Accounts"
   - Create a new email account for your domain
   - Use a dedicated email like `noreply@yourdomain.com` or `contact@yourdomain.com`

2. **Enable SMTP:**
   - Ensure SMTP is enabled for your email account
   - Note down the password you set for the email account

3. **Configure Environment Variables:**
   ```bash
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASS=your-secure-password
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   CONTACT_RECEIVE_EMAIL=admin@yourdomain.com
   ```

## Email Functionality

### Contact Form Email
When a user submits the contact form via `POST /api/contact`, the system will:

1. **Save the submission** to the database
2. **Send an email notification** to the configured admin email (`CONTACT_RECEIVE_EMAIL`)
3. **Include all form details** in a nicely formatted HTML email

### Email Template Features
- **Professional HTML formatting** with responsive design
- **Contact details table** with name, email, phone, and subject
- **Message content** with proper line break handling
- **Reply-to header** set to the form submitter's email
- **Timestamp** of when the form was submitted

## Testing Email Configuration

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check the console** for SMTP verification:
   ```
   SMTP connection verified successfully!
   ```

3. **Submit a test contact form:**
   ```bash
   curl -X POST http://localhost:3000/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "subject": "Test Email",
       "message": "This is a test message to verify email functionality."
     }'
   ```

4. **Check your admin email** for the notification

## Troubleshooting

### Common Issues:

1. **SMTP Connection Failed:**
   - Verify your Hostinger email credentials
   - Check if SMTP is enabled for your email account
   - Ensure the domain is properly configured

2. **Authentication Error:**
   - Double-check the email and password
   - Try using an app-specific password if available

3. **Port Issues:**
   - Try switching between port 587 and 465
   - Adjust the `SMTP_SECURE` setting accordingly

4. **Firewall/Security:**
   - Ensure your server can make outbound connections on SMTP ports
   - Check if your hosting provider blocks SMTP

### Error Messages:
- **"SMTP connection verification failed"**: Check your SMTP credentials and server settings
- **"Failed to send contact form email"**: Usually indicates SMTP configuration issues
- **"Authentication failed"**: Wrong email or password

## Security Best Practices

1. **Use Environment Variables:**
   - Never commit SMTP credentials to version control
   - Keep your `.env` file in `.gitignore`

2. **Dedicated Email Account:**
   - Use a dedicated email account for sending (e.g., `noreply@yourdomain.com`)
   - Use a different email for receiving notifications (e.g., `admin@yourdomain.com`)

3. **Strong Passwords:**
   - Use strong, unique passwords for email accounts
   - Consider using app-specific passwords when available

4. **Rate Limiting:**
   - The current implementation doesn't include rate limiting
   - Consider adding rate limiting for the contact form endpoint in production

## Email Content Customization

The email template can be customized in `src/services/email.service.ts`. You can modify:
- **HTML styling** and layout
- **Email subject** format
- **Additional email fields**
- **Company branding** and colors

## Production Considerations

1. **Domain Authentication:**
   - Set up SPF, DKIM, and DMARC records for your domain
   - This improves email deliverability

2. **Email Delivery Service:**
   - For high-volume applications, consider services like SendGrid or AWS SES
   - Hostinger SMTP is suitable for low to medium volume

3. **Monitoring:**
   - Monitor email delivery success rates
   - Set up alerts for email sending failures

4. **Backup Email Configuration:**
   - Consider configuring a backup SMTP service
   - Implement retry logic for failed email sends