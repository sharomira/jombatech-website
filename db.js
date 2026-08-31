const { Pool } = require('pg');

// Paste your exact Neon connection string inside the single quotes below:
const connectionString = 'postgresql://neondb_owner:npg_Xt3dQvzjRUJ2@ep-frosty-meadow-aetexufz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Neon cloud connections
  }
});

// Automatically create the products table in Neon if it doesn't exist yet
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price VARCHAR(100) NOT NULL,
    image VARCHAR(255) NOT NULL
  );
`;

pool.query(createTableQuery)
  .then(() => console.log('Connected to Neon PostgreSQL Database!'))
  .catch((err) => console.error('Database setup error:', err.stack));

// Export helper functions to match our Express app code
module.exports = {
  all: (text, params, callback) => {
    pool.query(text, params, (err, res) => {
      if (err) return callback(err, null);
      callback(null, res.rows);
    });
  },
  run: (text, params, callback) => {
    // Convert SQLite '?' placeholders to PostgreSQL '$1, $2, $3...'
    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
    
    pool.query(pgText, params, (err, res) => {
      if (err) return callback(err);
      callback(null, res);
    });
  }
};