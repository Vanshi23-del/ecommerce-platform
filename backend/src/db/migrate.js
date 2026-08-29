// Applies schema.sql to the database pointed at by DATABASE_URL.
// Usage: npm run db:migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    if (err.code === '42710' || err.code === '42P07') {
      // duplicate_object / duplicate_table — schema already applied
      console.log('Schema already exists, skipping.');
    } else {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

migrate();
