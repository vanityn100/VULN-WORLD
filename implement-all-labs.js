const fs = require('fs');
const path = require('path');

function writeLab(id, routerCode) {
  const labPath = path.join(__dirname, 'labs', id, 'index.js');
  if (fs.existsSync(labPath)) {
    fs.writeFileSync(labPath, routerCode);
  }
}

// 1. SocialSphere - IDOR, BOLA, Broken Access Control, Stored XSS
writeLab('socialsphere', `const express = require('express');
const router = express.Router();
const dbHelper = require('../../lib/db');
const db = dbHelper.getLabDb('socialsphere');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, role TEXT, secret TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, author_id INTEGER, content TEXT)");
  db.run("INSERT OR IGNORE INTO users (id, username, role, secret) VALUES (1, 'admin', 'admin', 'FLAG: SuperSecretAdmin')");
  db.run("INSERT OR IGNORE INTO users (id, username, role, secret) VALUES (2, 'alice', 'user', 'Alice data')");
});
router.use((req, res, next) => { req.session.userId = 2; req.session.role = 'user'; next(); });
router.get('/', (req, res) => res.send('<html><body>SocialSphere <a href="/labs/socialsphere/profile/2">My Profile</a> <a href="/labs/socialsphere/admin">Admin</a></body></html>'));
router.get('/profile/:id', (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, user) => {
    res.send(user ? 'Profile: ' + user.secret : 'Not found');
  });
});
router.get('/admin', (req, res) => {
  db.all("SELECT * FROM users", (err, users) => res.json(users));
});
router.post('/posts', (req, res) => {
  db.run("INSERT INTO posts (author_id, content) VALUES (?, ?)", [req.session.userId, req.body.content]);
  res.redirect('/labs/socialsphere');
});
module.exports = router;
`);

// 2. BookBay - SQL Injection
writeLab('bookbay', `const express = require('express');
const router = express.Router();
const dbHelper = require('../../lib/db');
const db = dbHelper.getLabDb('bookbay');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT, secret TEXT)");
  db.run("INSERT OR IGNORE INTO books (id, title, secret) VALUES (1, 'Harry Potter', 'Public')");
  db.run("INSERT OR IGNORE INTO books (id, title, secret) VALUES (2, 'Admin Password', 'FLAG: supersecret')");
});
router.get('/', (req, res) => res.send('BookBay <form action="/labs/bookbay/search"><input name="q"></form>'));
router.get('/search', (req, res) => {
  db.all("SELECT title, secret FROM books WHERE title LIKE '%" + (req.query.q || '') + "%'", (err, rows) => res.json(rows || err));
});
module.exports = router;
`);

// 3. PixDrop - SSRF (SAFE IMPLEMENTATION)
writeLab('pixdrop', `const express = require('express');
const router = express.Router();
const http = require('http');
router.get('/', (req, res) => res.send('PixDrop <form action="/labs/pixdrop/import"><input name="url"></form>'));
router.get('/import', (req, res) => {
  const url = req.query.url;
  if (!url) return res.send('Missing url');
  if (!url.startsWith('http://localhost:3000')) return res.status(403).send('Forbidden: Only lab-internal URLs allowed');
  http.get(url, (response) => {
    let data = ''; response.on('data', chunk => data += chunk);
    response.on('end', () => res.send('Imported data: ' + data));
  }).on('error', err => res.send('Error'));
});
module.exports = router;
`);

// 4. PayDesk - CSRF
writeLab('paydesk', `const express = require('express');
const router = express.Router();
router.use((req, res, next) => { req.session.balance = req.session.balance || 1000; next(); });
router.get('/', (req, res) => res.send('Balance: ' + req.session.balance + ' <form method="POST" action="/labs/paydesk/transfer"><input name="amount" value="100"><input name="to" value="attacker"><button>Transfer</button></form>'));
router.post('/transfer', (req, res) => {
  req.session.balance -= parseInt(req.body.amount || 0);
  res.send('Transfer complete. New balance: ' + req.session.balance);
});
module.exports = router;
`);

