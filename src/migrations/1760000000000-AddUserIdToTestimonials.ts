import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToTestimonials1760000000000 implements MigrationInterface {
  name = 'AddUserIdToTestimonials1760000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Add nullable user_id column if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'testimonials' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE testimonials ADD COLUMN user_id uuid;
        END IF;
      END$$;
    `);

    // 2) If there are common existing columns like "userId" or "userid", copy values
    // This uses SQL that will succeed even if those columns don't exist by checking information_schema first
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'testimonials' AND column_name = 'userId'
        ) THEN
          EXECUTE 'UPDATE testimonials SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'testimonials' AND column_name = 'userid'
        ) THEN
          EXECUTE 'UPDATE testimonials SET user_id = userid WHERE user_id IS NULL AND userid IS NOT NULL';
        END IF;
      END$$;
    `);

    // 3) Ensure user_id is nullable (it already is by default when added without NOT NULL)
    // 4) Add foreign key constraint if not present
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'testimonials' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
        ) THEN
          ALTER TABLE testimonials
            ADD CONSTRAINT testimonials_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK if exists, then drop the column if it was added
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'testimonials' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
        ) THEN
          ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_user_id_fkey;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'testimonials' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE testimonials DROP COLUMN IF EXISTS user_id;
        END IF;
      END$$;
    `);
  }
}
