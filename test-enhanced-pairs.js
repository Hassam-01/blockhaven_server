#!/usr/bin/env node

/**
 * Test script to verify the enhanced pairs endpoint
 * Run with: node test-enhanced-pairs.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testEnhancedPairs() {
    try {
        console.log('🔄 Testing Enhanced Pairs Endpoint');
        console.log('==================================\n');

        // Test the enhanced pairs endpoint
        console.log('1️⃣ Testing enhanced pairs endpoint...');
        const response = await axios.get(`${BASE_URL}/exchanges/enhanced-pairs`);

        console.log('✅ Enhanced pairs request successful!');
        console.log('📊 Response:', {
            success: response.data.success,
            message: response.data.message,
            totalPairs: response.data.data?.length || 0
        });

        // Show sample pair structure
        if (response.data.data && response.data.data.length > 0) {
            console.log('\n📋 Sample pair structure:');
            console.log(JSON.stringify(response.data.data[0], null, 2));

            // Validate structure
            const samplePair = response.data.data[0];
            const hasFrom = samplePair.from && typeof samplePair.from === 'object';
            const hasTo = samplePair.to && typeof samplePair.to === 'object';
            const hasFlow = samplePair.flow && typeof samplePair.flow === 'object';

            console.log('\n✅ Structure validation:');
            console.log(`   From currency details: ${hasFrom ? '✅' : '❌'}`);
            console.log(`   To currency details: ${hasTo ? '✅' : '❌'}`);
            console.log(`   Flow details: ${hasFlow ? '✅' : '❌'}`);

            if (hasFrom) {
                console.log(`   From fields: ticker=${!!samplePair.from.ticker}, network=${!!samplePair.from.network}, name=${!!samplePair.from.name}`);
            }
            if (hasTo) {
                console.log(`   To fields: ticker=${!!samplePair.to.ticker}, network=${!!samplePair.to.network}, name=${!!samplePair.to.name}`);
            }
            if (hasFlow) {
                console.log(`   Flow fields: standard=${typeof samplePair.flow.standard === 'boolean'}, fixed-rate=${typeof samplePair.flow['fixed-rate'] === 'boolean'}`);
            }
        }

        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Full error:', error);
    }
}

testEnhancedPairs();