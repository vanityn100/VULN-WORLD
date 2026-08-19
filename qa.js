const { execSync } = require('child_process');
const fs = require('fs');

console.log("Running Comprehensive Subagent Test Suite...");

const scripts = fs.readdirSync(__dirname).filter(file => file.startsWith('test_') && file.endsWith('.js'));

let allPassed = true;

for (const script of scripts) {
    console.log(`\n============================`);
    console.log(`Executing ${script}...`);
    try {
        const output = execSync(`node ${script}`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`[FAIL] ${script} exited with an error.`);
        allPassed = false;
    }
}

if (allPassed) {
    console.log('\n[SUCCESS] All functional lab tests passed! Vulnerabilities and completion logic are sound.');
    process.exit(0);
} else {
    console.log('\n[FAIL] Some functional tests failed.');
    process.exit(1);
}
