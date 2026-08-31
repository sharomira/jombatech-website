const express = require('express');
const path = require('path');
const db = require('./db.js');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // Serves shop.html, shop.css, shop.js, images directly

// Setup EJS for admin rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Endpoint for shop.js to fetch items
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin Panel Page
app.get('/admin', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).send('Database error');
    res.render('admin', { products: rows });
  });
});

// Add Product Route
app.post('/admin/add-product', (req, res) => {
  const { title, category, price, image } = req.body;
  const sql = 'INSERT INTO products (title, category, price, image) VALUES (?, ?, ?, ?)';
  
  db.run(sql, [title, category, price, image], (err) => {
    if (err) console.error(err.message);
    res.redirect('/admin');
  });
});

// Delete Product Route
app.post('/admin/delete-product/:id', (req, res) => {
  const productId = req.params.id;
  db.run('DELETE FROM products WHERE id = ?', productId, (err) => {
    if (err) console.error(err.message);
    res.redirect('/admin');
  });
});

// Update Product Route
app.post('/admin/update-product/:id', (req, res) => {
  const productId = req.params.id;
  const { title, category, price, image } = req.body;
  
  const sql = 'UPDATE products SET title = ?, category = ?, price = ?, image = ? WHERE id = ?';
  
  db.run(sql, [title, category, price, image, productId], (err) => {
    if (err) {
      console.error('Failed to update product:', err.message);
    }
    res.redirect('/admin');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});