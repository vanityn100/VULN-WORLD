const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFiles(fullPath);
    } else if (file === 'index.js' || file === 'home.ejs') {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('\\`') || code.includes('\\$')) {
        code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
        fs.writeFileSync(fullPath, code);
      }
    }
  }
}

fixFiles('labs');
