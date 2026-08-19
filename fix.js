const fs = require('fs');

function unescapeBackticks(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
  fs.writeFileSync(filePath, code);
}

unescapeBackticks('labs/mailbox/index.js');
