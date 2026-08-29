// Creates one test login per role so the README credentials are real.
// Usage: node src/db/seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const USERS = [
  { name: 'Admin User', email: 'admin@example.com', password: 'Admin@123', role: 'admin' },
  { name: 'Sales Person', email: 'sales@example.com', password: 'Sales@123', role: 'sales_person' },
  { name: 'Regular User', email: 'user@example.com', password: 'User@123', role: 'user' },
];

async function seed() {
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, hash, u.role]
    );
  }
  console.log('Seeded test accounts (see README for credentials).');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
