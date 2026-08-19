const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testSocialSphere() {
  console.log('\\n--- Testing SocialSphere ---');
  // Initialize Session
  const init = await request('http://localhost:3000/labs/socialsphere');
  const cookie = init.headers['set-cookie'] ? init.headers['set-cookie'][0].split(';')[0] : '';
  
  // Normal Post
  const postDataNormal = 'userId=1&content=NormalTest';
  const normalRes = await request({
    hostname: 'localhost', port: 3000, path: '/labs/socialsphere/posts', method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/x-www-form-urlencoded' }
  }, postDataNormal);
  
  // Burp Exploit
  const postDataExploit = 'userId=2&content=HackedByAlice';
  const exploitRes = await request({
    hostname: 'localhost', port: 3000, path: '/labs/socialsphere/posts', method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/x-www-form-urlencoded' }
  }, postDataExploit);
  
  // Verify completion
  const checkRes = await request({
    hostname: 'localhost', port: 3000, path: '/labs/socialsphere', method: 'GET',
    headers: { 'Cookie': cookie }
  });
  
  if (checkRes.body.includes('Completed') || checkRes.body.includes('status-banner')) {
    console.log('[PASS] SocialSphere IDOR completion triggered.');
  } else {
    console.log('[FAIL] SocialSphere IDOR completion NOT triggered.');
  }
}

async function runAll() {
  await testSocialSphere();
  // We can add other lab tests here as needed
  console.log('Automated QA complete.');
}

runAll().catch(console.error);
