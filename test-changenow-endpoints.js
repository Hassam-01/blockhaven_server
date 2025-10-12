#!/usr/bin/env node

/**
 * Simple test script to verify BlockHeaven API endpoints
 * Run with: node test-changenow-endpoints.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/blockhaven';

async function testEndpoint(name, url, method = 'GET', data = null) {
    try {
        console.log(`\n🧪 Testing ${name}...`);
        console.log(`   ${method} ${url}`);
        
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            timeout: 10000,
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        
        console.log(`   ✅ Success: ${response.status}`);
        console.log(`   📊 Data type: ${typeof response.data}`);
        
        if (response.data && response.data.success !== undefined) {
            console.log(`   🎯 API Success: ${response.data.success}`);
        }
        
        return true;
    } catch (error) {
        console.log(`   ❌ Error: ${error.response?.status || error.code}`);
        console.log(`   📝 Message: ${error.response?.data?.error || error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting BlockHeaven API Endpoint Tests');
    console.log('==========================================');
    
    const tests = [
        // Currency and Pair Endpoints
        ['Get Available Currencies', '/currencies?active=true'],
        ['Get Available Currencies (with flow)', '/currencies?flow=standard'],
        ['Get Available Pairs', '/available-pairs?fromCurrency=btc&toCurrency=eth'],
        
        // Amount and Rate Endpoints
        ['Get Min Amount', '/min-amount?fromCurrency=btc&toCurrency=eth'],
        ['Get Estimated Amount', '/estimated-amount?fromCurrency=btc&toCurrency=eth&fromAmount=0.1'],
        ['Get Exchange Range', '/exchange-range?fromCurrency=btc&toCurrency=eth'],
        ['Get Network Fee', '/network-fee?fromCurrency=btc&toCurrency=eth&fromAmount=0.1'],
        
        // Transaction Status (will fail without valid ID, but tests the endpoint)
        ['Get Transaction Status', '/transaction-status/test123'],
        
        // Address Endpoints
        ['Get User Addresses', '/addresses-by-name?name=test.crypto'],
        
        // Fiat Endpoints
        ['Get Fiat Health Check', '/fiat-health-check'],
        ['Get Fiat Market Info', '/fiat-market-info/usd/btc'],
        ['Get Fiat Transaction Status', '/fiat-transaction-status/test123'],
        ['Get Fiat Estimate', '/fiat-estimate?from_currency=usd&from_amount=100&to_currency=btc'],
        
        // Exchange Action Endpoints (will fail without valid ID)
        ['Get Exchange Actions', '/exchange-actions/test123'],
        
        // Additional Utility Endpoints
        ['Validate Address', '/validate-address?currency=btc&address=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
        ['Get Fiat Currencies', '/fiat-currencies'],
        ['Get Crypto Currencies for Fiat', '/crypto-currencies-for-fiat'],
    ];
    
    const postTests = [
        ['Create Fiat Transaction', '/fiat-transaction', 'POST', {
            from_currency: 'usd',
            from_amount: 100,
            to_currency: 'btc',
            to_amount: 0.003,
            to_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        }],
        ['Refund Exchange', '/refund', 'POST', {
            id: 'test123',
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        }],
        ['Continue Exchange', '/continue', 'POST', {
            id: 'test123'
        }],
    ];
    
    let passed = 0;
    let total = 0;
    
    // Test GET endpoints
    for (const [name, url] of tests) {
        total++;
        if (await testEndpoint(name, url)) {
            passed++;
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test POST endpoints
    for (const [name, url, method, data] of postTests) {
        total++;
        if (await testEndpoint(name, url, method, data)) {
            passed++;
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🏁 Test Results');
    console.log('===============');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 All endpoints are responding correctly!');
    } else {
        console.log('⚠️  Some endpoints may need attention (this could be due to invalid test data or API key issues)');
    }
    
    console.log('\n📝 Notes:');
    console.log('- Some failures are expected with test data');
    console.log('- Make sure CHANGENOW_API_KEY is set in your environment');
    console.log('- Server should be running on localhost:3000');
}

// Run the tests
runTests().catch(console.error);