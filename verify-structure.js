const registry = require('./lib/labRegistry');
const fs = require('fs');
const path = require('path');

let missing = 0;
registry.labs.forEach(lab => {
  if (!fs.existsSync(path.join(__dirname, 'labs', lab.id, 'index.js'))) {
    missing++;
  }
});

if (missing !== 0) {
  process.exit(1);
}
