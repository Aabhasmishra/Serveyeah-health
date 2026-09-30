// Migration: decouple shree_raj_health_screenings from shree_raj_health_users
//
// Adds person-level identity columns to the screening table, backfills them for
// existing rows, then removes the foreign key dependency on shree_raj_health_users.
//
// This migration is additive and non-destructive: the table is never dropped or
// recreated, and every existing screening row is preserved.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 5,
  connectionTimeoutMillis: 10000,
});

const SCREENINGS = 'shree_raj_health_screenings';
const USERS = 'shree_raj_health_users';

async function runMigration() {
  const client = await pool.connect();
  const report = {};

  try {
    console.log('🔄 Starting screening decoupling migration...');
    console.log('📋 Target table:', SCREENINGS);
    console.log('');

    report.rowsBefore = (await client.query(`SELECT count(*)::int AS n FROM ${SCREENINGS}`)).rows[0].n;
    console.log(`📊 Existing screening rows before migration: ${report.rowsBefore}`);
    console.log('');

    await client.query('BEGIN');

    // ============================================
    // 1. Add person-level columns
    // ============================================
    console.log('1️⃣  Adding person-level columns...');

    await client.query(`
      ALTER TABLE ${SCREENINGS}
      ADD COLUMN IF NOT EXISTS person_id VARCHAR(10)
    `);
    await client.query(`
      ALTER TABLE ${SCREENINGS}
      ADD COLUMN IF NOT EXISTS person_name VARCHAR(255)
    `);
    await client.query(`
      ALTER TABLE ${SCREENINGS}
      ADD COLUMN IF NOT EXISTS age_years INTEGER
    `);
    await client.query(`
      ALTER TABLE ${SCREENINGS}
      ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20)
    `);
    await client.query(`
      ALTER TABLE ${SCREENINGS}
      ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false
    `);
    console.log('   ✅ person_id, person_name, age_years, mobile_number, is_student added');

    // ============================================
    // 2. Widen ecg / echo_heart for multi-select
    // ============================================
    console.log('2️⃣  Widening ecg and echo_heart to TEXT...');
    await client.query(`ALTER TABLE ${SCREENINGS} ALTER COLUMN ecg TYPE TEXT`);
    await client.query(`ALTER TABLE ${SCREENINGS} ALTER COLUMN echo_heart TYPE TEXT`);
    console.log('   ✅ ecg and echo_heart are now TEXT (multi-select safe)');

    // ============================================
    // 3. Person ID sequence + trigger (P0001, P0002, ...)
    // ============================================
    console.log('3️⃣  Creating person ID sequence and trigger...');
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS persons_id_seq START 1
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_person_id()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.person_id IS NULL OR NEW.person_id = '' THEN
          NEW.person_id := 'P' || LPAD(nextval('persons_id_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_generate_person_id ON ${SCREENINGS}
    `);
    await client.query(`
      CREATE TRIGGER trigger_generate_person_id
        BEFORE INSERT ON ${SCREENINGS}
        FOR EACH ROW
        EXECUTE FUNCTION generate_person_id()
    `);
    console.log('   ✅ person_id trigger created (P0001, P0002, ...)');

    // ============================================
    // 4. Backfill person_name from the linked user BEFORE dropping the FK
    // ============================================
    console.log('4️⃣  Backfilling person_name from linked user records...');
    const backfilled = await client.query(`
      UPDATE ${SCREENINGS} s
      SET person_name = u.full_name
      FROM ${USERS} u
      WHERE s.user_id = u.id
        AND (s.person_name IS NULL OR s.person_name = '')
      RETURNING s.id
    `);
    report.namesBackfilled = backfilled.rowCount;
    console.log(`   ✅ Backfilled person_name for ${backfilled.rowCount} row(s) from ${USERS}`);

    // Any row still without a name (broken/legacy user link) gets a safe placeholder
    // so the NOT NULL constraint can be applied without losing data.
    const placeholder = await client.query(`
      UPDATE ${SCREENINGS}
      SET person_name = 'Unknown'
      WHERE person_name IS NULL OR person_name = ''
      RETURNING id
    `);
    report.namesPlaceholder = placeholder.rowCount;
    if (placeholder.rowCount > 0) {
      console.log(`   ⚠️  ${placeholder.rowCount} row(s) had no resolvable user - set person_name = 'Unknown'`);
    }

    // ============================================
    // 5. Backfill person_id for existing rows
    // ============================================
    // Legacy rows all shared one development user, so they cannot be assumed to be
    // the same person. Each existing row receives its own person_id, which is the
    // conservative choice: it never merges distinct people, and the same person_id
    // may still be reused across many future screenings.
    console.log('5️⃣  Backfilling person_id for existing rows...');
    await client.query(`
      UPDATE ${SCREENINGS}
      SET person_id = 'P' || LPAD(nextval('persons_id_seq')::TEXT, 4, '0')
      WHERE person_id IS NULL OR person_id = ''
    `);
    const personIds = await client.query(`
      SELECT count(*)::int AS n, count(DISTINCT person_id)::int AS d FROM ${SCREENINGS}
    `);
    report.personIdsAssigned = personIds.rows[0].n;
    report.distinctPersonIds = personIds.rows[0].d;
    console.log(`   ✅ Assigned person_id to ${personIds.rows[0].n} row(s) (${personIds.rows[0].d} distinct)`);

    // ============================================
    // 6. Backfill is_student from existing class_room data
    // ============================================
    console.log('6️⃣  Backfilling is_student from class_room...');
    await client.query(`
      UPDATE ${SCREENINGS}
      SET is_student = true
      WHERE class_room IS NOT NULL AND TRIM(class_room) <> ''
    `);

    // ============================================
    // 7. Drop the user_id foreign key, make it nullable
    // ============================================
    console.log('7️⃣  Removing user_id foreign key dependency...');
    await client.query(`
      ALTER TABLE ${SCREENINGS} DROP CONSTRAINT IF EXISTS shree_raj_health_screenings_user_id_fkey
    `);
    await client.query(`
      ALTER TABLE ${SCREENINGS} ALTER COLUMN user_id DROP NOT NULL
    `);
    console.log('   ✅ user_id FK dropped; user_id retained as a nullable legacy column');

    // ============================================
    // 8. Apply NOT NULL to person_name
    // ============================================
    console.log('8️⃣  Applying NOT NULL to person_name...');
    await client.query(`
      ALTER TABLE ${SCREENINGS} ALTER COLUMN person_name SET NOT NULL
    `);
    console.log('   ✅ person_name is now NOT NULL');

    // ============================================
    // 9. Indexes
    // ============================================
    console.log('9️⃣  Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_screenings_person_id ON ${SCREENINGS}(person_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_screenings_mobile_number ON ${SCREENINGS}(mobile_number)`);
    console.log('   ✅ idx_screenings_person_id and idx_screenings_mobile_number created');

    // Drop the obsolete user_id index (its column is now legacy-only)
    await client.query(`DROP INDEX IF EXISTS idx_screenings_user_id`);
    console.log('   ✅ obsolete idx_screenings_user_id dropped');

    await client.query('COMMIT');
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');

    // ============================================
    // Verification
    // ============================================
    report.rowsAfter = (await client.query(`SELECT count(*)::int AS n FROM ${SCREENINGS}`)).rows[0].n;
    console.log('📊 Row preservation:');
    console.log(`   before: ${report.rowsBefore}   after: ${report.rowsAfter}`);
    if (report.rowsAfter !== report.rowsBefore) {
      throw new Error('Row count changed - migration would be destructive');
    }
    console.log('   ✅ All existing screening records preserved');

    const fks = await client.query(`
      SELECT ccu.table_name AS foreign_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${SCREENINGS}'
    `);
    console.log('');
    console.log('🔗 Remaining foreign keys on screenings:');
    const userFk = fks.rows.find((r) => r.foreign_table === USERS);
    console.log(`   ${USERS}: ${userFk ? '❌ STILL PRESENT' : '✅ removed'}`);
    fks.rows.forEach((r) => console.log(`   - ${r.foreign_table}`));

    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = '${SCREENINGS}'
      ORDER BY ordinal_position
    `);
    console.log('');
    console.log('📋 Resulting schema:');
    cols.rows.forEach((r) => {
      console.log(`   - ${r.column_name}: ${r.data_type}(${r.character_maximum_length ?? '-'}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    return report;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('❌ Migration failed and was rolled back:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then((report) => {
    console.log('');
    console.log('📝 Migration report:');
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
