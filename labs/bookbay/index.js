const express = require('express');
const router = express.Router();
const dbHelper = require('../../lib/db');

function initDb(db) {
  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS books");
    db.run("DROP TABLE IF EXISTS orders");
    db.run("DROP TABLE IF EXISTS order_items");
    
    db.run("CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author TEXT, description TEXT, price REAL, stock INTEGER, secret TEXT)");
    db.run("CREATE TABLE orders (id INTEGER PRIMARY KEY, name TEXT, address TEXT, total REAL)");
    db.run("CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, book_id INTEGER, quantity INTEGER, price REAL)");
    
    // Seed realistic books
    db.run("INSERT INTO books (id, title, author, description, price, stock, secret) VALUES (1, 'Python Crash Course', 'Eric Matthes', 'A fast-paced, no-nonsense guide to programming in Python.', 29.99, 50, 'Public')");
    db.run("INSERT INTO books (id, title, author, description, price, stock, secret) VALUES (2, 'Clean Code', 'Robert C. Martin', 'A Handbook of Agile Software Craftsmanship.', 39.99, 30, 'Public')");
    db.run("INSERT INTO books (id, title, author, description, price, stock, secret) VALUES (3, 'The Web Application Hacker''s Handbook', 'Dafydd Stuttard', 'Finding and Exploiting Security Flaws.', 45.00, 20, 'Public')");
    db.run("INSERT INTO books (id, title, author, description, price, stock, secret) VALUES (4, 'Linux Basics for Hackers', 'OccupyTheWeb', 'Getting Started with Networking, Scripting, and Security.', 34.99, 15, 'Public')");
    db.run("INSERT INTO books (id, title, author, description, price, stock, secret) VALUES (5, 'Practical Networking', 'How to network', 'A comprehensive networking guide.', 49.99, 10, 'Public')");
    
    // Hidden SQLi flag
    db.run("INSERT INTO books (id, title, author, description, price, stock, secret) VALUES (999, 'Admin Password Vault', 'System', 'Highly classified system credentials.', 999.99, 0, 'FLAG: SQLi_Completed')");
  });
}

const db = dbHelper.getLabDb('bookbay');
initDb(db);

const challengeData = {
  'sqli': {
    name: 'SQL Injection',
    objective: 'Explore the bookstore naturally. Your goal is to retrieve the hidden Administrative record by manipulating the search query.',
    hints: [
      'Look at the request used by the search function.',
      'Which parameter reaches the server?',
      'What does the server do with that value?',
      'Think about how user input becomes part of a database query. Try injecting SQL characters like quotes.'
    ],
    key: 'sqliCompleted'
  },
  'default': {
    name: 'BookBay Sandbox',
    objective: 'Explore the BookBay store.',
    hints: ['Explore the application.'],
    key: null
  }
};

const resetPath = '/labs/bookbay/reset';

// Calculate cart item count middleware
router.use((req, res, next) => {
  if (!req.session.bookbay) {
    req.session.bookbay = { sqliCompleted: false, activeChallenge: 'default', cart: [] };
  }
  
  if (req.query.challenge && challengeData[req.query.challenge]) {
    req.session.bookbay.activeChallenge = req.query.challenge;
  }
  
  const activeChallengeKey = req.session.bookbay.activeChallenge || 'default';
  const currentChallenge = challengeData[activeChallengeKey];
  res.locals.currentChallenge = currentChallenge;
  res.locals.labHints = currentChallenge.hints;
  res.locals.labObjective = currentChallenge.objective;
  res.locals.completed = req.session.bookbay;
  res.locals.resetPath = resetPath;
  res.locals.labName = 'BookBay';
  
  // Cart helpers
  if (!req.session.bookbay.cart) req.session.bookbay.cart = [];
  res.locals.cartItemCount = req.session.bookbay.cart.reduce((sum, item) => sum + item.quantity, 0);
  
  next();
});

// Home Page
router.get('/', (req, res) => {
  db.all("SELECT id, title, author, price FROM books WHERE secret = 'Public'", (err, books) => {
    res.render('home', { books: books || [], query: '' });
  });
});

// Book Details
router.get('/book/:id', (req, res) => {
  db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, book) => {
    if (!book) return res.status(404).send('Book not found');
    res.render('book', { book });
  });
});

// Search Page (Vulnerable)
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  
  // VULNERABILITY: SQL Injection
  const sql = "SELECT id, title, author, price, secret FROM books WHERE title LIKE '%" + query + "%'";
  
  db.all(sql, (err, books) => {
    if (err) {
      return res.render('home', { books: [], query: query, error: err.message });
    }
    
    // COMPLETION LOGIC:
    const foundFlag = books && books.some(b => b.secret && b.secret.startsWith('FLAG'));
    if (foundFlag) {
      req.session.bookbay.sqliCompleted = true;
    }
    
    res.render('home', { books: books || [], query: query });
  });
});

// Cart Actions
router.post('/cart/add', (req, res) => {
  const bookId = parseInt(req.body.bookId);
  const quantity = parseInt(req.body.quantity) || 1;
  
  db.get("SELECT * FROM books WHERE id = ?", [bookId], (err, book) => {
    if (book && quantity > 0) {
      const existingItem = req.session.bookbay.cart.find(i => i.bookId === bookId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        req.session.bookbay.cart.push({ bookId, quantity, title: book.title, price: book.price });
      }
    }
    res.redirect('/labs/bookbay/cart');
  });
});

router.post('/cart/update', (req, res) => {
  const bookId = parseInt(req.body.bookId);
  const quantity = parseInt(req.body.quantity);
  
  if (quantity > 0) {
    const item = req.session.bookbay.cart.find(i => i.bookId === bookId);
    if (item) item.quantity = quantity;
  } else if (quantity === 0) {
    req.session.bookbay.cart = req.session.bookbay.cart.filter(i => i.bookId !== bookId);
  }
  res.redirect('/labs/bookbay/cart');
});

router.post('/cart/remove', (req, res) => {
  const bookId = parseInt(req.body.bookId);
  req.session.bookbay.cart = req.session.bookbay.cart.filter(i => i.bookId !== bookId);
  res.redirect('/labs/bookbay/cart');
});

// View Cart
router.get('/cart', (req, res) => {
  const cart = req.session.bookbay.cart || [];
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('cart', { cart, subtotal });
});

// Checkout
router.get('/checkout', (req, res) => {
  const cart = req.session.bookbay.cart || [];
  if (cart.length === 0) return res.redirect('/labs/bookbay/cart');
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('checkout', { cart, total });
});

router.post('/checkout', (req, res) => {
  const cart = req.session.bookbay.cart || [];
  if (cart.length === 0) return res.redirect('/labs/bookbay');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const { name, address } = req.body;
  
  db.run("INSERT INTO orders (name, address, total) VALUES (?, ?, ?)", [name, address, total], function(err) {
    const orderId = this.lastID;
    
    // Clear cart
    req.session.bookbay.cart = [];
    res.redirect(`/labs/bookbay/order/${orderId}`);
  });
});

// Order Confirmation
router.get('/order/:id', (req, res) => {
  db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, order) => {
    if (!order) return res.status(404).send('Order not found');
    res.render('order', { order });
  });
});

router.post('/reset', (req, res) => {
  initDb(db);
  const activeChallenge = (req.session.bookbay && req.session.bookbay.activeChallenge) ? req.session.bookbay.activeChallenge : 'default';
  req.session.bookbay = { sqliCompleted: false, activeChallenge, cart: [] };
  res.redirect('/labs/bookbay');
});

module.exports = router;
