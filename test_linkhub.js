const http = require('http');

const HOST = 'localhost';
const PORT = 3000;

function request(method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: { ...headers }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('Testing LinkHub Lab...');

  // Reset lab
  await request('POST', '/labs/linkhub/reset');

  // Normal request
  console.log('[+] Simulating normal workflow...');
  let res = await request('GET', '/labs/linkhub/track?target=https://example.com/promo-2024');
  if (res.statusCode === 302 && res.headers.location === 'https://example.com/promo-2024') {
    console.log('  -> Normal workflow passed (redirects correctly).');
  } else {
    console.error('  -> Normal workflow failed!');
    console.error(res.statusCode, res.headers.location);
    process.exit(1);
  }

  // Manipulated request (Open Redirect)
  console.log('[+] Simulating manipulated request (Open Redirect)...');
  res = await request('GET', '/labs/linkhub/track?target=http://evil.com');

  if (res.statusCode === 302 && res.headers.location === 'http://evil.com') {
    console.log('  -> Open Redirect attack successful.');
  } else {
    console.error('  -> Open Redirect attack failed!');
    process.exit(1);
  }

  // Verify completion
  console.log('[+] Verifying lab completion state...');
  res = await request('GET', '/labs/linkhub/');
  if (res.body.includes('Lab Completed')) {
    console.log('  -> Lab marked as complete.');
  } else {
    console.error('  -> Lab not marked as complete!');
    process.exit(1);
  }

  console.log('LinkHub tests passed!\n');
}

runTest().catch(console.error);
