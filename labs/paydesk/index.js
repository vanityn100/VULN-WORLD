const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.paydesk) {
    req.session.paydesk = {
      balance: 1000,
      transfers: [],
      completed: false
    };
  }
  next();
});

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'PayDesk',
    paydesk: req.session.paydesk,
    labHints: [
      "There is no anti-CSRF token in the transfer form.",
      "Create an HTML page that automatically submits a form to the transfer endpoint.",
      "Open your malicious page in the same browser to trigger the transfer.",
      "Transfer funds to 'attacker' to complete the lab."
    ],
    labObjective: "Exploit the lack of CSRF protection to transfer funds to 'attacker'."
  });
});

router.post('/transfer', (req, res) => {
  let { to, amount } = req.body;
  amount = parseInt(amount) || 0;
  
  if (amount > 0 && amount <= req.session.paydesk.balance) {
    req.session.paydesk.balance -= amount;
    req.session.paydesk.transfers.push({ to, amount });
    
    if (to === 'attacker') {
      req.session.paydesk.completed = true;
    }
  }
  
  res.redirect('/labs/paydesk');
});

router.post('/reset', (req, res) => {
  req.session.paydesk = null;
  res.redirect('/labs/paydesk');
});

module.exports = router;
