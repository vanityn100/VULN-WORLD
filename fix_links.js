const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'views', 'learn', 'explanations');
const files = fs.readdirSync(dir);
let modifiedCount = 0;
files.forEach(file => {
  if (file.endsWith('.ejs')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/href="\/labs\/<%= vuln\.lab %>"/g, 'href="/labs/<%= vuln.lab %>?challenge=<%= vuln.id %>"');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modifiedCount++;
    }
  }
});
console.log('Modified', modifiedCount, 'files.');
