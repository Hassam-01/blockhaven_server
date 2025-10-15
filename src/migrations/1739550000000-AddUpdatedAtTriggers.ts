import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUpdatedAtTriggers1739550000000 implements MigrationInterface {
    name = 'AddUpdatedAtTriggers1739550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create trigger function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Add triggers
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_pairs_updated_at ON exchange_pairs;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_currencies_updated_at ON currencies;`);

        // Drop function
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column();`);
    }
}