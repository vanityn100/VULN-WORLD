const http = require('http');

const PORT = 3000;

function requestWithCookie(path, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: {}
    };

    if (cookie) {
        options.headers['Cookie'] = cookie;
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
    req.end();
  });
}

async function runFullTest() {
    console.log("Starting FindIt Test...");
    try {
      const res0 = await requestWithCookie('/labs/findit/', null);
      let cookie = res0.headers['set-cookie'] ? res0.headers['set-cookie'][0].split(';')[0] : '';
      console.log("Session Cookie:", cookie);
  
      await requestWithCookie('/labs/findit/search?q=Hello', cookie);
      console.log("Searched for 'Hello'.");
  
      const xssPayload = encodeURIComponent("<script>alert(1)</script>");
      const resXss = await requestWithCookie(`/labs/findit/search?q=${xssPayload}`, cookie);
      console.log("Performed XSS search.");
  
      // Check if the search response has it
      if (resXss.body.includes('Investigation Complete') || resXss.body.includes('✓ Investigation Complete')) {
        console.log("PASS: Reflected XSS Completed (in search response)");
      } else {
        console.log("FAIL: Reflected XSS Not Completed (in search response)");
      }

      const resFinal = await requestWithCookie('/labs/findit/', cookie);
      if (resFinal.body.includes('Investigation Complete') || resFinal.body.includes(' Investigation Complete')) {
        console.log("PASS: Reflected XSS Completed (in home response)");
      } else {
        console.log("FAIL: Reflected XSS Not Completed (in home response)");
      }
    } catch (err) {
      console.error("Test failed with error:", err);
    }
  }

runFullTest();
