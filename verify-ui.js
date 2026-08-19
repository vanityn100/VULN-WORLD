const http = require('http');

function checkAsset(url, expectedType, callback) {
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const type = res.headers['content-type'] || '';
      if (res.statusCode === 200 && type.includes(expectedType) && data.length > 0) {
        console.log('[PASS] ' + url + ' (' + type + ')');
        callback(true);
      } else {
        console.log('[FAIL] ' + url + ' - Status: ' + res.statusCode + ', Type: ' + type);
        callback(false);
      }
    });
  }).on('error', err => {
    console.log('[ERROR] ' + url + ': ' + err.message);
    callback(false);
  });
}

console.log("Verifying UI Static Assets...");
checkAsset('http://localhost:3000/shared/style.css', 'text/css', (res1) => {
  checkAsset('http://localhost:3000/labs/socialsphere/style.css', 'text/css', (res2) => {
    checkAsset('http://localhost:3000/labs/socialsphere/', 'text/html', (res3) => {
      checkAsset('http://localhost:3000/labs/bookbay/', 'text/html', (res4) => {
        checkAsset('http://localhost:3000/labs/bookbay/style.css', 'text/css', (res5) => {
          if (res1 && res2 && res3 && res4 && res5) {
            console.log("All UI verification checks passed.");
            process.exit(0);
          } else {
            console.log("UI verification failed.");
            process.exit(1);
          }
        });
      });
    });
  });
});
