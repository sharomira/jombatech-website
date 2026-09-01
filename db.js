const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Xt3dQvzjRUJ2@ep-frosty-meadow-aetexufz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Standardized PostgreSQL Table Creation Query
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL
  );
`;

// Initialize Table without dumping raw socket objects
pool.query(createTableQuery)
  .then(() => console.log('Connected to Neon PostgreSQL Database!'))
  .catch((err) => console.error('Database setup error:', err.message));

module.exports = {
  all: (text, params, callback) => {
    // Convert SQLite style ? placeholders to PostgreSQL $1, $2, etc.
    let paramIndex = 1;
    const pgText = typeof text === 'string' ? text.replace(/\?/g, () => `$${paramIndex++}`) : text;

    pool.query(pgText, params, (err, res) => {
      if (err) return callback(err, null);
      callback(null, res.rows);
    });
  },
  run: (text, params, callback) => {
    let paramIndex = 1;
    const pgText = typeof text === 'string' ? text.replace(/\?/g, () => `$${paramIndex++}`) : text;
    
    pool.query(pgText, params, (err, res) => {
      if (err) return callback(err);
      callback(null, res);
    });
  }
};