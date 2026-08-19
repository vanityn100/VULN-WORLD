const http = require('http');
const querystring = require('querystring');

const HOST = 'localhost';
const PORT = 3000;

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: { ...headers }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

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
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('Testing ProjectHub Lab...');

  // Reset lab
  await request('POST', '/labs/projecthub/reset');

  // Normal request
  console.log('[+] Simulating normal workflow...');
  let res = await request('GET', '/labs/projecthub/api/projects/P-101');
  if (res.statusCode === 200 && res.body.includes('Website Redesign')) {
    console.log('  -> Normal workflow passed.');
  } else {
    console.error('  -> Normal workflow failed!');
    process.exit(1);
  }

  // Manipulated request (Info Disclosure)
  console.log('[+] Simulating manipulated request (Info Disclosure)...');
  res = await request('GET', '/labs/projecthub/api/projects/INVALID_ID');

  let extractedKey = null;
  if (res.statusCode === 404 && res.body.includes('AKIA-PROJECTHUB-SECRET-99')) {
    console.log('  -> Info Disclosure successful.');
    extractedKey = 'AKIA-PROJECTHUB-SECRET-99';
  } else {
    console.error('  -> Info Disclosure attack failed!');
    process.exit(1);
  }

  // Submit key
  console.log('[+] Submitting extracted API key...');
  let submitData = querystring.stringify({ key: extractedKey });
  await request('POST', '/labs/projecthub/submit_key', submitData, {
    'Content-Type': 'application/x-www-form-urlencoded'
  });

  // Verify completion
  console.log('[+] Verifying lab completion state...');
  res = await request('GET', '/labs/projecthub/');
  if (res.body.includes('Lab Completed')) {
    console.log('  -> Lab marked as complete.');
  } else {
    console.error('  -> Lab not marked as complete!');
    process.exit(1);
  }

  console.log('ProjectHub tests passed!\n');
}

runTest().catch(console.error);
