#!/usr/bin/env node

/**
 * Script to fetch and store currencies via API endpoint
 * Run with: node fetch-currencies-api.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Admin credentials (from create-admin-user.js)
const ADMIN_EMAIL = 'ahgoal7@gmail.com';
const ADMIN_PASSWORD = 'admin';

async function fetchAndStoreCurrencies() {
    try {
        console.log('🔄 Logging in as admin...');

        // Step 1: Login as admin
        const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Admin login successful!');

        // Step 2: Call fetch currencies endpoint
        console.log('🔄 Fetching and storing currencies...');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const fetchResponse = await axios.post(`${BASE_URL}/exchanges/fetch-currencies`, {}, { headers });

        console.log('✅ Currencies fetched and stored successfully!');
        console.log('📊 Response:', fetchResponse.data);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

fetchAndStoreCurrencies();