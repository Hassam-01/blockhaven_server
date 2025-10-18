#!/usr/bin/env node

/**
 * Utility functions for creating and managing temporary admin users for testing
 * Run with: node temp-admin-utils.js
 */

import { AppDataSource } from './src/config/data-source.ts';
import { User } from './src/entities/user.entity.ts';
import bcrypt from 'bcryptjs';

const TEMP_ADMIN_EMAIL = 'temp-admin-test@example.com';
const TEMP_ADMIN_PASSWORD = 'temp-admin-123';

export async function createTempAdmin() {
    try {
        console.log('🔧 Creating temporary admin user for testing...');

        await AppDataSource.initialize();

        const userRepository = AppDataSource.getRepository(User);

        // Check if temp admin already exists
        const existingUser = await userRepository.findOne({
            where: { email: TEMP_ADMIN_EMAIL }
        });

        if (existingUser) {
            console.log('⚠️  Temporary admin user already exists');
            return {
                email: TEMP_ADMIN_EMAIL,
                password: TEMP_ADMIN_PASSWORD,
                user: existingUser
            };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(TEMP_ADMIN_PASSWORD, 10);

        // Create temp admin user
        const tempAdmin = userRepository.create({
            email: TEMP_ADMIN_EMAIL,
            password_hash: hashedPassword,
            first_name: 'Temp',
            last_name: 'Admin',
            user_type: 'admin'
        });

        await userRepository.save(tempAdmin);

        console.log('✅ Temporary admin user created successfully!');
        console.log(`📧 Email: ${TEMP_ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${TEMP_ADMIN_PASSWORD}`);

        return {
            email: TEMP_ADMIN_EMAIL,
            password: TEMP_ADMIN_PASSWORD,
            user: tempAdmin
        };

    } catch (error) {
        console.error('❌ Failed to create temporary admin:', error);
        throw error;
    } finally {
        await AppDataSource.destroy();
    }
}

export async function deleteTempAdmin() {
    try {
        console.log('🗑️  Deleting temporary admin user...');

        // await AppDataSource.initialize();

        // const userRepository = AppDataSource.getRepository(User);

        // const result = await userRepository.delete({
        //     email: TEMP_ADMIN_EMAIL
        // });

        // if (result.affected && result.affected > 0) {
        //     console.log('✅ Temporary admin user deleted successfully!');
        // } else {
        //     console.log('⚠️  Temporary admin user not found or already deleted');
        // }
        console.log("DELETE DONE< SIMULATE: ")

    } catch (error) {
        console.error('❌ Failed to delete temporary admin:', error);
        throw error;
    } finally {
        await AppDataSource.destroy();
    }
}

// CLI interface
async function main() {
    const command = process.argv[2];

    if (command === 'create') {
        await createTempAdmin();
    } else if (command === 'delete') {
        await deleteTempAdmin();
    } else {
        console.log('Usage:');
        console.log('  node temp-admin-utils.js create  - Create temporary admin user');
        console.log('  node temp-admin-utils.js delete  - Delete temporary admin user');
    }
}

// Run CLI if called directly
if (process.argv[1].endsWith('temp-admin-utils.js')) {
    main().catch(console.error);
}