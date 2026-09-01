const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure EJS view engine for templates in the 'views' folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets directly from the root directory
app.use(express.static(__dirname));

// 1. Root Route: Serves dashboard.html from the root folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'), (err) => {
    if (err) {
      console.error('Error serving dashboard.html:', err);
      res.status(500).send('Could not load dashboard.html');
    }
  });
});

// 2. Admin Route: Renders views/admin.ejs with products from Neon PostgreSQL
app.get('/admin', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      console.error('Error fetching products from database:', err.message);
      return res.render('admin', { products: [] });
    }
    res.render('admin', { products });
  });
});

// 3. API Route: Fetch products as JSON
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
  console.log(`Server running on port ${PORT}`);
});