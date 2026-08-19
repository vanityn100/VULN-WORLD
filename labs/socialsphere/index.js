const express = require('express');
const router = express.Router();
const dbHelper = require('../../lib/db');
const db = dbHelper.getLabDb('socialsphere');

function initDb() {
  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS posts");
    db.run("DROP TABLE IF EXISTS messages");
    
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, username TEXT, bio TEXT, private_email TEXT, private_phone TEXT, avatar TEXT, role TEXT)");
    db.run("CREATE TABLE posts (id INTEGER PRIMARY KEY, author_id INTEGER, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
    db.run("CREATE TABLE messages (id INTEGER PRIMARY KEY, to_user_id INTEGER, content TEXT, secret TEXT)");
    
    db.run("INSERT INTO users (id, name, username, bio, private_email, private_phone, avatar, role) VALUES (1, 'Alice Johnson', 'alice_j', 'Love hiking and photography!', 'alice@example.com', '555-0101', '👩', 'user')");
    db.run("INSERT INTO users (id, name, username, bio, private_email, private_phone, avatar, role) VALUES (2, 'Bob Miller', 'bob_m', 'Tech enthusiast & coder.', 'bob.miller@example.com', '555-0202', '👨', 'user')");
    db.run("INSERT INTO users (id, name, username, bio, private_email, private_phone, avatar, role) VALUES (3, 'Charlie Davis', 'charlie_d', 'Music producer.', 'charlie@example.com', '555-0303', '🎸', 'user')");
    db.run("INSERT INTO users (id, name, username, bio, private_email, private_phone, avatar, role) VALUES (99, 'Admin', 'admin', 'System Administrator', 'admin@example.com', '555-9999', '🛡️', 'admin')");

    db.run("INSERT INTO posts (id, author_id, content) VALUES (1, 1, 'Had an amazing weekend hiking!')");
    db.run("INSERT INTO posts (id, author_id, content) VALUES (2, 2, 'Anyone interested in joining the photography club?')");
    db.run("INSERT INTO posts (id, author_id, content) VALUES (3, 3, 'Working on a new project today.')");
    
    db.run("INSERT INTO messages (id, to_user_id, content, secret) VALUES (1, 1, 'Hello Alice', 'Normal')");
    db.run("INSERT INTO messages (id, to_user_id, content, secret) VALUES (2, 2, 'Top secret Bob data', 'FLAG: BOLA_Completed')");
  });
}
initDb();

const challengeData = {
  'idor': {
    name: 'IDOR / BOLA',
    objective: 'Your goal is to determine whether the server properly verifies which user is allowed to create a post.',
    hints: [
      'Create a normal post and inspect the request.',
      'Look carefully at the parameters sent with the POST request body.',
      'Notice the userId parameter. Who does this ID belong to?',
      'Send the post creation request to Burp Repeater to manipulate the userId parameter while keeping your session unchanged.'
    ],
    key: 'idorCompleted'
  },
  'xss-stored': {
    name: 'Stored XSS',
    objective: 'Your goal is to inject a persistent malicious script into the social feed.',
    hints: [
      'Look at the request generated when you submit a new post.',
      'Can you submit HTML tags in the content parameter?',
      'Try submitting a basic script tag like <script>alert(1)</script>.',
      'Verify if the script executes when the feed loads.'
    ],
    key: 'xssCompleted'
  },
  'broken-access-control': {
    name: 'Broken Access Control',
    objective: 'Your goal is to bypass access controls to reach the administrative panel.',
    hints: [
      'Notice that you do not see an Admin Settings link in the navigation as Alice.',
      'What would the URL be for an administrative dashboard? Try guessing standard paths like /admin.',
      'Does the server verify your role when you access the admin endpoint directly?'
    ],
    key: 'bacCompleted'
  },
  'bola': {
    name: 'Broken Object Level Authorization',
    objective: 'Your goal is to access a private message belonging to Bob (BOLA).',
    hints: [
      'Use the network inspector or Burp to observe API calls.',
      'Can you find an endpoint that fetches a message by ID?',
      'What happens if you change the message ID to one that doesn\'t belong to you?'
    ],
    key: 'bolaCompleted'
  },
  'default': {
    name: 'SocialSphere Sandbox',
    objective: 'Explore the application and discover vulnerabilities.',
    hints: ['Explore the application.'],
    key: null
  }
};

const resetPath = '/labs/socialsphere/reset';

