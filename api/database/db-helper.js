const { getDatabase } = require('./db');

const isPostgres = !!process.env.DATABASE_URL;

function convertPlaceholders(query) {
  if (!isPostgres) return query;
  
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

function convertDatetime(query) {
  if (!isPostgres) return query;
  
  return query.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
}

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

async function dbRun(query, params = []) {
  const db = getDatabase();
  query = convertDatetime(convertPlaceholders(query));
  
  if (isPostgres) {
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
