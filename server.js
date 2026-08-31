const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS view engine if using template files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Root Route (Fixes "Cannot GET /")
app.get('/', (req, res) => {
  // Option A: If using index.html or dashboard.html in 'public'
  // res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));

  // Option B: If rendering an EJS template
  // res.render('index');

  // Fallback: Serves static index.html or sends basic welcome message
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'), (err) => {
    if (err) {
      res.send('Welcome to Jombatech Website! Server is live.');
    }
  });
});

// Example API route for fetching products from Neon PostgreSQL
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});