#!/usr/bin/env node

/**
 * Debug script to check ChangeNOW API response for duplicates
 * Run with: node debug-currencies.js
 */

import axios from 'axios';

const CHANGENOW_API_KEY = process.env.CHANGENOW_API_KEY || '4d2e85bbf550b94bd9647732dc3b9984ac14b560a1236f8f142fe82f9e8ce583';
const CHANGENOW_X_API_KEY = process.env.CHANGENOW_X_API_KEY || '0a0094fdd47ab5d547cfc434f9a4f3cddcf123626130935e4c129f31e085ef47';

async function debugCurrencies() {
  try {
    console.log('🔍 Debugging ChangeNOW API currencies response...\n');

    const response = await axios.get('https://api.changenow.io/v2/exchange/currencies', {
      headers: {
        'x-api-key': CHANGENOW_X_API_KEY,
        'x-changenow-api-key': CHANGENOW_API_KEY,
      },
    });

    const currencies = response.data;
    console.log(`📊 Total currencies from API: ${currencies.length}`);

    // Check for duplicates in API response
    const seen = new Map();
    const duplicates = [];

    currencies.forEach((currency, index) => {
      const key = `${currency.ticker}:${currency.network || ''}`;
      if (seen.has(key)) {
        duplicates.push({
          key,
          firstIndex: seen.get(key),
          secondIndex: index,
          currency1: currencies[seen.get(key)],
          currency2: currency
        });
      } else {
        seen.set(key, index);
      }
    });

    console.log(`🔍 Unique combinations found: ${seen.size}`);
    console.log(`❌ Duplicates found: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\n🚨 DUPLICATE CURRENCIES IN API RESPONSE:');
      duplicates.forEach((dup, i) => {
        console.log(`\n--- Duplicate ${i + 1} ---`);
        console.log(`Key: ${dup.key}`);
        console.log(`First: ${JSON.stringify(dup.currency1, null, 2)}`);
        console.log(`Second: ${JSON.stringify(dup.currency2, null, 2)}`);
      });
    } else {
      console.log('✅ No duplicates found in API response');
    }

    // Show sample currencies
    console.log('\n📋 Sample currencies:');
    currencies.slice(0, 5).forEach((c, i) => {
      console.log(`${i + 1}. ${c.ticker} (${c.network || 'no-network'}) - ${c.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugCurrencies();