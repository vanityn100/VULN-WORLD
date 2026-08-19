const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.shopzone) {
    req.session.shopzone = {
      balance: 100,
      cart: [],
      completed: false
    };
  }
  next();
});

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'ShopZone',
    shopzone: req.session.shopzone,
    labHints: [
      "Try adding items to your cart.",
      "Intercept the add to cart request in Burp.",
      "What happens if you send a negative quantity?",
      "Or try manipulating the price parameter if it's sent in the request."
    ],
    labObjective: "Get a refund and increase your balance above 1000 by exploiting a business logic flaw or API parameter manipulation."
  });
});

router.post('/cart/add', (req, res) => {
  let { id, name, price, quantity } = req.body;
  price = parseInt(price) || 0;
  quantity = parseInt(quantity) || 1;

  req.session.shopzone.cart.push({ id, name, price, quantity });
  res.redirect('/labs/shopzone');
});

router.post('/checkout', (req, res) => {
  let total = 0;
  req.session.shopzone.cart.forEach(item => {
    total += item.price * item.quantity;
  });

  req.session.shopzone.balance -= total;
  req.session.shopzone.cart = []; // empty cart

  if (req.session.shopzone.balance > 1000) {
    req.session.shopzone.completed = true;
  }

  res.redirect('/labs/shopzone');
});

router.post('/reset', (req, res) => {
  req.session.shopzone = null;
  res.redirect('/labs/shopzone');
});

module.exports = router;
