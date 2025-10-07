-- BlockHeaven Database Schema Migration
-- Run this SQL script to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    user_type VARCHAR CHECK (user_type IN ('admin', 'customer')) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    reset_token VARCHAR NULL,
    reset_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create service_fees table
CREATE TABLE IF NOT EXISTS service_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR CHECK (type IN ('fixed-rate', 'floating')) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    subject VARCHAR(200) NULL,
    message TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
    id SERIAL PRIMARY KEY,
    "transactionId" VARCHAR UNIQUE NOT NULL,
    "fromCurrency" VARCHAR NOT NULL,
    "fromNetwork" VARCHAR NOT NULL,
    "toCurrency" VARCHAR NOT NULL,
    "toNetwork" VARCHAR NOT NULL,
    "fromAmount" DECIMAL(18, 8) NOT NULL,
    "toAmount" DECIMAL(18, 8) NULL,
    "payinAddress" VARCHAR NOT NULL,
    "payoutAddress" VARCHAR NOT NULL,
    "payinExtraId" VARCHAR NULL,
    "payoutExtraId" VARCHAR NULL,
    status VARCHAR NOT NULL,
    "expectedAmountFrom" DECIMAL(18, 8) NULL,
    "expectedAmountTo" DECIMAL(18, 8) NULL,
    "actualAmountFrom" DECIMAL(18, 8) NULL,
    "actualAmountTo" DECIMAL(18, 8) NULL,
    "amountSent" DECIMAL(18, 8) NULL,
    "payinHash" VARCHAR NULL,
    "payoutHash" VARCHAR NULL,
    "refundAddress" VARCHAR NULL,
    "refundExtraId" VARCHAR NULL,
    "apiExtraFee" DECIMAL(18, 8) NULL,
    "changenowFee" DECIMAL(18, 8) NULL,
    "publicFee" DECIMAL(18, 8) NULL,
    "fiatEquivalent" DECIMAL(18, 2) NULL,
    "isPartner" BOOLEAN NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_testimonials_user ON testimonials("userId");
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_exchanges_transaction ON exchanges("transactionId");
CREATE INDEX IF NOT EXISTS idx_exchanges_status ON exchanges(status);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Insert default service fees if they don't exist
INSERT INTO service_fees (type, fee) 
SELECT 'fixed-rate', 1.00
WHERE NOT EXISTS (SELECT 1 FROM service_fees WHERE type = 'fixed-rate');

INSERT INTO service_fees (type, fee) 
SELECT 'floating', 0.50
WHERE NOT EXISTS (SELECT 1 FROM service_fees WHERE type = 'floating');

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully!';
    RAISE NOTICE 'Tables created: users, testimonials, faqs, service_fees, contacts, exchanges';
    RAISE NOTICE 'Default service fees inserted';
END $$;