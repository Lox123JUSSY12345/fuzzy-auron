const { Pool } = require('pg');

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Создание таблицы пользователей при первом запуске
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Пользователь',
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
  }
}

// Получить пользователя по username или email
async function getUserByLogin(login) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [login]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Создать нового пользователя
async function createUser(username, email, password, role = 'Пользователь') {
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, password, role]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}

// Получить всех пользователей
async function getAllUsers() {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users');
    return result.rows;
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
}

// Проверить существование пользователя
async function userExists(username, email) {
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('User exists check error:', error);
    return false;
  }
}

module.exports = {
  pool,
  initDatabase,
  getUserByLogin,
  createUser,
  getAllUsers,
  userExists
};
