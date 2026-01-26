// Force clean deployment
const fs = require('fs');
const path = require('path');

// Update a file to force new build
const timestampFile = path.join(__dirname, 'BUILD_TIMESTAMP.txt');
fs.writeFileSync(timestampFile, Date.now().toString());

console.log('Force redeploy triggered');