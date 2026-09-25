// Execute ALTER TABLE to add photo_url column
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
    console.log('🔄 Adding photo_url column to shree_raj_health_users...');
    
    await client.query(`
      ALTER TABLE shree_raj_health_users 
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500)
    `);
    
    console.log('✅ ALTER TABLE executed successfully');
    
    // Verify the column exists
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'shree_raj_health_users' 
      AND column_name = 'photo_url'
    `);
    
    if (result.rows.length > 0) {
      const col = result.rows[0];
      console.log('');
      console.log('📋 Verification - photo_url column:');
      console.log(`   - column_name: ${col.column_name}`);
      console.log(`   - data_type: ${col.data_type}`);
      console.log(`   - is_nullable: ${col.is_nullable}`);
      console.log(`   - column_default: ${col.column_default || 'none'}`);
      console.log('');
      console.log('✅ photo_url column verified successfully!');
    } else {
      console.error('❌ Column not found after ALTER TABLE');
      throw new Error('Column verification failed');
    }
    
  } catch (error) {
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