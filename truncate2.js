const fs = require('fs');
const filepath = 'src/components/hbb/ClientOrderTracker.tsx';
const lines = fs.readFileSync(filepath, 'utf8').split('\n');
fs.writeFileSync(filepath, lines.slice(0, 730).join('\n'));
console.log('Done truncating ClientOrderTracker');
