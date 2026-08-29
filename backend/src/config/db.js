const { Pool } = require('pg');

// Render's managed Postgres requires SSL; local Postgres usually doesn't.
// Toggle with PGSSL=true in your .env when connecting to a hosted DB.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

module.exports = pool;
