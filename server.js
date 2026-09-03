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
    { id: user.id, student_id: user.student_id || null, role: user.role || 'student' },
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
// STUDENT AUTHENTICATION API ROUTES
// -----------------------------------------------------------------------------

// POST /api/register
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

    db.all('SELECT * FROM students WHERE LOWER(email) = ?', [email], async (err, rows) => {
      if (err) {
        console.error('Registration query error:', err.message);
        return res.status(500).json({ error: 'Database error during registration.' });
      }

      if (rows && rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const studentId = 'JTI-' + Math.floor(1000 + Math.random() * 9000);

        const insertQuery = `
          INSERT INTO students (student_id, full_name, email, phone, course, password_hash)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [studentId, fullName, email, phone, course, hashedPassword], (insertErr) => {
          if (insertErr) {
            console.error('Error inserting student:', insertErr.message);
            return res.status(500).json({ error: 'Failed to create student account.' });
          }

          res.status(201).json({
            message: 'Registration successful!',
            student: {
              student_id: studentId,
              full_name: fullName,
              email: email,
              course: course
            }
          });
        });
      } catch (hashError) {
        console.error('Bcrypt error:', hashError);
        res.status(500).json({ error: 'Server security error.' });
      }
    });
  }
);

// POST /api/login
app.post(
  '/api/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    body('role').optional().trim().escape()
  ],
  validateRequest,
  (req, res) => {
    const { email, password, role } = req.body;

    // Admin Login Handler
    if (role === 'admin') {
      if (email === 'admin@jombatech.com' && password === 'admin123') {
        const adminUser = { fullName: 'System Administrator', email: email, role: 'admin' };
        const token = generateAuthToken(adminUser);

        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000 });
        return res.json({
          message: 'Admin authentication successful.',
          user: adminUser,
          token: token
        });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
    }

    // Student Login Query
    db.all('SELECT * FROM students WHERE LOWER(email) = ?', [email], async (err, rows) => {
      if (err) {
        console.error('Login query error:', err.message);
        return res.status(500).json({ error: 'Database error during login.' });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      const student = rows[0];

      try {
        const passwordMatch = await bcrypt.compare(password, student.password_hash);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Incorrect password.' });
        }

        delete student.password_hash;
        student.role = 'student';

        const token = generateAuthToken(student);
        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000 });

        res.json({
          message: 'Login successful.',
          user: student,
          token: token
        });
      } catch (compErr) {
        console.error('Password comparison error:', compErr);
        res.status(500).json({ error: 'Authentication error.' });
      }
    });
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
  (req, res) => {
    const { email, phone, newPassword } = req.body;

    db.all('SELECT * FROM students WHERE LOWER(email) = ? AND phone = ?', [email, phone], async (err, rows) => {
      if (err) {
        console.error('Reset-password query error:', err.message);
        return res.status(500).json({ error: 'Database error checking account.' });
      }

      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'Email and phone number do not match our records.' });
      }

      try {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = 'UPDATE students SET password_hash = ? WHERE LOWER(email) = ?';

        db.run(updateQuery, [newHashedPassword, email], (updateErr) => {
          if (updateErr) {
            console.error('Error updating password:', updateErr.message);
            return res.status(500).json({ error: 'Failed to update password.' });
          }

          res.json({ message: 'Password updated successfully across all devices!' });
        });
      } catch (hashErr) {
        console.error('Bcrypt error on password reset:', hashErr);
        res.status(500).json({ error: 'Server security error.' });
      }
    });
  }
);

// -----------------------------------------------------------------------------
// SHOP & ADMIN PRODUCTS ROUTES
// -----------------------------------------------------------------------------

app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, products) => {
    if (err) {
      console.error('API Error fetching products:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve products from database' });
    }
    res.json(products || []);
  });
});

app.get('/admin', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, products) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      return res.render('admin', { products: [] });
    }
    res.render('admin', { products });
  });
});

app.post(
  '/admin/add-product',
  [
    body('title').trim().notEmpty().withMessage('Product title is required.').escape(),
    body('category').trim().notEmpty().withMessage('Category is required.').escape(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a valid positive number.'),
    body('image').trim().notEmpty().withMessage('Image URL is required.').isURL().withMessage('Must be a valid URL.')
  ],
  validateRequest,
  (req, res) => {
    const { title, category, price, image } = req.body;
    const query = `INSERT INTO products (title, category, price, image) VALUES (?, ?, ?, ?)`;

    db.run(query, [title, category, price, image], (err) => {
      if (err) console.error('Error inserting product:', err.message);
      res.redirect('/admin');
    });
  }
);

app.post(
  '/admin/update-product/:id',
  [
    param('id').isInt().withMessage('Product ID must be an integer.'),
    body('title').trim().notEmpty().withMessage('Product title is required.').escape(),
    body('category').trim().notEmpty().withMessage('Category is required.').escape(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a valid positive number.'),
    body('image').trim().notEmpty().withMessage('Image URL is required.').isURL().withMessage('Must be a valid URL.')
  ],
  validateRequest,
  (req, res) => {
    const { id } = req.params;
    const { title, category, price, image } = req.body;
    const query = `UPDATE products SET title = ?, category = ?, price = ?, image = ? WHERE id = ?`;

    db.run(query, [title, category, price, image, id], (err) => {
      if (err) console.error('Error updating product:', err.message);
      res.redirect('/admin');
    });
  }
);

app.post(
  '/admin/delete-product/:id',
  [param('id').isInt().withMessage('Product ID must be an integer.')],
  validateRequest,
  (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM products WHERE id = ?`;

    db.run(query, [id], (err) => {
      if (err) console.error('Error deleting product:', err.message);
      res.redirect('/admin');
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});