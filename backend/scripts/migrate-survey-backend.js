// Migration: add the household survey backend to ServeYeah Health.
//
// WHAT THIS CREATES
// -----------------
//   household_surveys        one row per completed household survey
//   survey_patient_ids_seq   the ID counter behind it
//   generate_survey_patient_id() + its BEFORE INSERT trigger, producing PS000001...
//
// WHY A SEQUENCE AND NOT THE UPSTREAM COUNTER TABLE
// -------------------------------------------------
// The supplied Django implementation allocated IDs from a `PatientIdSequence` row
// locked with SELECT ... FOR UPDATE, and overrode save() so a failed insert would
// not consume a number. PostgreSQL sequences are already atomic, so the lock and
// the rollback dance are unnecessary here: a sequence only ever produces gaps,
// never duplicates. This also matches how every other ID in this project is
// generated - users_id_seq (U0001), workers_id_seq (W0001), camps (C0001),
// screenings_id_seq (S0001) and persons_id_seq (P0001). One convention, not two.
//
// The `survey_id_sequences` table from the Django version is deliberately NOT
// created: this sequence replaces it entirely.
//
// ID FORMAT
// ---------
// 'PS' + 6 digits, e.g. PS000001. The 'PS' prefix cannot collide with screening
// person IDs ('P' + 4 digits, from persons_id_seq): different prefix, different
// width, different sequence. A household respondent and a screened patient are
// different things and are never joined on ID.
//
// WORKER / CAMP REFERENCES
// ------------------------
// worker_ref and camp_ref are real foreign keys to the existing workers and camps
// tables rather than the free-text VARCHAR(64) the Django version used. Free text
// would let 'W1' and 'W0001' become two different workers in a per-worker count,
// silently splitting the numbers. Both columns are nullable, because a survey
// filled in from a shared WhatsApp link belongs to nobody, and both use
// ON DELETE SET NULL so removing a worker never destroys survey history.
//
// NOTHING EXISTING IS TOUCHED
// ---------------------------
// This migration only adds new objects. It never alters shree_raj_health_screenings,
// workers, camps, shree_raj_health_users, or any existing sequence or trigger.
// workers(id) and camps(id) are referenced read-only.
//
// SAFE TO RE-RUN
// --------------
// Every object is created with IF NOT EXISTS, the trigger is dropped and recreated
// so a stale definition can never survive, and the sequence is re-aligned to the
// highest ID actually present. The whole thing runs in one transaction, so a
// failure leaves the database exactly as it was.

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

const SURVEYS = 'household_surveys';
const SEQ = 'survey_patient_ids_seq';
const FN = 'generate_survey_patient_id';
const TRIGGER = 'trigger_generate_survey_patient_id';

const INDEXES = [
  'idx_household_surveys_village',
  'idx_household_surveys_mobile',
  'idx_household_surveys_worker_ref',
  'idx_household_surveys_camp_ref',
  'idx_household_surveys_submitted_at',
];

/** The numeric part of a PS000123 style ID, as an integer. */
const MAX_ID_SQL = `COALESCE(MAX(NULLIF(regexp_replace(patient_id, '\\D', '', 'g'), '')::int), 0)`;

