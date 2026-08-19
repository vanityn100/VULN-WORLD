const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
  if (!req.app.locals.dropmartStock) {
    req.app.locals.dropmartStock = 1;
  }
  if (!req.session.dropmart) {
    req.session.dropmart = {
      purchased: 0,
      completed: false
    };
  }
  next();
});

router.get('/', (req, res) => {
  // completion check
  if (req.app.locals.dropmartStock < 0 || req.session.dropmart.purchased > 1) {
    req.session.dropmart.completed = true;
  }
  
  res.render('home', {
    labName: 'DropMart',
    stock: req.app.locals.dropmartStock,
    dropmart: req.session.dropmart,
    labHints: [
      "There is only 1 item in stock.",
      "What if you send multiple purchase requests at the exact same time?",
      "Use Burp Intruder or Repeater with parallel requests to trigger the race condition."
    ],
    labObjective: "Exploit a race condition to purchase more than 1 item, driving the stock below 0."
  });
});

router.post('/buy', (req, res) => {
  if (req.app.locals.dropmartStock > 0) {
    // Artificial delay to increase race window
    setTimeout(() => {
      req.app.locals.dropmartStock -= 1;
      req.session.dropmart.purchased += 1;
      res.redirect('/labs/dropmart');
    }, 500);
  } else {
    res.redirect('/labs/dropmart?error=Out+of+stock');
  }
});

router.post('/reset', (req, res) => {
  req.app.locals.dropmartStock = 1;
  req.session.dropmart = null;
  res.redirect('/labs/dropmart');
});

module.exports = router;
