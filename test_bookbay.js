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

async function runFullTest() {
    console.log("Starting BookBay Test...");
    try {
      const res0 = await requestWithCookie('/labs/bookbay/?challenge=sqli', '');
      const cookie = res0.headers['set-cookie'] ? res0.headers['set-cookie'][0].split(';')[0] : '';
      console.log("Session Cookie:", cookie);
  
      await requestWithCookie('/labs/bookbay/search?q=Art&challenge=sqli', cookie);
      console.log("Searched for 'Art'.");
  
      const sqliPayload = encodeURIComponent("' OR 1=1--");
      const resSqli = await requestWithCookie(`/labs/bookbay/search?q=${sqliPayload}&challenge=sqli`, cookie);
      console.log("Performed SQLi search.");
      
      if (resSqli.body.includes('Complete!')) {
        console.log("PASS: SQLi Completed (in search response)");
      } else {
        console.log("FAIL: SQLi Not Completed (in search response)");
      }
  
      const resFinal = await requestWithCookie('/labs/bookbay/?challenge=sqli', cookie);
      
      if (resFinal.body.includes('Complete!')) {
        console.log("PASS: SQLi Completed (in home response)");
      } else {
        console.log("FAIL: SQLi Not Completed (in home response)");
      }
    } catch (err) {
      console.error("Test failed with error:", err);
    }
  }

runFullTest();
