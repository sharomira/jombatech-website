require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { body, param, validationResult } = require('express-validator');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Trust reverse proxy for Render deployment
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// Basic Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname));

// -----------------------------------------------------------------------------
// HELPER: DATABASE QUERY PROMISIFIER (Supports both SQLite & PostgreSQL)
// -----------------------------------------------------------------------------
const queryDb = (text, params = []) => {
  return new Promise((resolve, reject) => {
    if (typeof db.query === 'function') {
      // PostgreSQL / Neon driver
      db.query(text, params)
        .then((res) => resolve(res.rows || res))
        .catch((err) => reject(err));
    } else if (typeof db.all === 'function') {
      // SQLite driver
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        db.all(text, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        db.run(text, params, function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, changes: this.changes });
        });
      }
    } else {
      reject(new Error('Unsupported database interface.'));
    }
  });
};

// -----------------------------------------------------------------------------
// SECURITY & AUTHENTICATION HELPERS
// -----------------------------------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Registration limit reached for this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware to extract and format validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
  }
  next();
};

function generateAuthToken(user) {
  return jwt.sign(
    { id: user.id || user.student_id, student_id: user.student_id || null, role: user.role || 'student' },
    process.env.JWT_SECRET || 'jombatech_secret_key_2026',
    { expiresIn: '2h' }
  );
}

function authenticateToken(req, res, next) {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. Please log in.' });

  jwt.verify(token, process.env.JWT_SECRET || 'jombatech_secret_key_2026', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token.' });
    req.user = user;
    next();
  });
}

// -----------------------------------------------------------------------------
// PUBLIC & LANDING ROUTES
// -----------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'), (err) => {
    if (err) res.status(500).send('Could not load dashboard.html');
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION API ROUTES
// -----------------------------------------------------------------------------