async function runMigration() {
  const client = await pool.connect();
  const report = {};

  try {
    console.log('🔄 Starting household survey backend migration...');
    console.log('');
    console.log('📋 Objects to create: household_surveys, survey_patient_ids_seq, ID trigger');
    console.log('ℹ️  Existing tables (screenings, workers, camps, users) are not modified.');
    console.log('');

    // Preflight: the foreign key targets must already exist.
    for (const target of ['workers', 'camps']) {
      const found = await client.query(`SELECT to_regclass('${target}') AS reg`);
      if (!found.rows[0].reg) {
        throw new Error(
          `Referenced table "${target}" does not exist. Run the core setup first: node scripts/setup-health-tables.js`
        );
      }
    }
    report.fkTargetsPresent = true;
    console.log('✅ Foreign key targets present (workers, camps)');

    await client.query('BEGIN');

    // ---------------------------------------------------------------
    // 1. household_surveys
    // ---------------------------------------------------------------
    // Insurance is none | govt | private | both here, which is deliberately
    // wider than the screening table (govt | private | NULL plus a boolean).
    // The survey answers "does the family have insurance", the screening records
    // the screened person's own cover, so they are kept in separate columns.
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SURVEYS} (
        id                  BIGSERIAL PRIMARY KEY,
        patient_id          VARCHAR(8) NOT NULL,
        respondent_name     VARCHAR(120) NOT NULL,
        village             VARCHAR(120) NOT NULL,
        mobile              VARCHAR(10) NOT NULL,
        males               SMALLINT NOT NULL DEFAULT 0,
        females             SMALLINT NOT NULL DEFAULT 0,
        children_under_12   SMALLINT NOT NULL DEFAULT 0,
        insurance           VARCHAR(10) NOT NULL,
        doctor_visits       JSONB NOT NULL DEFAULT '[]'::jsonb,
        doctor_visit_other  VARCHAR(200) NOT NULL DEFAULT '',
        pathology_tests     JSONB NOT NULL DEFAULT '[]'::jsonb,
        pathology_other     VARCHAR(200) NOT NULL DEFAULT '',
        consent             BOOLEAN NOT NULL DEFAULT false,
        language            VARCHAR(2) NOT NULL DEFAULT 'en',
        source              VARCHAR(10) NOT NULL DEFAULT 'web',
        worker_ref          VARCHAR(10) REFERENCES workers(id) ON DELETE SET NULL,
        camp_ref            VARCHAR(10) REFERENCES camps(id) ON DELETE SET NULL,
        submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT household_surveys_patient_id_uniq UNIQUE (patient_id),
        CONSTRAINT household_surveys_patient_id_chk
          CHECK (patient_id ~ '^PS[0-9]{6}$'),
        CONSTRAINT household_surveys_mobile_chk
          CHECK (mobile ~ '^[6-9][0-9]{9}$'),
        CONSTRAINT household_surveys_insurance_chk
          CHECK (insurance IN ('none', 'govt', 'private', 'both')),
        CONSTRAINT household_surveys_language_chk
          CHECK (language IN ('en', 'hi', 'mr')),
        CONSTRAINT household_surveys_source_chk
          CHECK (source IN ('web', 'app')),
        CONSTRAINT household_surveys_counts_chk
          CHECK (
            males BETWEEN 0 AND 30
            AND females BETWEEN 0 AND 30
            AND children_under_12 BETWEEN 0 AND 30
          ),
        CONSTRAINT household_surveys_members_chk
          CHECK (males + females + children_under_12 >= 1)
      )
    `);
    console.log(`✅ Created table ${SURVEYS}`);

    // ---------------------------------------------------------------
    // 2. Indexes
    // ---------------------------------------------------------------
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_household_surveys_village
        ON ${SURVEYS}(village)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_household_surveys_mobile
        ON ${SURVEYS}(mobile)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_household_surveys_worker_ref
        ON ${SURVEYS}(worker_ref)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_household_surveys_camp_ref
        ON ${SURVEYS}(camp_ref)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_household_surveys_submitted_at
        ON ${SURVEYS}(submitted_at DESC)
    `);
    console.log(`✅ Created ${INDEXES.length} indexes`);

    // ---------------------------------------------------------------
    // 3. Sequence + trigger
    // ---------------------------------------------------------------
    await client.query(`CREATE SEQUENCE IF NOT EXISTS ${SEQ} START 1`);
    console.log(`✅ Ensured sequence ${SEQ}`);

    await client.query(`
      CREATE OR REPLACE FUNCTION ${FN}()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
          NEW.patient_id := 'PS' || LPAD(nextval('${SEQ}')::TEXT, 6, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Dropped first so a stale definition can never survive a re-run.
    await client.query(`DROP TRIGGER IF EXISTS ${TRIGGER} ON ${SURVEYS}`);
    await client.query(`
      CREATE TRIGGER ${TRIGGER}
        BEFORE INSERT ON ${SURVEYS}
        FOR EACH ROW
        EXECUTE FUNCTION ${FN}()
    `);
    console.log(`✅ Created ${TRIGGER} (PS000001, PS000002, ...)`);

    // ---------------------------------------------------------------
    // 4. Align the sequence with any rows that already exist, so a
    //    re-run after data exists cannot hand out a duplicate.
    // ---------------------------------------------------------------
    await client.query(`LOCK TABLE ${SURVEYS} IN SHARE ROW EXCLUSIVE MODE`);

    const maxRes = await client.query(`SELECT ${MAX_ID_SQL} AS max_num FROM ${SURVEYS}`);
    report.maxExistingId = maxRes.rows[0].max_num;

    // Read the counter before touching it, so the report can say truthfully
    // whether this run actually moved it.
    const beforeSeq = await client.query(`SELECT last_value, is_called FROM ${SEQ}`);
    const seqLastBefore = Number(beforeSeq.rows[0].last_value);

    if (report.maxExistingId > 0) {
      // Only align when there is something to align to.
      const setRes = await client.query(`
        SELECT setval(
          '${SEQ}',
          (SELECT ${MAX_ID_SQL} FROM ${SURVEYS}),
          (SELECT ${MAX_ID_SQL} FROM ${SURVEYS}) > 0
        ) AS new_value
      `);
      report.sequenceLastValue = Number(setRes.rows[0].new_value);
      report.sequenceAligned = report.sequenceLastValue === seqLastBefore;
    } else {
      // The table is empty, so there is nothing to align to and setval must NOT
      // be called: the sequence was created with START 1, which also sets its
      // minimum to 1, so setval(seq, 0, false) is rejected with 22003
      // ("value 0 is out of bounds"). Leaving the counter alone is already
      // correct - a fresh sequence reports last_value 1 with is_called false, so
      // the first nextval() returns 1 and the first ID is PS000001.
      report.sequenceLastValue = 0;
      report.sequenceAligned = true;
    }

    report.nextPatientId = `PS${String(report.sequenceLastValue + 1).padStart(6, '0')}`;

    console.log(
      `🎯 Sequence last_value: ${report.sequenceLastValue} → next ID: ${report.nextPatientId}`
    );
    if (report.maxExistingId === 0) {
      console.log('   ℹ️  No existing survey rows — sequence left at its initial START 1 state');
    } else {
      console.log(
        report.sequenceAligned
          ? '   ℹ️  Sequence already aligned — migration was a no-op for IDs (idempotent)'
          : '   ✅ Sequence re-aligned to the highest existing ID'
      );
    }

    // ---------------------------------------------------------------
    // 5. Safety assertions
    // ---------------------------------------------------------------
    const expectedColumns = [
      'id', 'patient_id', 'respondent_name', 'village', 'mobile',
      'males', 'females', 'children_under_12', 'insurance',
      'doctor_visits', 'doctor_visit_other', 'pathology_tests', 'pathology_other',
      'consent', 'language', 'source', 'worker_ref', 'camp_ref', 'submitted_at',
    ];
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${SURVEYS}'
    `);
    const actual = new Set(cols.rows.map((r) => r.column_name));
    const missing = expectedColumns.filter((c) => !actual.has(c));
    if (missing.length > 0) {
      throw new Error(`Table is missing expected columns: ${missing.join(', ')}`);
    }
    report.columnCount = actual.size;
    console.log(`   ✅ All ${expectedColumns.length} expected columns present`);

    const constraints = await client.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = '${SURVEYS}'::regclass
    `);
    const names = new Set(constraints.rows.map((r) => r.conname));
    for (const required of [
      'household_surveys_patient_id_uniq',
      'household_surveys_patient_id_chk',
      'household_surveys_mobile_chk',
      'household_surveys_insurance_chk',
      'household_surveys_language_chk',
      'household_surveys_source_chk',
      'household_surveys_counts_chk',
      'household_surveys_members_chk',
    ]) {
      if (!names.has(required)) {
        throw new Error(`Constraint ${required} is missing`);
      }
    }
    report.constraintCount = names.size;
    console.log('   ✅ All validation constraints present');

    const fks = await client.query(`
      SELECT conname, confrelid::regclass::text AS ref_table
      FROM pg_constraint
      WHERE conrelid = '${SURVEYS}'::regclass AND contype = 'f'
    `);
    const fkTables = fks.rows.map((r) => r.ref_table);
    for (const target of ['workers', 'camps']) {
      if (!fkTables.includes(target)) {
        throw new Error(`Foreign key to ${target} is missing`);
      }
    }
    report.foreignKeys = fkTables.sort();
    console.log(`   ✅ Foreign keys present (${report.foreignKeys.join(', ')})`);

    const idx = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = '${SURVEYS}'
    `);
    const idxNames = new Set(idx.rows.map((r) => r.indexname));
    for (const name of INDEXES) {
      if (!idxNames.has(name)) {
        throw new Error(`Index ${name} is missing`);
      }
    }
    report.indexCount = idxNames.size;
    console.log(`   ✅ All ${INDEXES.length} indexes present`);

    const trig = await client.query(`
      SELECT tgname FROM pg_trigger
      WHERE tgrelid = '${SURVEYS}'::regclass AND NOT tgisinternal
        AND tgname = '${TRIGGER}'
    `);
    if (trig.rows.length !== 1) {
      throw new Error(`${TRIGGER} is missing`);
    }
    console.log(`   ✅ ${TRIGGER} is in place`);

    const fn = await client.query(`
      SELECT pg_get_functiondef(p.oid) AS def
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = '${FN}' AND n.nspname = 'public'
    `);
    const def = fn.rows[0]?.def ?? '';
    if (!def.includes("'PS'") || !def.includes('LPAD')) {
      throw new Error(`${FN} no longer produces a PS-prefixed 6-digit ID`);
    }
    console.log('   ✅ Trigger still zero-pads to PS000000');

    // The screening table must be untouched by this migration.
    const screeningCols = await client.query(`
      SELECT count(*)::int AS n
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'shree_raj_health_screenings'
    `);
    report.screeningsTablePresent = screeningCols.rows[0].n > 0;
    if (!report.screeningsTablePresent) {
      throw new Error('shree_raj_health_screenings is missing — this should never happen');
    }
    console.log('   ✅ Existing screening table untouched');

    await client.query('COMMIT');

    report.rowsInTable = (
      await client.query(`SELECT count(*)::int AS n FROM ${SURVEYS}`)
    ).rows[0].n;
    report.created = true;

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
    console.log('');
    console.log('✅ Household survey backend schema is ready.');
    console.log('   Next: the survey service, controller and routes are not wired yet.');
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
