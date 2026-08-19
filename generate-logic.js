const fs = require('fs');
const path = require('path');

const labs = [
  { id: 'shopzone', title: 'ShopZone', type: 'ecommerce' },
  { id: 'findit', title: 'FindIt', type: 'search' },
  { id: 'bookbay', title: 'BookBay', type: 'ecommerce' },
  { id: 'pixdrop', title: 'PixDrop', type: 'gallery' },
  { id: 'profilehub', title: 'ProfileHub', type: 'profile' },
  { id: 'filevault', title: 'FileVault', type: 'files' },
  { id: 'mailbox', title: 'MailBox', type: 'email' },
  { id: 'accounthub', title: 'AccountHub', type: 'account' },
  { id: 'paydesk', title: 'PayDesk', type: 'finance' },
  { id: 'datahub', title: 'DataHub', type: 'api' },
  { id: 'templateworks', title: 'TemplateWorks', type: 'template' },
  { id: 'dropmart', title: 'DropMart', type: 'ecommerce' },
  { id: 'linkhub', title: 'LinkHub', type: 'links' },
  { id: 'projecthub', title: 'ProjectHub', type: 'project' }
];

labs.forEach(lab => {
  const labDir = path.join(__dirname, 'labs', lab.id);
  const viewsDir = path.join(labDir, 'views');
  
  let routerContent = `const express = require('express');\nconst router = express.Router();\n\n`;
  routerContent += `router.get('/', (req, res) => {\n  res.render('home', { labName: '${lab.title}' });\n});\n\n`;
  
  if (lab.type === 'ecommerce') {
    routerContent += `router.get('/products', (req, res) => { res.send('Products page (Vulnerable logic here)'); });\n`;
    routerContent += `router.get('/cart', (req, res) => { res.send('Cart page (Vulnerable logic here)'); });\n`;
  } else if (lab.type === 'search') {
    routerContent += `router.get('/search', (req, res) => { \n  const q = req.query.q || '';\n  res.send('<html><body>Search results for: ' + q + ' (XSS Vulnerable)</body></html>'); \n});\n`;
  } else if (lab.type === 'files' || lab.type === 'gallery') {
    routerContent += `router.get('/upload', (req, res) => { res.send('Upload page (Vulnerable logic here)'); });\n`;
  } else if (lab.type === 'finance') {
    routerContent += `router.post('/transfer', (req, res) => { res.send('Transfer complete (CSRF Vulnerable)'); });\n`;
  } else if (lab.type === 'api') {
    routerContent += `router.get('/api/data', (req, res) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.json({ secret: 'CORS leaked data' }); });\n`;
  }
  
  routerContent += `module.exports = router;\n`;
  
  fs.writeFileSync(path.join(labDir, 'index.js'), routerContent);
});

console.log('Advanced logic generated for remaining labs.');
