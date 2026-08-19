const http = require('http');
const querystring = require('querystring');

async function testEditProfile() {
  const init = await new Promise((resolve) => {
    http.get('http://localhost:3000/labs/socialsphere/', (res) => {
      resolve(res);
    });
  });

  const cookie = init.headers['set-cookie'][0].split(';')[0];
  console.log("Cookie:", cookie);

  const postData = querystring.stringify({
    name: 'Alice Hacked',
    username: 'alice_h',
    bio: 'Cybersecurity learner',
    email: 'alice@example.com',
    phone: '555-0101'
  });

  const editRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/labs/socialsphere/profile/edit',
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      resolve(res);
    });
    req.write(postData);
    req.end();
  });

  console.log("Edit Profile Response Code:", editRes.statusCode);
  if (editRes.statusCode === 302) {
    console.log("Redirect Location:", editRes.headers.location);
  }

  // Fetch API profile
  const apiRes = await new Promise((resolve) => {
    http.get('http://localhost:3000/labs/socialsphere/api/profile/1', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
  
  console.log("Profile Data API Output:", apiRes);
  if (apiRes.includes('Cybersecurity learner') && apiRes.includes('Alice Hacked')) {
    console.log("PASS: Profile updated correctly.");
  } else {
    console.error("FAIL: Profile not updated.");
  }
}

testEditProfile();
