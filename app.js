const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const registry = require('./lib/labRegistry');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'vuln-world-secret-123',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/shared', express.static(path.join(process.cwd(), 'public', 'shared')));

// Helper middleware to make registry available in hub views
app.use((req, res, next) => {
  res.locals.registry = registry;
  next();
});

// Load Hub Routes
app.use('/', require('./routes/hub'));

// Mount Lab Sub-apps dynamically
registry.labs.forEach(lab => {
  const labApp = express();
  
  // Each lab has its own views and public dir
  labApp.set('view engine', 'ejs');
  labApp.set('views', [
    path.join(process.cwd(), 'labs', lab.id, 'views'),
    path.join(process.cwd(), 'views') // Fallback to main views for partials
  ]);
  
  // Explicitly mount this lab's public directory at its root
  // so /labs/:labId/style.css maps to labs/:labId/public/style.css
  labApp.use(express.static(path.join(process.cwd(), 'labs', lab.id, 'public')));
  
  // Load the lab's router
  const labRouter = require(path.join(process.cwd(), 'labs', lab.id, 'index.js'));
  labApp.use('/', labRouter);

  // Mount on main app
  app.use('/labs/' + lab.id, labApp);
});

module.exports = app;
