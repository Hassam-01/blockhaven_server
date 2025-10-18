import { AppDataSource } from './src/config/data-source.js';
import { ExchangeService } from './src/services/exchange.service.js';

async function populateDatabase() {
  try {
    await AppDataSource.initialize();
    
    const exchangeService = new ExchangeService();
    
    // Fetch and store currencies
    await exchangeService.fetchAndStoreCurrencies();
    console.log('✅ Currencies stored');
    
    // Fetch and store pairs
    await exchangeService.fetchAndStoreAvailablePairs();
    console.log('✅ Pairs stored');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

populateDatabase();