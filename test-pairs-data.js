import { ExchangeService } from './src/services/exchange.service.js';

async function testPairsData() {
  const service = new ExchangeService();
  const pairs = await service.getEnhancedPairs();

  console.log('Total pairs:', pairs.length);
  console.log('Sample pair:', JSON.stringify(pairs[0], null, 2));
  console.log('Response size estimate:', JSON.stringify(pairs).length, 'bytes');
  console.log('Compressed size estimate (rough):', Math.round(JSON.stringify(pairs).length * 0.7), 'bytes');
}

testPairsData().catch(console.error);