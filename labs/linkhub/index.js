const express = require('express');
const router = express.Router();

const labObjective = "Exploit the Open Redirect vulnerability to redirect a user to 'http://evil.com'.";
const labHints = [
  "Look at the URL parameter 'target' when clicking a tracking link.",
  "The application uses this parameter to track clicks and then redirects the user.",
  "Change the 'target' parameter to point to an external site like http://evil.com to test if the redirect is open."
];

let labState = { completed: false };

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'LinkHub',
    labObjective,
    labHints,
    resetPath: '/labs/linkhub/reset',
    completed: labState.completed
  });
});

router.get('/track', (req, res) => {
  const targetUrl = req.query.target;
  
  // Vulnerable to Open Redirect
  // The service tracks the click in the background, then redirects.
  if (targetUrl) {
    // Checking completion: if redirected to evil.com
    if (targetUrl.toLowerCase() === 'http://evil.com' || targetUrl.toLowerCase() === 'http://evil.com/') {
      labState.completed = true;
    }
    return res.redirect(targetUrl);
  }
  
  res.redirect('/labs/linkhub');
});

router.post('/reset', (req, res) => {
  labState.completed = false;
  res.redirect('/labs/linkhub');
});

module.exports = router;
