#!/usr/bin/env node

/**
 * Script to create temp admin, fetch currencies and pairs, then delete temp admin
 * Run with: node populate-db-admin.js
 */

import 'dotenv/config';
import axios from 'axios';
import { createTempAdmin, deleteTempAdmin } from './temp-admin-utils.js';

const BASE_URL = process.env.API_BASE_URL || 'https://blockhaven.co';

console.log("base url: ", BASE_URL, process.env.API_BASE_URL)

async function populateDatabaseWithAdmin() {
    let tempAdmin = null;

    try {
        console.log('🚀 Starting database population with temporary admin');
        console.log('==================================================\n');

        // Step 1: Create temporary admin user
        console.log('1️⃣ Creating temporary admin user...');
        tempAdmin = await createTempAdmin();
        console.log('✅ Temporary admin created!\n');

        // Step 2: Login as admin
        console.log('2️⃣ Logging in as temporary admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
            email: tempAdmin.email,
            password: tempAdmin.password
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Admin login successful!');
        console.log(`🔑 Token: ${token.substring(0, 50)}...\n`);

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Step 3: Fetch currencies
        console.log('3️⃣ Fetching currencies...');
        const currenciesResponse = await axios.post(`${BASE_URL}/api/exchanges/fetch-currencies`, {}, { headers });

        console.log('✅ Currencies fetch successful!');
        console.log('📊 Currencies Response:', currenciesResponse.data);

        // Step 4: Fetch pairs
        console.log('\n4️⃣ Fetching exchange pairs...');
        const pairsResponse = await axios.post(`${BASE_URL}/api/exchanges/fetch-pairs`, {}, { headers });

        console.log('✅ Pairs fetch successful!');
        console.log('📊 Pairs Response:', pairsResponse.data);

        console.log('\n🎉 Database population completed successfully!');

        // Step 5: Cleanup - Delete temporary admin
        console.log('\n🧹 Cleaning up temporary admin user...');
        await deleteTempAdmin();

        console.log('✅ Temporary admin deleted successfully!');
        console.log('🏁 All operations completed!');

    } catch (error) {
        console.error('❌ Database population failed:', error.response?.data || error.message);
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

        process.exit(1);
    }
}

populateDatabaseWithAdmin();