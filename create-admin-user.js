import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function createAdminUser() {
  // User details
  const email = 'support@blockhaven.co';
  const password = 'admin';
  const firstName = 'Admin';
  const lastName = 'User';
  const userType = 'admin';
  
  // Generate UUID for the user
  const userId = uuidv4();
  
  // Hash the password with salt rounds 12 (same as in the application)
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Current timestamp for created_at
  const createdAt = new Date().toISOString();
  
  console.log('=== ADMIN USER CREATION SCRIPT ===\n');
  console.log('Generated details:');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Password Hash: ${passwordHash}`);
  console.log(`Created At: ${createdAt}\n`);
  
  // Generate the SQL query
  const sqlQuery = `
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  user_type, 
  is_active, 
  reset_token, 
  reset_token_expires, 
  created_at
) VALUES (
  '${userId}',
  '${email}',
  '${passwordHash}',
  '${firstName}',
  '${lastName}',
  '${userType}',
  true,
  NULL,
  NULL,
  '${createdAt}'
);`;

  console.log('=== SQL QUERY TO RUN IN POSTGRES ===');
  console.log(sqlQuery);
  
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Connect to your PostgreSQL database');
  console.log('2. Run the above SQL query');
  console.log('3. The admin user will be created with the following credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log('4. You can now login with these credentials');
  
  return {
    userId,
    email,
    password,
    passwordHash,
    sqlQuery
  };
}

// Run the script
createAdminUser().catch(console.error);