const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');

// Find where Maths starts
const idx = content.indexOf('"subject": "Maths"');
console.log('Maths found at char index:', idx);
console.log('Context:', JSON.stringify(content.substring(idx - 30, idx + 30)));