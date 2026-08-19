const express = require('express');
const router = express.Router();

const labObjective = "Find the Information Disclosure vulnerability and extract the secret API key.";
const labHints = [
  "Look at the network requests when you interact with the project list.",
  "What happens if you request a project that doesn't exist? Try modifying the project ID.",
  "Check the full response body of the error; the application might be leaking debug context."
];

let labState = { completed: false };

const projects = {
  'P-101': { name: 'Website Redesign', description: 'Overhauling the main corporate site with new branding.' },
  'P-102': { name: 'Mobile App Alpha', description: 'Internal testing phase for the new iOS application.' }
};

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'ProjectHub',
    labObjective,
    labHints,
    resetPath: '/labs/projecthub/reset',
    completed: labState.completed
  });
});

// Vulnerable API endpoint
router.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const project = projects[projectId];

  if (project) {
    return res.json(project);
  } else {
    // Information Disclosure: returning full environment/debug state on error
    return res.status(404).json({
      error: `Project ${projectId} not found.`,
      debugContext: {
        env: 'production',
        db_connection: 'connected',
        serverTime: new Date().toISOString(),
        processEnv: {
          NODE_ENV: 'production',
          DB_PASSWORD: 'super_secret_db_password',
          INTERNAL_API_KEY: 'AKIA-PROJECTHUB-SECRET-99'
        }
      }
    });
  }
});

router.post('/submit_key', express.urlencoded({ extended: true }), (req, res) => {
  const key = req.body.key;
  if (key === 'AKIA-PROJECTHUB-SECRET-99') {
    labState.completed = true;
  }
  res.redirect('/labs/projecthub');
});

router.post('/reset', (req, res) => {
  labState.completed = false;
  res.redirect('/labs/projecthub');
});

module.exports = router;
