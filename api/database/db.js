// Определяем тип базы данных по наличию DATABASE_URL
const isPostgres = !!process.env.DATABASE_URL;

let db, pool;

if (isPostgres) {
  // PostgreSQL для Railway/Production
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  console.log('✅ Using PostgreSQL database');
} else {
  // SQLite для локальной разработки
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = process.env.DB_PATH || './database.sqlite';
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('✅ Connected to SQLite database');
    }
  });
}

function getDatabase() {
  return isPostgres ? pool : db;
}

async function initDatabase() {
  if (isPostgres) {
    // PostgreSQL инициализация
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

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
      throw err;
    } finally {
      client.release();
    }
  } else {
    // SQLite инициализация
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            group_name TEXT DEFAULT 'Default',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

        db.run(`
          CREATE TABLE IF NOT EXISTS activation_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_code TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            duration_days INTEGER DEFAULT 30,
            used INTEGER DEFAULT 0,
            used_by INTEGER,
            used_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (used_by) REFERENCES users(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            plan_type TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            paid_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS promocodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            discount_percent INTEGER NOT NULL,
            max_uses INTEGER DEFAULT 0,
            used_count INTEGER DEFAULT 0,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS admin_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_url TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL
          )
        `, (err) => {
          if (err) {
            console.error('Error initializing database:', err);
            reject(err);
          } else {
            console.log('✅ Database tables initialized');
            resolve();
          }
        });
      });
    });
  }
}

module.exports = {
  getDatabase,
  getDb: getDatabase,
  initDatabase,
  db,
  pool,
  isPostgres
};
