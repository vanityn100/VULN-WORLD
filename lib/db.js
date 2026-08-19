const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const baseDataDir = process.env.LAMBDA_TASK_ROOT ? '/tmp' : process.cwd();
const dataDir = path.join(baseDataDir, 'data', 'labs');
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
