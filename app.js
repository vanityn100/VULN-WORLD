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

// Static map of lab routers for bundler compatibility (esbuild on Netlify)
const labRouters = {
  'socialsphere': require('./labs/socialsphere/index.js'),
  'shopzone': require('./labs/shopzone/index.js'),
  'findit': require('./labs/findit/index.js'),
  'bookbay': require('./labs/bookbay/index.js'),
  'pixdrop': require('./labs/pixdrop/index.js'),
  'profilehub': require('./labs/profilehub/index.js'),
  'filevault': require('./labs/filevault/index.js'),
  'mailbox': require('./labs/mailbox/index.js'),
  'accounthub': require('./labs/accounthub/index.js'),
  'paydesk': require('./labs/paydesk/index.js'),
  'datahub': require('./labs/datahub/index.js'),
  'templateworks': require('./labs/templateworks/index.js'),
  'dropmart': require('./labs/dropmart/index.js'),
  'linkhub': require('./labs/linkhub/index.js'),
  'projecthub': require('./labs/projecthub/index.js')
};

// Mount Lab Sub-apps dynamically based on registry, but use statically required routers
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
  
  // Load the lab's router from the static map
  const labRouter = labRouters[lab.id];
  labApp.use('/', labRouter);

  // Mount on main app
  app.use('/labs/' + lab.id, labApp);
});

module.exports = app;
