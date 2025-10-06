/**
 * Environment variable validation for production readiness
 */
export class EnvValidation {
  private static requiredVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM_EMAIL',
    'CONTACT_RECEIVE_EMAIL'
  ];

  private static productionRequiredVars = [
    'WEB_HOST',
    'CHANGENOW_API_KEY'
  ];

  public static validate(): void {
    const missingVars: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Check required variables
    for (const varName of this.requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    // Check production-specific variables
    if (isProduction) {
      for (const varName of this.productionRequiredVars) {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      }
    }

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      process.exit(1);
    }

    // Validate JWT secret strength in production
    if (isProduction) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret && jwtSecret.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long in production');
        process.exit(1);
      }
      
      if (jwtSecret?.includes('change-this') || jwtSecret?.includes('your-secret')) {
        console.error('❌ JWT_SECRET appears to be a default value. Use a strong, unique secret in production');
        process.exit(1);
      }
    }

    console.log('✅ Environment validation passed');
  }

  public static getConfig() {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000'),
      HOST: process.env.HOST || 'localhost',
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development'
    };
  }
}