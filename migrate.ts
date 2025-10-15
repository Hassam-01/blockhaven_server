import "reflect-metadata";
import { AppDataSource } from "./src/config/data-source.js";

const migrate = async () => {
  try {
    console.log("🔗 Connecting to database...");
    
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully!");

    console.log("📋 Current database info:");
    console.log(`  Database: ${AppDataSource.options.database}`);
    const options = AppDataSource.options as any;
    console.log(`  Host: ${options.host}`);
    console.log(`  Port: ${options.port}`);

    // Check if tables already exist
    const queryRunner = AppDataSource.createQueryRunner();
    
    console.log("\n🔍 Checking existing tables...");
    const existingTables = await queryRunner.getTables();
    
    if (existingTables.length > 0) {
      console.log("Existing tables found:");
      existingTables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
    } else {
      console.log("No tables found in database.");
    }

    console.log("\n🔧 Creating/updating database schema...");
    
    // Force synchronization to create tables
    await AppDataSource.synchronize(false); // false = don't drop existing tables
    
    console.log("✅ Database schema synchronized successfully!");

    // Create triggers for updated_at
    console.log("\n🔧 Creating updated_at triggers...");
    
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_currencies_updated_at 
          BEFORE UPDATE ON currencies 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_pairs_updated_at 
          BEFORE UPDATE ON exchange_pairs 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log("✅ Triggers created successfully!");

    // List all tables after migration
    console.log("\n📋 Tables after migration:");
    const tablesAfter = await queryRunner.getTables();
    
    tablesAfter.forEach(table => {
      console.log(`  - ${table.name} (${table.columns.length} columns)`);
    });

    // Show detailed table structures
    console.log("\n📊 Table structures:");
    for (const table of tablesAfter) {
      console.log(`\n${table.name}:`);
      table.columns.forEach(column => {
        const nullable = column.isNullable ? "NULL" : "NOT NULL";
        const primary = column.isPrimary ? "PRIMARY KEY" : "";
        const unique = column.isUnique ? "UNIQUE" : "";
        const defaultVal = column.default ? `DEFAULT ${column.default}` : "";
        
        console.log(`  - ${column.name}: ${column.type} ${nullable} ${primary} ${unique} ${defaultVal}`.trim());
      });
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log("\n🎉 Migration completed successfully!");
    console.log("Your database is now ready to use!");
    
  } catch (error) {
    console.error("\n❌ Migration failed:");
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      
      // Common error handling
      if (error.message.includes('ECONNREFUSED')) {
        console.error("\n💡 Connection refused. Please check:");
        console.error("  - Database server is running");
        console.error("  - Host and port are correct");
        console.error("  - Network connectivity");
      } else if (error.message.includes('authentication failed')) {
        console.error("\n💡 Authentication failed. Please check:");
        console.error("  - Username and password are correct");
        console.error("  - User has necessary permissions");
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error("\n💡 Database does not exist. Please:");
        console.error("  - Create the database first");
        console.error("  - Check the database name in your .env file");
      }
    } else {
      console.error("Unknown error:", error);
    }
    
    process.exit(1);
  }
};

// Run the migration
console.log("🚀 Starting database migration...\n");
migrate();