// POST /api/register (Student Registration)
app.post(
  '/api/register',
  registerLimiter,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.').escape(),
    body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone number is required.').escape(),
    body('course').trim().notEmpty().withMessage('Course selection is required.').escape(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
  ],
  validateRequest,
  async (req, res) => {
    const { fullName, email, phone, course, password } = req.body;

    try {
      const existing = await queryDb('SELECT * FROM students WHERE LOWER(email) = LOWER(?)', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const studentId = 'JTI-' + Math.floor(1000 + Math.random() * 9000);

      const insertQuery = `
        INSERT INTO students (student_id, full_name, email, phone, course, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await queryDb(insertQuery, [studentId, fullName, email, phone, course, hashedPassword]);

      res.status(201).json({
        message: 'Registration successful!',
        student: { student_id: studentId, full_name: fullName, email, course }
      });
    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(500).json({ error: 'Failed to create student account.' });
    }
  }
);

// POST /api/admin/register (Admin Account Creation)
app.post(
  '/api/admin/register',
  registerLimiter,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.').escape(),
    body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('adminSecret').notEmpty().withMessage('Admin secret key is required.')
  ],
  validateRequest,
  async (req, res) => {
    const { fullName, email, password, adminSecret } = req.body;

    const EXPECTED_SECRET = process.env.ADMIN_REGISTRATION_KEY || 'jombatech_admin_secret_2026';
    if (adminSecret !== EXPECTED_SECRET) {
      return res.status(403).json({ error: 'Unauthorized: Invalid Admin Registration Key.' });
    }

    try {
      const existingAdmin = await queryDb('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)', [email]);
      if (existingAdmin.length > 0) {
        return res.status(400).json({ error: 'An admin with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await queryDb(
        'INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)',
        [fullName, email, hashedPassword]
      );

      res.status(201).json({ message: 'Admin account created successfully.' });
    } catch (error) {
      console.error('Admin Registration error:', error.message);
      res.status(500).json({ error: 'Failed to create admin account.' });
    }
  }
);

// POST /api/login (Unified Student and Admin Login)
app.post(
  '/api/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    body('role').optional().trim().escape()
  ],
  validateRequest,
  async (req, res) => {
    const { email, password, role } = req.body;

    try {
      // ADMIN LOGIN HANDLER
      if (role === 'admin') {
        const admins = await queryDb('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)', [email]);
        
        // Fallback check for emergency hardcoded admin credentials if DB table is empty
        if (admins.length === 0) {
          if (email === 'admin@jombatech.com' && password === 'admin123') {
            const adminUser = { id: 1, fullName: 'System Administrator', email, role: 'admin' };
            const token = generateAuthToken(adminUser);
            res.cookie('token', token, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', maxAge: 7200000 });
            return res.json({ message: 'Admin login successful.', user: adminUser, token });
          }
          return res.status(401).json({ error: 'Invalid admin credentials.' });
        }

        const admin = admins[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid admin credentials.' });

        const adminUser = { id: admin.id, fullName: admin.full_name, email: admin.email, role: 'admin' };
        const token = generateAuthToken(adminUser);

        res.cookie('token', token, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', maxAge: 7200000 });
        return res.json({ message: 'Admin login successful.', user: adminUser, token });
      }

      // STUDENT LOGIN HANDLER
      const students = await queryDb('SELECT * FROM students WHERE LOWER(email) = LOWER(?)', [email]);
      if (students.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      const student = students[0];
      const match = await bcrypt.compare(password, student.password_hash);
      if (!match) return res.status(401).json({ error: 'Incorrect password.' });

      delete student.password_hash;
      student.role = 'student';

      const token = generateAuthToken(student);
      res.cookie('token', token, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', maxAge: 7200000 });
      res.json({ message: 'Login successful.', user: student, token });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ error: 'Authentication failed.' });
    }
  }
);

// POST /api/reset-password
app.post(
  '/api/reset-password',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone number is required.').escape(),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
  ],
  validateRequest,
  async (req, res) => {
    const { email, phone, newPassword } = req.body;

    try {
      const rows = await queryDb('SELECT * FROM students WHERE LOWER(email) = LOWER(?) AND phone = ?', [email, phone]);
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Email and phone number do not match our records.' });
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await queryDb('UPDATE students SET password_hash = ? WHERE LOWER(email) = LOWER(?)', [newHashedPassword, email]);

      res.json({ message: 'Password updated successfully across all devices!' });
    } catch (error) {
      console.error('Reset-password error:', error.message);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  }
);

// -----------------------------------------------------------------------------
// SHOP & ADMIN PRODUCTS ROUTES
// -----------------------------------------------------------------------------

app.get('/api/products', async (req, res) => {
  try {
    const products = await queryDb('SELECT * FROM products ORDER BY id DESC');
    res.json(products || []);
  } catch (err) {
    console.error('API Error fetching products:', err.message);
    res.status(500).json({ error: 'Failed to retrieve products from database' });
  }
});

app.get('/admin', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Access denied: Admins only.');
  }

  try {
    const products = await queryDb('SELECT * FROM products ORDER BY id DESC');
    res.render('admin', { products });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.render('admin', { products: [] });
  }
});

app.post(
  '/admin/add-product',
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('Product title is required.').escape(),
    body('category').trim().notEmpty().withMessage('Category is required.').escape(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a valid positive number.'),
    body('image').trim().notEmpty().withMessage('Image URL is required.').isURL().withMessage('Must be a valid URL.')
  ],
  validateRequest,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

    const { title, category, price, image } = req.body;
    try {
      await queryDb('INSERT INTO products (title, category, price, image) VALUES (?, ?, ?, ?)', [title, category, price, image]);
      res.redirect('/admin');
    } catch (err) {
      console.error('Error inserting product:', err.message);
      res.status(500).send('Failed to add product.');
    }
  }
);

app.post(
  '/admin/update-product/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('Product ID must be an integer.'),
    body('title').trim().notEmpty().withMessage('Product title is required.').escape(),
    body('category').trim().notEmpty().withMessage('Category is required.').escape(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a valid positive number.'),
    body('image').trim().notEmpty().withMessage('Image URL is required.').isURL().withMessage('Must be a valid URL.')
  ],
  validateRequest,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

    const { id } = req.params;
    const { title, category, price, image } = req.body;

    try {
      await queryDb('UPDATE products SET title = ?, category = ?, price = ?, image = ? WHERE id = ?', [title, category, price, image, id]);
      res.redirect('/admin');
    } catch (err) {
      console.error('Error updating product:', err.message);
      res.status(500).send('Failed to update product.');
    }
  }
);

app.post(
  '/admin/delete-product/:id',
  authenticateToken,
  [param('id').isInt().withMessage('Product ID must be an integer.')],
  validateRequest,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

    const { id } = req.params;
    try {
      await queryDb('DELETE FROM products WHERE id = ?', [id]);
      res.redirect('/admin');
    } catch (err) {
      console.error('Error deleting product:', err.message);
      res.status(500).send('Failed to delete product.');
    }
  }
);

// -----------------------------------------------------------------------------
// ADMIN STUDENT MANAGEMENT ROUTES (Admins Only)
// -----------------------------------------------------------------------------

// GET all students
app.get('/api/admin/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  try {
    const students = await queryDb(
      'SELECT id, student_id, full_name, email, phone, course, created_at FROM students ORDER BY id DESC'
    );
    res.json(students);
  } catch (error) {
    console.error('Fetch students error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve students.' });
  }
});

// UPDATE a student record
app.put(
  '/api/admin/students/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('Student ID must be an integer.'),
    body('fullName').trim().notEmpty().withMessage('Full name required.').escape(),
    body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone required.').escape(),
    body('course').trim().notEmpty().withMessage('Course required.').escape()
  ],
  validateRequest,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

    const { id } = req.params;
    const { fullName, email, phone, course } = req.body;

    try {
      const updateQuery = `
        UPDATE students 
        SET full_name = ?, email = ?, phone = ?, course = ? 
        WHERE id = ?
      `;
      await queryDb(updateQuery, [fullName, email, phone, course, id]);
      res.json({ message: 'Student record updated successfully.' });
    } catch (error) {
      console.error('Update student error:', error.message);
      res.status(500).json({ error: 'Failed to update student record.' });
    }
  }
);

// DELETE a student record
app.delete(
  '/api/admin/students/:id',
  authenticateToken,
  [param('id').isInt().withMessage('Student ID must be an integer.')],
  validateRequest,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

    const { id } = req.params;

    try {
      await queryDb('DELETE FROM students WHERE id = ?', [id]);
      res.json({ message: 'Student deleted successfully.' });
    } catch (error) {
      console.error('Delete student error:', error.message);
      res.status(500).json({ error: 'Failed to delete student.' });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});