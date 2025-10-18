#!/usr/bin/env node

/**
 * Script to fetch and store currencies from ChangeNOW API
 * Run with: node fetch-currencies.js
 */

import { config } from 'dotenv';
import { AppDataSource } from './src/config/data-source.js';
import { ExchangeService } from './src/services/exchange.service.js';

config();

async function fetchAndStoreCurrencies() {
    try {
        console.log('🔄 Initializing database connection...');

        // Initialize database connection
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully!');

        // Create exchange service instance
        const exchangeService = new ExchangeService();

        console.log('🔄 Fetching and storing currencies from ChangeNOW API...');

        // Call the fetchAndStoreCurrencies method
        await exchangeService.fetchAndStoreCurrencies();

        console.log('✅ Currencies fetched and stored successfully!');

        // Close database connection
        await AppDataSource.destroy();
        console.log('🔌 Database connection closed.');

    } catch (error) {
        console.error('❌ Error fetching and storing currencies:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

fetchAndStoreCurrencies();