const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname));

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'), (err) => {
    if (err) res.status(500).send('Could not load dashboard.html');
  });
});

// API Route for Frontend Shop (Fixes 404 Not Found error)
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, products) => {
    if (err) {
      console.error('API Error fetching products:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve products from database' });
    }
    res.json(products || []);
  });
});

// Admin dashboard view
app.get('/admin', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, products) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      return res.render('admin', { products: [] });
    }
    res.render('admin', { products });
  });
});

// Add Product
app.post('/admin/add-product', (req, res) => {
  const { title, category, price, image } = req.body;
  const query = `INSERT INTO products (title, category, price, image) VALUES (?, ?, ?, ?)`;
  
  db.run(query, [title, category, price, image], (err) => {
    if (err) console.error('Error inserting product:', err.message);
    res.redirect('/admin');
  });
});

// Update Product
app.post('/admin/update-product/:id', (req, res) => {
  const { id } = req.params;
  const { title, category, price, image } = req.body;
  const query = `UPDATE products SET title = ?, category = ?, price = ?, image = ? WHERE id = ?`;
  
  db.run(query, [title, category, price, image, id], (err) => {
    if (err) console.error('Error updating product:', err.message);
    res.redirect('/admin');
  });
});

// Delete Product
app.post('/admin/delete-product/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM products WHERE id = ?`;
  
  db.run(query, [id], (err) => {
    if (err) console.error('Error deleting product:', err.message);
    res.redirect('/admin');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});