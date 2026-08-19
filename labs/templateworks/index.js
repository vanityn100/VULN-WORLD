const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const challengeData = {
  'ssti': {
    name: 'Server-Side Template Injection',
    objective: 'The application uses templates to render email notifications. Your goal is to exploit this process to read the hidden internal configuration secret.',
    hints: [
      'Map the application\'s requests. Notice how you create a campaign and then preview it.',
      'The preview function renders your campaign body. What happens if you include template syntax?',
      'The application tells you that `user.name` is an available variable. Try rendering it.',
      'If the engine is executing your template, you can access other objects in the context. Try guessing context variables like `config.internalSecret`.'
    ],
    key: 'sstiCompleted'
  },
  'default': {
    name: 'TemplateWorks Sandbox',
    objective: 'Explore the email campaign platform.',
    hints: ['Explore the application.'],
    key: null
  }
};

const resetPath = '/labs/templateworks/reset';

// In-memory DB
let campaigns = {
  '1': { id: '1', title: 'Welcome Email', subject: 'Welcome!', body: 'Hello <%= user.name %>! Welcome to our platform.' }
};
let nextId = 2;

router.use((req, res, next) => {
  if (!req.session.templateworks) {
    req.session.templateworks = { sstiCompleted: false, activeChallenge: 'default' };
  }
  
  if (req.query.challenge && challengeData[req.query.challenge]) {
    req.session.templateworks.activeChallenge = req.query.challenge;
  }
  
  const activeChallengeKey = req.session.templateworks.activeChallenge || 'default';
  const currentChallenge = challengeData[activeChallengeKey];
  res.locals.currentChallenge = currentChallenge;
  res.locals.labHints = currentChallenge.hints;
  res.locals.labObjective = currentChallenge.objective;
  res.locals.completed = req.session.templateworks;
  res.locals.resetPath = resetPath;
  res.locals.labName = 'TemplateWorks';
  next();
});

// Dashboard
router.get('/', (req, res) => {
  res.render('home', { campaigns: Object.values(campaigns) });
});

// View/Edit Campaign
router.get('/campaign/:id', (req, res) => {
  const campaign = campaigns[req.params.id];
  if (!campaign) return res.status(404).send('Campaign not found');
  res.render('campaign', { campaign });
});

// Create Campaign
router.post('/api/campaigns', (req, res) => {
  const { title, subject, body } = req.body;
  const id = (nextId++).toString();
  campaigns[id] = { id, title: title || 'New Campaign', subject: subject || '', body: body || '' };
  res.redirect(`/labs/templateworks/campaign/${id}`);
});

// Update Campaign
router.post('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns[req.params.id];
  if (campaign) {
    campaign.title = req.body.title;
    campaign.subject = req.body.subject;
    campaign.body = req.body.body;
  }
  res.redirect(`/labs/templateworks/campaign/${req.params.id}`);
});

// Rendering API (Vulnerable to SSTI)
router.post('/api/render', (req, res) => {
  const { campaignId } = req.body;
  const campaign = campaigns[campaignId];
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  
  let renderedPreview = '';
  try {
    // SSTI Vulnerability: The user-controlled body is executed by EJS
    renderedPreview = ejs.render(campaign.body, { 
        user: { name: 'Demo User', email: 'demo@example.com' },
        config: { internalSecret: 'FLAG: SSTI_Pwned_2026', version: '2.4.1' }
    });
    
    // Check if the output contains the flag
    if (renderedPreview.includes('FLAG: SSTI_Pwned_2026')) {
      req.session.templateworks.sstiCompleted = true;
    }
  } catch (err) {
    renderedPreview = `<div style="color:red">Render Error: ${err.message}</div>`;
  }
  
  res.json({ preview: renderedPreview });
});

router.post('/reset', (req, res) => {
  campaigns = {
    '1': { id: '1', title: 'Welcome Email', subject: 'Welcome!', body: 'Hello <%= user.name %>! Welcome to our platform.' }
  };
  nextId = 2;
  const activeChallenge = (req.session.templateworks && req.session.templateworks.activeChallenge) ? req.session.templateworks.activeChallenge : 'default';
  req.session.templateworks = { sstiCompleted: false, activeChallenge };
  res.redirect('/labs/templateworks');
});

module.exports = router;
