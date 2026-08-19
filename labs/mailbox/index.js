const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Initial State
let users = {
    'admin': { password: 'password123', email: 'admin@mailbox.local', resetToken: null },
    'user': { password: 'user123', email: 'user@mailbox.local', resetToken: null }
};
let isCompleted = false;

// Middleware to parse cookies and body if not already done globally
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const labObjective = "Exploit weak authentication to login as admin, bypass session management by forging a cookie, or abuse the password reset feature to gain admin access.";
const labHints = [
    "Have you tried guessing the admin password? It might be very weak.",
    "Look at the cookie set after you log in as a normal user (user:user123). Can you decode and tamper with it?",
    "If you request a password reset, how is the token generated? Try requesting one for 'user', and see if it looks predictable."
];

router.get('/', (req, res) => {
    let loggedInUser = null;
    if (req.cookies && req.cookies.mailbox_session) {
        try {
            const decoded = Buffer.from(req.cookies.mailbox_session, 'base64').toString('utf-8');
            const sessionData = JSON.parse(decoded);
            if (sessionData && sessionData.user === 'admin') {
                isCompleted = true;
                loggedInUser = 'admin';
            } else if (sessionData && sessionData.user) {
                loggedInUser = sessionData.user;
            }
        } catch (e) {
            // ignore
        }
    }

    res.render('home', {
        labName: 'MailBox',
        labObjective,
        labHints,
        resetPath: '/labs/mailbox/reset',
        isCompleted,
        loggedInUser
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        if (username === 'admin') isCompleted = true;
        const sessionVal = Buffer.from(JSON.stringify({ user: username })).toString('base64');
        res.cookie('mailbox_session', sessionVal);
        res.redirect('/labs/mailbox');
    } else {
        res.redirect('/labs/mailbox?error=Invalid+credentials');
    }
});

router.post('/forgot', (req, res) => {
    const { username } = req.body;
    if (users[username]) {
        // Predictable reset token (MD5 of username)
        const token = crypto.createHash('md5').update(username).digest('hex');
        users[username].resetToken = token;
        res.redirect('/labs/mailbox?msg=Reset+link+sent+to+' + encodeURIComponent(users[username].email));
    } else {
        res.redirect('/labs/mailbox?error=User+not+found');
    }
});

router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    for (let u in users) {
        if (users[u].resetToken && users[u].resetToken === token) {
            users[u].password = newPassword;
            users[u].resetToken = null;
            if (u === 'admin') isCompleted = true;
            return res.redirect('/labs/mailbox?msg=Password+reset+successfully');
        }
    }
    res.redirect('/labs/mailbox?error=Invalid+token');
});

// Reset lab state
router.post('/reset', (req, res) => {
    users = {
        'admin': { password: 'password123', email: 'admin@mailbox.local', resetToken: null },
        'user': { password: 'user123', email: 'user@mailbox.local', resetToken: null }
    };
    isCompleted = false;
    res.clearCookie('mailbox_session');
    res.redirect('/labs/mailbox');
});

module.exports = router;
