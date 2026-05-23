const fs = require('fs');
const filepath = 'src/components/hbb/hbb-agent-dashboard.tsx';
const lines = fs.readFileSync(filepath, 'utf8').split('\n');
fs.writeFileSync(filepath, lines.slice(0, 567).join('\n'));
console.log('Done truncating');
