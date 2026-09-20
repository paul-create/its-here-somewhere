const fs = require('fs');
const path = require('path');
const pool = require('../src/db');
require('dotenv').config();

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      const version = file.replace('.sql', '');
      
      // Check if already applied
      const check = await client.query(
        'SELECT id FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (check.rows.length > 0) {
        console.log(`✓ ${version} (already applied)`);
        continue;
      }

      // Run migration
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      
      // Track it
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );

      console.log(`✓ ${version} (applied)`);
    }

    console.log('All migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigrations();