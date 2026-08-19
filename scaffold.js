const fs = require('fs');
const path = require('path');

const labs = [
  { id: 'socialsphere', name: 'SocialSphere', vulns: ['IDOR', 'BOLA', 'Stored XSS', 'Broken Access Control', 'Broken Function-Level Authorization'] },
  { id: 'shopzone', name: 'ShopZone', vulns: ['Business Logic', 'Race Conditions', 'API Parameter Manipulation'] },
  { id: 'findit', name: 'FindIt', vulns: ['Reflected XSS', 'Open Redirect'] },
  { id: 'bookbay', name: 'BookBay', vulns: ['SQL Injection'] },
  { id: 'pixdrop', name: 'PixDrop', vulns: ['SSRF'] },
  { id: 'profilehub', name: 'ProfileHub', vulns: ['File Upload'] },
  { id: 'filevault', name: 'FileVault', vulns: ['Path Traversal'] },
  { id: 'mailbox', name: 'MailBox', vulns: ['Authentication', 'Session Management Issues', 'Password Reset Vulnerabilities'] },
  { id: 'accounthub', name: 'AccountHub', vulns: ['JWT Vulnerabilities', 'Privilege Escalation'] },
  { id: 'paydesk', name: 'PayDesk', vulns: ['CSRF'] },
  { id: 'datahub', name: 'DataHub', vulns: ['CORS Misconfiguration', 'Broken Authorization'] },
  { id: 'templateworks', name: 'TemplateWorks', vulns: ['SSTI'] },
  { id: 'dropmart', name: 'DropMart', vulns: ['Race Conditions'] },
  { id: 'linkhub', name: 'LinkHub', vulns: ['Open Redirect'] },
  { id: 'projecthub', name: 'ProjectHub', vulns: ['Information Disclosure', 'Security Misconfiguration'] }
];

const vulnerabilities = [
  { id: 'idor', name: 'IDOR', category: 'Access Control', difficulty: 'Beginner', lab: 'socialsphere' },
  { id: 'bola', name: 'BOLA', category: 'Access Control', difficulty: 'Intermediate', lab: 'socialsphere' },
  { id: 'broken-access-control', name: 'Broken Access Control', category: 'Access Control', difficulty: 'Beginner', lab: 'socialsphere' },
  { id: 'broken-function-level-auth', name: 'Broken Function-Level Authorization', category: 'Access Control', difficulty: 'Intermediate', lab: 'socialsphere' },
  { id: 'privilege-escalation', name: 'Privilege Escalation', category: 'Access Control', difficulty: 'Intermediate', lab: 'accounthub' },
  { id: 'reflected-xss', name: 'Reflected XSS', category: 'XSS', difficulty: 'Beginner', lab: 'findit' },
  { id: 'stored-xss', name: 'Stored XSS', category: 'XSS', difficulty: 'Intermediate', lab: 'socialsphere' },
  { id: 'dom-xss', name: 'DOM XSS', category: 'XSS', difficulty: 'Advanced', lab: 'findit' },
  { id: 'sql-injection', name: 'SQL Injection', category: 'Injection', difficulty: 'Intermediate', lab: 'bookbay' },
  { id: 'command-injection', name: 'Command Injection', category: 'Injection', difficulty: 'Advanced', lab: 'filevault' },
  { id: 'ssti', name: 'SSTI', category: 'Injection', difficulty: 'Advanced', lab: 'templateworks' },
  { id: 'weak-authentication', name: 'Weak Authentication', category: 'Authentication', difficulty: 'Beginner', lab: 'mailbox' },
  { id: 'session-management', name: 'Session Management Issues', category: 'Authentication', difficulty: 'Intermediate', lab: 'mailbox' },
  { id: 'jwt-vulnerabilities', name: 'JWT Vulnerabilities', category: 'Authentication', difficulty: 'Intermediate', lab: 'accounthub' },
  { id: 'password-reset', name: 'Password Reset Vulnerabilities', category: 'Authentication', difficulty: 'Intermediate', lab: 'mailbox' },
  { id: 'ssrf', name: 'SSRF', category: 'Server-Side', difficulty: 'Intermediate', lab: 'pixdrop' },
  { id: 'path-traversal', name: 'Path Traversal', category: 'Server-Side', difficulty: 'Beginner', lab: 'filevault' },
  { id: 'file-upload', name: 'File Upload', category: 'Server-Side', difficulty: 'Intermediate', lab: 'profilehub' },
  { id: 'csrf', name: 'CSRF', category: 'Browser / Request Security', difficulty: 'Intermediate', lab: 'paydesk' },
  { id: 'cors', name: 'CORS Misconfiguration', category: 'Browser / Request Security', difficulty: 'Intermediate', lab: 'datahub' },
  { id: 'open-redirect', name: 'Open Redirect', category: 'Browser / Request Security', difficulty: 'Beginner', lab: 'linkhub' },
  { id: 'api-parameter-manipulation', name: 'API Parameter Manipulation', category: 'API Security', difficulty: 'Beginner', lab: 'shopzone' },
  { id: 'broken-authorization', name: 'Broken Authorization', category: 'API Security', difficulty: 'Intermediate', lab: 'datahub' },
  { id: 'business-logic', name: 'Business Logic', category: 'Application Logic', difficulty: 'Intermediate', lab: 'shopzone' },
  { id: 'race-conditions', name: 'Race Conditions', category: 'Application Logic', difficulty: 'Advanced', lab: 'dropmart' },
  { id: 'information-disclosure', name: 'Information Disclosure', category: 'Information / Configuration', difficulty: 'Beginner', lab: 'projecthub' },
  { id: 'security-misconfiguration', name: 'Security Misconfiguration', category: 'Information / Configuration', difficulty: 'Beginner', lab: 'projecthub' }
];

// Write Registry
const registryContent = `module.exports = {
  labs: ${JSON.stringify(labs, null, 2)},
  vulnerabilities: ${JSON.stringify(vulnerabilities, null, 2)}
};`;
fs.writeFileSync(path.join(__dirname, 'lib', 'labRegistry.js'), registryContent);

// Scaffold Labs
labs.forEach(lab => {
  const labDir = path.join(__dirname, 'labs', lab.id);
  const viewsDir = path.join(labDir, 'views');
  const publicDir = path.join(labDir, 'public');
  
  if (!fs.existsSync(labDir)) fs.mkdirSync(labDir, { recursive: true });
  if (!fs.existsSync(viewsDir)) fs.mkdirSync(viewsDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const routerContent = `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { labName: '${lab.name}' });
});

module.exports = router;
`;
  fs.writeFileSync(path.join(labDir, 'index.js'), routerContent);

  const homeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${lab.name}</title>
  <style>
    body { font-family: sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    header { background: #333; color: white; padding: 10px 20px; }
    .container { max-width: 800px; margin: 20px auto; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <header>
    <h1>${lab.name}</h1>
  </header>
  <div class="container">
    <h2>Welcome to ${lab.name}</h2>
    <p>This is a realistic lab application.</p>
    <%- include('../../views/partials/helper') %>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(viewsDir, 'home.ejs'), homeContent);
});

console.log('Scaffolding complete.');
