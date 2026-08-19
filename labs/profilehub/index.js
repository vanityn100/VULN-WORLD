const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const labObjective = "Exploit the insecure file upload functionality to upload a script (e.g., .php or .js) or a sensitive file extension.";
const labHints = [
  "Look at the file upload form.",
  "What happens if you upload a .txt file?",
  "Can you upload a .php or .js file? The server does not restrict file extensions."
];

router.get('/', (req, res) => {
  res.render('home', {
    labName: 'ProfileHub',
    vulnId: 'file-upload',
    labObjective: labObjective,
    labHints: labHints,
    resetPath: '/labs/profilehub/reset',
    completed: req.session.profilehubCompleted
  });
});

router.post('/upload', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    // Very basic multipart parsing to extract filename
    const filenameMatch = body.match(/filename="(.*?)"/);
    if (!filenameMatch) {
      return res.send('No file uploaded.<br><a href="/labs/profilehub">Go back</a>');
    }
    
    const originalname = filenameMatch[1];
    if (!originalname) {
      return res.send('No file uploaded.<br><a href="/labs/profilehub">Go back</a>');
    }

    // Vulnerable part: No extension checking.
    const ext = path.extname(originalname).toLowerCase();
    const dangerousExts = ['.php', '.js', '.exe', '.sh', '.py'];

    if (dangerousExts.includes(ext)) {
      req.session.profilehubCompleted = true;
    }
    
    // We mock the save process in this lab
    const mockSavePath = path.join(uploadDir, originalname);
    fs.writeFileSync(mockSavePath, 'Mock file content');

    res.send(`<h2>File uploaded successfully</h2>
      <p>Your file has been saved to: /labs/profilehub/uploads/${originalname}</p>
      <a href="/labs/profilehub">Go back</a>`);
  });
});

router.post('/reset', (req, res) => {
  req.session.profilehubCompleted = false;
  res.redirect('/labs/profilehub');
});

module.exports = router;