router.use((req, res, next) => { 
  if (!req.session.socialsphere) {
    req.session.socialsphere = { idorCompleted: false, bolaCompleted: false, xssCompleted: false, bacCompleted: false, activeChallenge: 'default' };
  }
  
  if (req.query.challenge && challengeData[req.query.challenge]) {
    req.session.socialsphere.activeChallenge = req.query.challenge;
  }
  
  if (req.query.login_as === 'admin') {
    req.session.userId = 99;
    req.session.role = 'admin';
  } else if (req.query.login_as === 'alice') {
    req.session.userId = 1;
    req.session.role = 'user';
  } else if (!req.session.userId) {
    req.session.userId = 1; // Default to Alice
    req.session.role = 'user'; 
  }
  
  // Set locals for all views
  const activeChallengeKey = req.session.socialsphere.activeChallenge || 'default';
  const currentChallenge = challengeData[activeChallengeKey];
  res.locals.currentChallenge = currentChallenge;
  res.locals.labHints = currentChallenge.hints;
  res.locals.labObjective = currentChallenge.objective;
  
  next(); 
});

// UI Routes
router.get('/', (req, res) => { 
  db.all("SELECT posts.content, users.name, users.avatar, users.id as user_id FROM posts JOIN users ON posts.author_id = users.id ORDER BY posts.id DESC", (err, posts) => { 
    db.all("SELECT id, name, avatar FROM users WHERE id != ? AND role != 'admin'", [req.session.userId], (err, friends) => {
      if (posts && posts.some(p => p.content.toLowerCase().includes('<script'))) {
        req.session.socialsphere.xssCompleted = true;
      }
      res.render('home', { labName: 'SocialSphere', posts: posts || [], friends: friends || [], currentUser: req.session.userId, currentRole: req.session.role, completed: req.session.socialsphere, resetPath }); 
    });
  }); 
});

router.get('/profile', (req, res) => {
  const profileId = req.query.id || req.session.userId;
  res.render('profile', { labName: 'SocialSphere', profileId: profileId, currentUser: req.session.userId, currentRole: req.session.role, completed: req.session.socialsphere, resetPath });
});

router.get('/profile/edit', (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (!user) return res.redirect('/labs/socialsphere');
    res.render('edit_profile', {
      labName: 'SocialSphere',
      currentUser: req.session.userId,
      currentRole: req.session.role,
      completed: req.session.socialsphere,
      resetPath,
      user,
      successMsg: req.query.success ? 'Profile updated successfully.' : undefined
    });
  });
});

router.post('/profile/edit', (req, res) => {
  const { name, username, bio, email, phone } = req.body;
  
  // SECURE: Only update the authenticated user's profile
  db.run(
    "UPDATE users SET name = ?, username = ?, bio = ?, private_email = ?, private_phone = ? WHERE id = ?",
    [name, username, bio, email, phone, req.session.userId],
    (err) => {
      res.redirect('/labs/socialsphere/profile/edit?success=1');
    }
  );
});

// WORKFLOW 1 & 2: Stored XSS and IDOR (Post Creation)
router.post('/posts', (req, res) => {
  console.log('--- POST /posts ---');
  console.log('req.body:', req.body);
  console.log('req.session.userId:', req.session.userId);
  
  const suppliedUserId = parseInt(req.body.userId);
  const content = req.body.content;

  console.log('suppliedUserId:', suppliedUserId);

  if (suppliedUserId && suppliedUserId !== req.session.userId) {
    req.session.socialsphere.idorCompleted = true;
    console.log('IDOR Triggered!');
  }

  db.run("INSERT INTO posts (author_id, content) VALUES (?, ?)", [suppliedUserId || req.session.userId, content], () => {
    res.redirect('/labs/socialsphere');
  });
});

// Secondary API endpoints (kept for additional learning scenarios as requested)
router.get('/api/profile/:id', (req, res) => {
  const requestedId = parseInt(req.params.id);
  db.get("SELECT * FROM users WHERE id = ?", [requestedId], (err, user) => {
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      public: { id: user.id, name: user.name, username: user.username, avatar: user.avatar, bio: user.bio },
      private: { email: user.private_email, phone: user.private_phone }
    });
  });
});

router.get('/api/messages/:id', (req, res) => {
  db.get("SELECT * FROM messages WHERE id = ?", [req.params.id], (err, msg) => {
    if (!msg) return res.status(404).json({error: 'Not found'});
    if (msg.to_user_id !== req.session.userId) {
      req.session.socialsphere.bolaCompleted = true;
    }
    res.json(msg);
  });
});

router.get('/admin', (req, res) => {
  // INTENTIONALLY VULNERABLE: No role check is performed here!
  req.session.socialsphere.bacCompleted = true;
  db.all("SELECT id, name, username, role, private_email FROM users", (err, users) => {
    res.render('admin', {
      labName: 'SocialSphere',
      currentUser: req.session.userId,
      currentRole: req.session.role,
      completed: req.session.socialsphere,
      resetPath,
      users: users || []
    });
  });
});

router.post('/reset', (req, res) => {
  initDb();
  const activeChallenge = (req.session.socialsphere && req.session.socialsphere.activeChallenge) ? req.session.socialsphere.activeChallenge : 'default';
  req.session.socialsphere = { idorCompleted: false, bolaCompleted: false, xssCompleted: false, bacCompleted: false, activeChallenge };
  res.redirect('/labs/socialsphere');
});

module.exports = router;
