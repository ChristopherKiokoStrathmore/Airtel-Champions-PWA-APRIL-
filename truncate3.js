const fs = require('fs');
const filepath = 'src/components/hbb/hbb-my-leads.tsx';
const lines = fs.readFileSync(filepath, 'utf8').split(/\r?\n/);
const newLines = [...lines.slice(314, 638), lines[639]];
fs.writeFileSync(filepath, newLines.join('\n'));
console.log('Done fixing hbb-my-leads');
