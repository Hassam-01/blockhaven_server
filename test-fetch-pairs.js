#!/usr/bin/env node

import "reflect-metadata";
import { AppDataSource } from './src/config/data-source.js';
import { ExchangeService } from './src/services/exchange.service.js';

async function testFetchPairs() {
    try {
        console.log('🔗 Connecting to database...');
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully!');

        console.log('🧪 Testing fetchAndStoreAvailablePairs...');

        const exchangeService = new ExchangeService();
        await exchangeService.fetchAndStoreAvailablePairs();

        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

testFetchPairs();