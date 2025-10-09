import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './src/config/data-source.js';
import { User } from './src/entities/user.entity.js';

async function createAdminUser() {
  try {
    // Initialize database connection
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected successfully!\n');

    // User details
    const email = 'ahgoal7@gmail.com';
  const password = 'admin';
  const firstName = 'Admin';
  const lastName = 'User';
  const userType = 'admin';
  
  // Generate UUID for the user
  const userId = uuidv4();
  
  // Hash the password with salt rounds 12 (same as in the application)
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  console.log('=== ADMIN USER CREATION SCRIPT ===\n');
  console.log('Generated details:');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Password Hash: ${passwordHash}\n`);
  
  // Check if user already exists
  const userRepository = AppDataSource.getRepository(User);
  const existingUser = await userRepository.findOne({ where: { email } });
  
  if (existingUser) {
    console.log('❌ User with this email already exists!');
    console.log('Existing user details:');
    console.log(`- ID: ${existingUser.id}`);
    console.log(`- Email: ${existingUser.email}`);
    console.log(`- User Type: ${existingUser.user_type}`);
    console.log(`- Created At: ${existingUser.created_at}`);
    return;
  }

  // Create new admin user
  const newUser = new User();
  newUser.id = userId;
  newUser.email = email;
  newUser.password_hash = passwordHash;
  newUser.first_name = firstName;
  newUser.last_name = lastName;
  newUser.user_type = userType;
  newUser.is_active = true;
  newUser.reset_token = null;
  newUser.reset_token_expires = null;
  newUser.two_factor_code = null;
  newUser.two_factor_expires = null;
  newUser.two_factor_enabled = false;
  newUser.pending_login_token = null;
  
  // Save to database
  console.log('Creating admin user...');
  const savedUser = await userRepository.save(newUser);
  
  console.log('✅ Admin user created successfully!');
  console.log('User details:');
  console.log(`- ID: ${savedUser.id}`);
  console.log(`- Email: ${savedUser.email}`);
  console.log(`- User Type: ${savedUser.user_type}`);
  console.log(`- Created At: ${savedUser.created_at}`);
  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the script
createAdminUser().catch(console.error);