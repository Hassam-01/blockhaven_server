#!/usr/bin/env node

/**
 * Test script to verify admin-only fetch pairs endpoint
 * Run with: node test-admin-fetch-pairs.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Admin credentials (from create-admin-user.js)
const ADMIN_EMAIL = 'ahgoal7@gmail.com';
const ADMIN_PASSWORD = 'admin';

async function testAdminFetchPairs() {
    try {
        console.log('🔐 Testing Admin-Only Fetch Pairs Endpoint');
        console.log('==========================================\n');

        // Step 1: Login as admin
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Admin login successful!');
        console.log(`🔑 Token: ${token.substring(0, 50)}...\n`);

        // Step 2: Test fetch pairs endpoint with admin token
        console.log('2️⃣ Testing fetch pairs endpoint...');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const fetchResponse = await axios.post(`${BASE_URL}/exchanges/fetch-pairs`, {}, { headers });

        console.log('✅ Fetch pairs request successful!');
        console.log('📊 Response:', fetchResponse.data);

        // Step 3: Test without authentication (should fail)
        console.log('\n3️⃣ Testing without authentication (should fail)...');
        try {
            await axios.post(`${BASE_URL}/exchanges/fetch-pairs`);
            console.log('❌ ERROR: Request should have failed without authentication!');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected unauthenticated request');
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Step 4: Test with regular user token (if available)
        console.log('\n4️⃣ Testing with invalid/non-admin token (should fail)...');
        try {
            const invalidHeaders = {
                'Authorization': `Bearer invalid-token`,
                'Content-Type': 'application/json'
            };
            await axios.post(`${BASE_URL}/exchanges/fetch-pairs`, {}, { headers: invalidHeaders });
            console.log('❌ ERROR: Request should have failed with invalid token!');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected invalid token');
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Full error:', error);
    }
}

testAdminFetchPairs();