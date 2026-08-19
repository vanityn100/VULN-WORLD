const express = require('express');
const router = express.Router();

const labHints = [
  'Look at the URL generated when you perform a search.',
  'Observe how your search term is reflected on the page.',
  'What happens if you input HTML tags like <b>test</b>?',
  'Try injecting JavaScript using a <script> tag.'
];
const labObjective = 'You are using the FindIt search engine. Your goal is to execute malicious JavaScript in the context of the page.';
const resetPath = '/labs/findit/reset';

router.use((req, res, next) => {
  if (!req.session.findit) req.session.findit = { completed: false };
  next();
});

router.get('/', (req, res) => {
  res.render('home', { labName: 'FindIt', query: '', results: null, completed: req.session.findit.completed, labHints, labObjective, resetPath });
});

router.get('/search', (req, res) => {
  const query = req.query.q || '';
  
  let results = [];
  if (query) {
    results = [
      { title: query + ' Official Site', desc: 'The best place to find information about ' + query },
      { title: 'Wikipedia: ' + query, desc: 'Encyclopedia article about ' + query }
    ];
  }

  const lowerQ = query.toLowerCase();
  if (lowerQ.includes('<script') || lowerQ.includes('onerror=') || lowerQ.includes('onload=')) {
    req.session.findit.completed = true;
  }
  
  res.render('home', { labName: 'FindIt', query: query, results: results, completed: req.session.findit.completed, labHints, labObjective, resetPath });
});

router.post('/reset', (req, res) => {
  req.session.findit.completed = false;
  res.redirect('/labs/findit');
});

module.exports = router;
