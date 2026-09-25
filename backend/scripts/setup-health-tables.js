// Database migration script for ServeYeah Health core tables
// Creates: shree_raj_health_users, workers, camps, shree_raj_health_screenings

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
  connectionTimeoutMillis: 5000,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting ServeYeah Health database migration...');
    console.log('📋 Tables to create: shree_raj_health_users, workers, camps');
    console.log('');

    await client.query('BEGIN');

    // ============================================
    // 1. shree_raj_health_users table
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS shree_raj_health_users (
        id VARCHAR(10) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        date_of_birth DATE,
        gender VARCHAR(20),
        address TEXT,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        blood_group VARCHAR(5),
        allergies TEXT,
        chronic_conditions TEXT,
        medications TEXT,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Created shree_raj_health_users');

    // Indexes for users
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON shree_raj_health_users(email)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON shree_raj_health_users(phone)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_active ON shree_raj_health_users(is_active)
    `);
    console.log('✅ Created user indexes');

    // ============================================
    // 2. workers table
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id VARCHAR(10) PRIMARY KEY,
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL DEFAULT 'health_worker',
        department VARCHAR(100),
        qualification VARCHAR(255),
        experience_years INTEGER DEFAULT 0,
        date_of_joining DATE,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Created workers');

    // Indexes for workers
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workers_employee_id ON workers(employee_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workers_role ON workers(role)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(is_active)
    `);
    console.log('✅ Created worker indexes');

    // ============================================
    // 3. camps table
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS camps (
        id VARCHAR(10) PRIMARY KEY,
        camp_name VARCHAR(255) NOT NULL,
        camp_category VARCHAR(100),
        camp_date DATE NOT NULL,
        camp_location VARCHAR(500) NOT NULL,
        organizer_institution_1 VARCHAR(255),
        organizer_institution_2 VARCHAR(255),
        association_details TEXT,
        venue_name VARCHAR(255),
        venue_address TEXT,
        is_active BOOLEAN DEFAULT true,
        max_capacity INTEGER,
        registered_count INTEGER DEFAULT 0,
        created_by VARCHAR(10) REFERENCES workers(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Created camps');

    // Indexes for camps
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_camps_date ON camps(camp_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_camps_active ON camps(is_active)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_camps_created_by ON camps(created_by)
    `);
    console.log('✅ Created camp indexes');

    // ============================================
    // 4. shree_raj_health_screenings table
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS shree_raj_health_screenings (
        id VARCHAR(10) PRIMARY KEY,
        user_id VARCHAR(10) NOT NULL REFERENCES shree_raj_health_users(id),
        camp_id VARCHAR(10) REFERENCES camps(id),
        worker_id VARCHAR(10) REFERENCES workers(id),
        village VARCHAR(255),
        class_room VARCHAR(100),
        roll_no VARCHAR(50),
        care_of VARCHAR(255),
        height NUMERIC(6,2),
        weight NUMERIC(6,2),
        bmi NUMERIC(6,2),
        blood_pressure VARCHAR(50),
        blood_sugar VARCHAR(50),
        heart_rate INTEGER,
        ecg VARCHAR(255),
        echo_heart VARCHAR(255),
        advice TEXT,
        photo_url VARCHAR(500),
        screening_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Created shree_raj_health_screenings');

    // Indexes for screenings
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_screenings_user_id ON shree_raj_health_screenings(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_screenings_camp_id ON shree_raj_health_screenings(camp_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_screenings_worker_id ON shree_raj_health_screenings(worker_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_screenings_screening_date ON shree_raj_health_screenings(screening_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_screenings_active ON shree_raj_health_screenings(is_active)
    `);
    console.log('✅ Created screening indexes');

    // ============================================
    // ID Generation Functions (using sequences)
    // ============================================
    
    // Users sequence and trigger
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS users_id_seq START 1
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.id IS NULL OR NEW.id = '' THEN
          NEW.id := 'U' || LPAD(nextval('users_id_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_generate_user_id ON shree_raj_health_users
    `);
    await client.query(`
      CREATE TRIGGER trigger_generate_user_id
        BEFORE INSERT ON shree_raj_health_users
        FOR EACH ROW
        EXECUTE FUNCTION generate_user_id()
    `);
    console.log('✅ Created user ID generation trigger (U0001, U0002, ...)');

    // Workers sequence and trigger
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS workers_id_seq START 1
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_worker_id()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.id IS NULL OR NEW.id = '' THEN
          NEW.id := 'W' || LPAD(nextval('workers_id_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_generate_worker_id ON workers
    `);
    await client.query(`
      CREATE TRIGGER trigger_generate_worker_id
        BEFORE INSERT ON workers
        FOR EACH ROW
        EXECUTE FUNCTION generate_worker_id()
    `);
    console.log('✅ Created worker ID generation trigger (W0001, W0002, ...)');

    // Camps sequence and trigger
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS camps_id_seq START 1
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_camp_id()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.id IS NULL OR NEW.id = '' THEN
          NEW.id := 'C' || LPAD(nextval('camps_id_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_generate_camp_id ON camps
    `);
    await client.query(`
      CREATE TRIGGER trigger_generate_camp_id
        BEFORE INSERT ON camps
        FOR EACH ROW
        EXECUTE FUNCTION generate_camp_id()
    `);
    console.log('✅ Created camp ID generation trigger (C0001, C0002, ...)');

    // Screenings sequence and trigger
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS screenings_id_seq START 1
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_screening_id()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.id IS NULL OR NEW.id = '' THEN
          NEW.id := 'S' || LPAD(nextval('screenings_id_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_generate_screening_id ON shree_raj_health_screenings
    `);
    await client.query(`
      CREATE TRIGGER trigger_generate_screening_id
        BEFORE INSERT ON shree_raj_health_screenings
        FOR EACH ROW
        EXECUTE FUNCTION generate_screening_id()
    `);
    console.log('✅ Created screening ID generation trigger (S0001, S0002, ...)');

    // ============================================
    // Updated_at trigger function
    // ============================================
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON shree_raj_health_users
    `);
    await client.query(`
      CREATE TRIGGER trigger_update_users_updated_at
        BEFORE UPDATE ON shree_raj_health_users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_workers_updated_at ON workers
    `);
    await client.query(`
      CREATE TRIGGER trigger_update_workers_updated_at
        BEFORE UPDATE ON workers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_camps_updated_at ON camps
    `);
    await client.query(`
      CREATE TRIGGER trigger_update_camps_updated_at
        BEFORE UPDATE ON camps
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Screening updated_at trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_screenings_updated_at ON shree_raj_health_screenings
    `);
    await client.query(`
      CREATE TRIGGER trigger_update_screenings_updated_at
        BEFORE UPDATE ON shree_raj_health_screenings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Created updated_at triggers for all tables');

    await client.query('COMMIT');
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');

    // Verify tables
    console.log('📊 Verifying table structures...');
    console.log('');

    const tables = ['shree_raj_health_users', 'workers', 'camps', 'shree_raj_health_screenings'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`📋 ${table}:`);
      result.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
      console.log('');
    }

    // Verify no existing tables were modified (check if our tables are new)
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('shree_raj_health_users', 'workers', 'camps', 'shree_raj_health_screenings')
    `);
    
    console.log(`✅ Confirmed: ${existingTables.rows.length} ServeYeah Health tables exist`);
    console.log('✅ No existing tables were modified');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});