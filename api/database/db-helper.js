// Универсальный хелпер для работы с базой данных
// Поддерживает и SQLite и PostgreSQL

const { getDatabase } = require('./db');

// Определяем тип базы данных
const isPostgres = !!process.env.DATABASE_URL;

// Конвертирует ? в $1, $2 для PostgreSQL
function convertPlaceholders(query) {
  if (!isPostgres) return query;
  
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

// Конвертирует datetime('now') в CURRENT_TIMESTAMP для PostgreSQL
function convertDatetime(query) {
  if (!isPostgres) return query;
  
  return query
    .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
    .replace(/CURRENT_TIMESTAMP/g, 'CURRENT_TIMESTAMP');
}

// Универсальный метод get (возвращает одну строку)
async function dbGet(query, params = []) {
  const db = getDatabase();
  query = convertDatetime(convertPlaceholders(query));
  
  if (isPostgres) {
    const result = await db.query(query, params);
    return result.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
}

// Универсальный метод all (возвращает все строки)
async function dbAll(query, params = []) {
  const db = getDatabase();
  query = convertDatetime(convertPlaceholders(query));
  
  if (isPostgres) {
    const result = await db.query(query, params);
    return result.rows;
  } else {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

// Универсальный метод run (INSERT, UPDATE, DELETE)
async function dbRun(query, params = []) {
  const db = getDatabase();
  query = convertDatetime(convertPlaceholders(query));
  
  if (isPostgres) {
    // Для INSERT с RETURNING
    if (query.toUpperCase().includes('INSERT') && !query.toUpperCase().includes('RETURNING')) {
      query += ' RETURNING id';
    }
    
    const result = await db.query(query, params);
    return {
      lastID: result.rows[0]?.id,
      changes: result.rowCount
    };
  } else {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

module.exports = {
  dbGet,
  dbAll,
  dbRun,
  isPostgres
};
