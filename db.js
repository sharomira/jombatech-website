const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Xt3dQvzjRUJ2@ep-frosty-meadow-aetexufz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Standardized PostgreSQL Table Creation
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL
  );
`;

pool.query(createTableQuery)
  .then(() => console.log('Connected to Neon PostgreSQL Database!'))
  .catch((err) => console.error('Database setup error:', err.stack));

module.exports = {
  all: (text, params, callback) => {
    pool.query(text, params, (err, res) => {
      if (err) return callback(err, null);
      callback(null, res.rows);
    });
  },
  run: (text, params, callback) => {
    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
    
    pool.query(pgText, params, (err, res) => {
      if (err) return callback(err);
      callback(null, res);
    });
  }
};