// 5. FindIt - Reflected XSS
writeLab('findit', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('FindIt <form action="/labs/findit/search"><input name="q"></form>'));
router.get('/search', (req, res) => {
  res.send('<html><body>Search results for: ' + req.query.q + '</body></html>');
});
module.exports = router;
`);

// 6. FileVault - Path Traversal (SAFE)
writeLab('filevault', `const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const labDir = path.join(__dirname, '..', '..', 'data', 'labs', 'filevault_files');
if (!fs.existsSync(labDir)) { fs.mkdirSync(labDir, { recursive: true }); fs.writeFileSync(path.join(labDir, 'secret.txt'), 'FLAG: FileVaultSecret'); }
router.get('/', (req, res) => res.send('FileVault <a href="/labs/filevault/download?file=public.txt">Download Public</a>'));
router.get('/download', (req, res) => {
  const filePath = path.join(labDir, req.query.file || '');
  if (!filePath.startsWith(path.join(__dirname, '..', '..'))) return res.send('Access Denied'); // Prevent actual host escape
  try { res.send(fs.readFileSync(filePath, 'utf8')); } catch(e) { res.send('File not found'); }
});
module.exports = router;
`);

// 7. ProfileHub - File Upload (SAFE)
writeLab('profilehub', `const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
router.get('/', (req, res) => res.send('ProfileHub <form method="POST" action="/labs/profilehub/upload"><input type="file" name="file"><input type="submit"></form>'));
router.post('/upload', (req, res) => {
  // Simulate unsafe upload by accepting any filename
  res.send('File uploaded (Vulnerable). Access at /uploads/yourfile.php');
});
module.exports = router;
`);

// 8. MailBox - Authentication / Session
writeLab('mailbox', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('MailBox <form method="POST" action="/labs/mailbox/login"><input name="user"><input name="pass"><button>Login</button></form>'));
router.post('/login', (req, res) => {
  if (req.body.user === 'admin' && req.body.pass === 'password') {
    req.session.admin = true; res.send('Logged in as admin! FLAG: AdminMailbox');
  } else { res.send('Invalid'); }
});
module.exports = router;
`);

// 9. AccountHub - JWT
writeLab('accounthub', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('AccountHub - Auth with JWT. <a href="/labs/accounthub/api">API</a>'));
router.get('/api', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.includes('role=admin')) res.send('FLAG: JWT Admin Data');
  else res.send('Normal User Data');
});
module.exports = router;
`);

// 10. DataHub - CORS
writeLab('datahub', `const express = require('express');
const router = express.Router();
router.get('/api/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.json({ secret: 'CORS leaked data FLAG: CORSData' });
});
module.exports = router;
`);

// 11. DropMart - Race Condition
writeLab('dropmart', `const express = require('express');
const router = express.Router();
let stock = 1;
router.get('/', (req, res) => res.send('DropMart Stock: ' + stock + ' <a href="/labs/dropmart/buy">Buy</a>'));
router.get('/buy', (req, res) => {
  if (stock > 0) {
    setTimeout(() => { stock -= 1; res.send('Bought! Stock is now: ' + stock); }, 500); // Artificial delay to allow race
  } else {
    res.send('Out of stock');
  }
});
module.exports = router;
`);

// 12. TemplateWorks - SSTI
writeLab('templateworks', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('TemplateWorks <form action="/labs/templateworks/render"><input name="tpl" value="Hello {name}"></form>'));
router.get('/render', (req, res) => {
  try {
    // Highly insecure mock template engine
    const tpl = req.query.tpl;
    const rendered = eval('\`' + tpl + '\`');
    res.send(rendered);
  } catch(e) { res.send('Error'); }
});
module.exports = router;
`);

// 13. LinkHub - Open Redirect
writeLab('linkhub', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('LinkHub <a href="/labs/linkhub/redirect?url=http://example.com">Go</a>'));
router.get('/redirect', (req, res) => {
  res.redirect(req.query.url); // Vulnerable to arbitrary redirect
});
module.exports = router;
`);

// 14. ProjectHub - Info Disclosure & Security Misconfig
writeLab('projecthub', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('ProjectHub <a href="/labs/projecthub/debug">Debug Info</a>'));
router.get('/debug', (req, res) => res.json({ env: 'development', db_password: 'mock_password_123', FLAG: 'InfoDisclosure' }));
module.exports = router;
`);

// 15. ShopZone - API Parameter Manipulation, Business Logic
writeLab('shopzone', `const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('ShopZone <form action="/labs/shopzone/checkout"><input name="price" value="1000"></form>'));
router.get('/checkout', (req, res) => {
  const price = parseInt(req.query.price);
  if (price < 0) res.send('Business Logic Error: Refunded ' + Math.abs(price));
  else res.send('Charged ' + price);
});
module.exports = router;
`);

console.log("All functional labs generated.");
