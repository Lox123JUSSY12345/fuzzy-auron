const { Pool } = require('pg');

// Railway автоматически предоставляет DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function getDatabase() {
  return pool;
}

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        group_name TEXT DEFAULT 'Default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        banned INTEGER DEFAULT 0,
        status INTEGER DEFAULT 0,
        avatar_url TEXT,
        gauth_secret TEXT,
        gauth_enabled INTEGER DEFAULT 0,
        hwid TEXT DEFAULT '-',
        ram INTEGER DEFAULT 4096,
        sub_until TEXT DEFAULT '',
        version TEXT DEFAULT 'default'
      )
    `);

    // Activation keys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activation_keys (
        id SERIAL PRIMARY KEY,
        key_code TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        duration_days INTEGER DEFAULT 30,
        used INTEGER DEFAULT 0,
        used_by INTEGER,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (used_by) REFERENCES users(id)
      )
    `);

    // Configs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        plan_type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Promocodes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promocodes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL,
        max_uses INTEGER DEFAULT 0,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
      )
    `);

    // Admin sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        session_url TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getDatabase,
  getDb: getDatabase,
  initDatabase,
  pool
};
