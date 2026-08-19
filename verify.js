const { execSync } = require('child_process');

console.log('Running Vuln-World Verification Suite...');
try {
  console.log('\\n--- Running Backend Structural Tests ---');
  execSync('node verify-structure.js', { stdio: 'inherit' });

  console.log('\\n--- Running Security/Vulnerability Tests ---');
  execSync('node qa.js', { stdio: 'inherit' });

  console.log('\\n--- Running UI / Static Asset Tests ---');
  execSync('node verify-ui.js', { stdio: 'inherit' });

  console.log('\\n[SUCCESS] All verification tests passed.');
} catch (error) {
  console.error('\\n[FAIL] Verification suite failed.');
  process.exit(1);
}
