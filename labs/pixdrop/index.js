const express = require('express');
const router = express.Router();
const http = require('http');

const labObjective = "Exploit the Server-Side Request Forgery (SSRF) vulnerability in the image importer to read the internal protected data at http://localhost:3000/labs/pixdrop/lab-internal/protected";
const labHints = [
  "Notice the /import endpoint takes a 'url' parameter.",
  "Try passing standard web URLs to see how the server fetches them.",
  "What happens if you pass an internal URL like http://localhost:3000/labs/pixdrop/lab-internal/protected?",
  "SSRF allows you to make the server fetch resources on your behalf."
];

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'PixDrop',
    vulnId: 'ssrf',
    labObjective: labObjective,
    labHints: labHints,
    resetPath: '/labs/pixdrop/reset',
    completed: req.session.pixdropCompleted
  });
});

// SSRF Target Endpoints (Internal Only)
router.get('/lab-internal/public', (req, res) => res.send('Public Mock Data'));
router.get('/lab-internal/internal', (req, res) => res.send('Internal Mock Data'));
router.get('/lab-internal/protected', (req, res) => res.send('FLAG: SSRFProtectedData'));

router.get('/import', (req, res) => {
  const url = req.query.url;
  if (!url) return res.send('Missing url parameter. <a href="/labs/pixdrop">Back</a>');
  if (!url.startsWith('http://localhost:3000/labs/pixdrop/lab-internal/')) {
    return res.status(403).send('Forbidden: External SSRF blocked for safety.');
  }
  
  // Vulnerable implementation of SSRF
  // No validation of the URL provided by the user
  try {
    http.get(url, (response) => {
      let data = ''; 
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (data.includes('FLAG: SSRFProtectedData')) {
          req.session.pixdropCompleted = true;
        }
        res.send(`<h2>Imported Content</h2><pre>${data}</pre><br><a href="/labs/pixdrop">Go back</a>`);
      });
    }).on('error', err => {
      res.send(`Error fetching URL: ${err.message}<br><a href="/labs/pixdrop">Go back</a>`);
    });
  } catch (err) {
    res.send(`Invalid URL format.<br><a href="/labs/pixdrop">Go back</a>`);
  }
});

router.post('/reset', (req, res) => {
  req.session.pixdropCompleted = false;
  res.redirect('/labs/pixdrop');
});

module.exports = router;
