const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Xt3dQvzjRUJ2@ep-frosty-meadow-aetexufz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Schema definition for products and students
const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    course VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    certificate_eligible BOOLEAN DEFAULT FALSE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
  CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
`;

// Initialize Tables
pool.query(createTablesQuery)
  .then(() => console.log('Connected to Neon PostgreSQL Database and initialized tables!'))
  .catch((err) => console.error('Database setup error:', err.message));

module.exports = {
  // Export pool directly for raw async/await pg queries
  pool,

  // Helper for SELECT queries returning rows
  all: (text, params, callback) => {
    let paramIndex = 1;
    const pgText = typeof text === 'string' ? text.replace(/\?/g, () => `$${paramIndex++}`) : text;

    pool.query(pgText, params, (err, res) => {
      if (err) return callback(err, null);
      callback(null, res.rows);
    });
  },

  // Helper for INSERT / UPDATE / DELETE queries
  run: (text, params, callback) => {
    let paramIndex = 1;
    const pgText = typeof text === 'string' ? text.replace(/\?/g, () => `$${paramIndex++}`) : text;

    pool.query(pgText, params, (err, res) => {
      if (err) return callback(err);
      callback(null, res);
    });
  }
};