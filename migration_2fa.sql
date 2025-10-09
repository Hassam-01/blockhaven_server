-- Two-Factor Authentication Migration
-- Run this SQL script to add 2FA support to existing users table

-- Add two-factor authentication columns to users table
ALTER TABLE users 
ADD COLUMN two_factor_code VARCHAR;

ALTER TABLE users 
ADD COLUMN two_factor_expires TIMESTAMP;

ALTER TABLE users 
ADD COLUMN two_factor_enabled BOOLEAN;

ALTER TABLE users 
ADD COLUMN pending_login_token VARCHAR;

-- Set default values for existing users
UPDATE users SET two_factor_enabled = false WHERE two_factor_enabled IS NULL;