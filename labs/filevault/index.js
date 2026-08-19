const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const labObjective = "Exploit Path Traversal to read 'secret.txt' located in the parent directory of 'files', AND exploit Command Injection in the diagnostic tool to read the same file.";
const labHints = [
  "For Path Traversal, look at the /download endpoint.",
  "Try using '../' to move up a directory in the file parameter.",
  "For Command Injection, look at the /diagnostic endpoint.",
  "Can you append commands to the target using ';' or '&&'?",
  "Try payload like '127.0.0.1; cat ../secret.txt'"
];

const labDir = path.join(process.cwd(), 'labs', 'filevault', 'files');
const secretFilePath = path.join(process.cwd(), 'labs', 'filevault', 'secret.txt');
if (!fs.existsSync(labDir)) { 
  fs.mkdirSync(labDir, { recursive: true }); 
  fs.writeFileSync(path.join(labDir, 'public.txt'), 'Public File Content');
}
if (!fs.existsSync(secretFilePath)) {
  fs.writeFileSync(secretFilePath, 'FLAG: FileVaultSecret');
}

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'FileVault',
    vulnId: 'path-traversal', // or command-injection, using one for UI grouping
    labObjective: labObjective,
    labHints: labHints,
    resetPath: '/labs/filevault/reset',
    completed: req.session.filevaultCompleted
  });
});

router.get('/download', (req, res) => {
  const fileParam = req.query.file || '';
  
  // Vulnerable Implementation: Just appending the user input without restricting to labDir
  // Path traversal is possible if user provides ../
  const resolvedPath = path.join(labDir, fileParam);
  
  if (!resolvedPath.startsWith(path.join(process.cwd(), 'labs', 'filevault'))) {
    return res.status(403).send('Forbidden: Access outside lab directory is restricted for safety.');
  }

  try { 
    const content = fs.readFileSync(resolvedPath, 'utf8');
    if (content.includes('FLAG: FileVaultSecret')) {
      req.session.filevaultCompleted = true;
    }
    res.send(`<pre>${content}</pre><br><a href="/labs/filevault">Go back</a>`); 
  } catch(e) { 
    res.send(`File not found: ${fileParam}<br><a href="/labs/filevault">Go back</a>`); 
  }
});

router.get('/diagnostic', (req, res) => {
  const target = req.query.target || '';
  
  // Actually execute the command to make it genuinely vulnerable to Command Injection
  // We use powershell on windows or bash on linux, wait, child_process.exec handles it.
  // For safety in lab environment and platform independence, we will simulate the ping part but allow execution
  
  if (!target) return res.send('Missing target');

  // Let's check for command injection manually to grant completion if flag is found, but also actually execute if needed, or simulate it genuinely
  const simulatedCommand = 'ping ' + target;
  
  exec(simulatedCommand, { cwd: path.join(process.cwd(), 'labs', 'filevault') }, (error, stdout, stderr) => {
    let output = stdout || stderr;
    
    // Windows might fail ping if options are wrong, but we want the injected part to run
    // If output contains the flag
    if (output && output.includes('FLAG: FileVaultSecret')) {
      req.session.filevaultCompleted = true;
    }

    res.send(`<h2>Diagnostic Results</h2><pre>Executing: ${simulatedCommand}\n\n${output}</pre><br><a href="/labs/filevault">Go back</a>`);
  });
});

router.post('/reset', (req, res) => {
  req.session.filevaultCompleted = false;
  res.redirect('/labs/filevault');
});

module.exports = router;
