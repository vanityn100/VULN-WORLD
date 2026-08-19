const http = require('http');

const PORT = 3000;

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        ...headers
      }
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
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
  console.log("Starting Isolated State Test for SocialSphere...");
  try {
    // 1. Reset lab
    const resReset = await request('POST', '/labs/socialsphere/reset');
    const cookie = resReset.headers['set-cookie'] ? resReset.headers['set-cookie'][0].split(';')[0] : '';
    console.log("Lab Reset. Session Cookie:", cookie);

    // 2. Open IDOR
    const resIdorOpen = await request('GET', '/labs/socialsphere/?challenge=idor', null, { 'Cookie': cookie });
    if (resIdorOpen.body.includes('Active Challenge: IDOR')) console.log("PASS: IDOR Active");
    if (!resIdorOpen.body.includes('Complete!')) console.log("PASS: No completion shown yet");

    // 3. Complete XSS
    const xssPayload = encodeURIComponent('<script>alert(1)</script>');
    await request('POST', '/labs/socialsphere/posts', `userId=1&content=${xssPayload}`, { 'Cookie': cookie });
    console.log("Created XSS post.");

    // 4. Verify IDOR page does NOT show XSS complete as the active challenge banner
    const resIdorCheck = await request('GET', '/labs/socialsphere/', null, { 'Cookie': cookie });
    if (!resIdorCheck.body.includes('Stored XSS Complete!')) {
      console.log("PASS: Stored XSS banner NOT shown on IDOR challenge");
    } else {
      console.log("FAIL: Stored XSS banner leaked into IDOR challenge");
    }

    // 5. Open XSS challenge, should show complete
    const resXssCheck = await request('GET', '/labs/socialsphere/?challenge=xss-stored', null, { 'Cookie': cookie });
    if (resXssCheck.body.includes('Stored XSS Complete!')) {
      console.log("PASS: Stored XSS banner shown on XSS challenge");
    } else {
      console.log("FAIL: Stored XSS banner missing on XSS challenge");
    }

    // 6. Complete IDOR
    await request('POST', '/labs/socialsphere/posts', 'userId=2&content=Hacked', { 'Cookie': cookie });
    
    // 7. Verify IDOR
    const resIdorFinal = await request('GET', '/labs/socialsphere/?challenge=idor', null, { 'Cookie': cookie });
    if (resIdorFinal.body.includes('IDOR / BOLA Complete!')) {
      console.log("PASS: IDOR Completed");
    } else {
      console.log("FAIL: IDOR Not Completed");
    }
    
    // 8. Trigger BAC
    await request('GET', '/labs/socialsphere/admin', null, { 'Cookie': cookie });
    const resBacCheck = await request('GET', '/labs/socialsphere/?challenge=broken-access-control', null, { 'Cookie': cookie });
    if (resBacCheck.body.includes('Broken Access Control Complete!')) {
      console.log("PASS: BAC Completed");
    } else {
      console.log("FAIL: BAC Not Completed");
    }

  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

runTest();
