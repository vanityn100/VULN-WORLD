const express = require('express');
const router = express.Router();
const crypto = require('crypto');

let isCompleted = false;

// Middleware
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const labObjective = "Exploit JWT vulnerabilities or privilege escalation via mass assignment to gain admin access.";
const labHints = [
    "Look at the JWT token set in the cookie after you log in. It is signed with a very weak secret key.",
    "Can you crack the secret key offline (it's a common dictionary word) and forge a token with 'role: admin'?",
    "Alternatively, try intercepting the profile update request. Are there hidden properties like 'role' you could manipulate?"
];

let usersDB = {
    'user': { id: 1, username: 'user', role: 'user', email: 'user@accounthub.local' }
};

const SECRET_KEY = 'secret'; // Weak secret for JWT brute forcing

function signJWT(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${b64Payload}`).digest('base64url');
    return `${header}.${b64Payload}.${signature}`;
}

function verifyJWT(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        
        // Vulnerability: accept 'none' algorithm
        if (header.alg === 'none') {
            return payload;
        }

        const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(`${parts[0]}.${parts[1]}`).digest('base64url');
        if (parts[2] === expectedSignature) {
            return payload;
        }
    } catch(e) {
        // Handle malformed tokens safely
    }
    return null;
}

router.get('/', (req, res) => {
    let loggedInUser = null;
    let role = 'guest';
    let userEmail = '';

    if (req.cookies && req.cookies.auth_token) {
        const decoded = verifyJWT(req.cookies.auth_token);
        if (decoded) {
            loggedInUser = decoded.username;
            role = decoded.role;
            if (role === 'admin' || usersDB[loggedInUser]?.role === 'admin') {
                isCompleted = true;
            }
            if (usersDB[loggedInUser]) {
                userEmail = usersDB[loggedInUser].email;
            }
        }
    }

    res.render('home', {
        labName: 'AccountHub',
        labObjective,
        labHints,
        resetPath: '/labs/accounthub/reset',
        isCompleted,
        loggedInUser,
        role,
        userEmail
    });
});

router.post('/login', (req, res) => {
    const token = signJWT({ username: 'user', role: 'user' });
    res.cookie('auth_token', token);
    res.redirect('/labs/accounthub');
});

router.post('/profile', (req, res) => {
    const token = req.cookies.auth_token;
    const decoded = verifyJWT(token);
    if (!decoded) return res.status(401).send('Unauthorized. <a href="/labs/accounthub">Go back</a>');

    const username = decoded.username;
    if (!usersDB[username]) {
        usersDB[username] = { id: Math.random(), username, role: decoded.role, email: '' };
    }

    // Vulnerability: Mass assignment
    // If the attacker adds 'role': 'admin' to the form or JSON payload, it will be assigned.
    Object.assign(usersDB[username], req.body);
    
    if (usersDB[username].role === 'admin') {
        isCompleted = true;
    }

    res.redirect('/labs/accounthub');
});

router.post('/reset', (req, res) => {
    usersDB = {
        'user': { id: 1, username: 'user', role: 'user', email: 'user@accounthub.local' }
    };
    isCompleted = false;
    res.clearCookie('auth_token');
    res.redirect('/labs/accounthub');
});

module.exports = router;
