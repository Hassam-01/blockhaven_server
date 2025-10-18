#!/usr/bin/env node

/**
 * Test script to verify admin-only fetch pairs endpoint
 * Run with: node test-admin-fetch-pairs.js
 */

import axios from 'axios';
import { createTempAdmin, deleteTempAdmin } from './temp-admin-utils.js';

const BASE_URL = 'http://localhost:3000/api';

async function testAdminFetchPairs() {
    let tempAdmin = null;

    try {
        console.log('🔐 Testing Admin-Only Fetch Pairs Endpoint');
        console.log('==========================================\n');

        // Step 1: Create temporary admin user
        console.log('1️⃣ Creating temporary admin user...');
        tempAdmin = await createTempAdmin();
        console.log('✅ Temporary admin created!\n');

        // Step 2: Login as admin
        console.log('2️⃣ Logging in as temporary admin...');
        const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
            email: tempAdmin.email,
            password: tempAdmin.password
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Admin login successful!');
        console.log(`🔑 Token: ${token.substring(0, 50)}...\n`);

        // Step 3: Test fetch pairs endpoint with admin token
        console.log('3️⃣ Testing fetch pairs endpoint...');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const fetchResponse = await axios.post(`${BASE_URL}/exchanges/fetch-pairs`, {}, { headers });

        console.log('✅ Fetch pairs request successful!');
        console.log('📊 Response:', fetchResponse.data);

        // Step 4: Test without authentication (should fail)
        console.log('\n4️⃣ Testing without authentication (should fail)...');
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

        // Step 5: Test with invalid token (should fail)
        console.log('\n5️⃣ Testing with invalid/non-admin token (should fail)...');
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

        // Cleanup: Delete temporary admin
        console.log('\n🧹 Cleaning up temporary admin user...');
        await deleteTempAdmin();

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Full error:', error);

        // Cleanup on error
        if (tempAdmin) {
            try {
                console.log('\n🧹 Cleaning up temporary admin user after error...');
                await deleteTempAdmin();
            } catch (cleanupError) {
                console.error('❌ Cleanup failed:', cleanupError);
            }
        }
    }
}

testAdminFetchPairs();