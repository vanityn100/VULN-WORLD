const express = require('express');
const router = express.Router();

let isCompleted = false;

// Middleware
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const labObjective = "Exploit Broken Authorization to access another user's data, or demonstrate a CORS vulnerability by requesting sensitive data from a cross-origin origin.";
const labHints = [
    "You are logged in as user ID 1. Click 'View My Data' and observe the API request.",
    "What happens if you change the user ID in the URL to 2? (Broken Authorization / IDOR)",
    "Look at the API response headers. Send a request in Burp with an 'Origin: https://evil.com' header. Does it blindly reflect your Origin?"
];

let userData = {
    '1': { id: 1, name: 'Normal User', secret: 'User secret - nothing interesting here.' },
    '2': { id: 2, name: 'Admin', secret: 'Admin Secret FLAG: DataHubPwned' }
};

router.get('/', (req, res) => {
    res.cookie('session_id', 'user_1_session');

    res.render('home', {
        labName: 'DataHub',
        labObjective,
        labHints,
        resetPath: '/labs/datahub/reset',
        isCompleted
    });
});

router.get('/api/data/:id', (req, res) => {
    const requestedId = req.params.id;
    
    // Vulnerability 1: CORS - Reflects Origin dynamically
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Vulnerability 2: Broken Authorization (BOLA/IDOR)
    // The application checks if a session exists, but NOT if it belongs to the requested user ID!
    if (req.cookies.session_id) {
        if (requestedId === '2') {
            isCompleted = true; // Lab completed if they access admin data (either via IDOR or CORS simulation)
        }
        
        const data = userData[requestedId];
        if (data) {
            res.json(data);
        } else {
            res.status(404).send('Not found');
        }
    } else {
        res.status(401).send('Unauthorized. Please visit the lab home first to get a session.');
    }
});

router.post('/reset', (req, res) => {
    isCompleted = false;
    res.clearCookie('session_id');
    res.redirect('/labs/datahub');
});

module.exports = router;
