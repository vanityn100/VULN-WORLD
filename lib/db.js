const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(process.cwd(), 'data', 'labs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getLabDb(labId) {
  const dbPath = path.join(dataDir, labId + '.db');
  return new sqlite3.Database(dbPath);
}

module.exports = {
  getLabDb
};
