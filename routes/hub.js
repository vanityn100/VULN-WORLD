const express = require('express');
const router = express.Router();
const registry = require('../lib/labRegistry');
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  res.render('hub/index');
});

router.get('/vulnerabilities', (req, res) => {
  res.render('hub/catalog');
});

router.get('/learn/:vulnId', (req, res) => {
  const vuln = registry.vulnerabilities.find(v => v.id === req.params.vulnId);
  if (!vuln) return res.status(404).send('Vulnerability not found');
  
  const customPath = path.join(process.cwd(), 'views', 'learn', 'explanations', `${vuln.id}.ejs`);
  if (require('fs').existsSync(customPath)) {
    res.render(`learn/explanations/${vuln.id}`, { vuln });
  } else {
    res.render('learn/explanation', { vuln }); // Fallback
  }
});

module.exports = router;
