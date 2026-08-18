const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');
const lines = content.split('\n');

// Find and remove first duplicate Maths block (lines 380-519ish)
// Count occurrences of "Maths"
const mathsLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"subject": "Maths"')) {
    mathsLines.push(i);
  }
}
console.log('Maths at lines:', mathsLines);

// Find the two blocks
// Block 1 starts at mathsLines[0], Block 2 starts at mathsLines[4]
// Remove block 1 (from line mathsLines[0]-1 to the line before block 2 starts)
if (mathsLines.length >= 8) {
  const start = mathsLines[0] - 1; // line before { "subject": "Maths"
  const end = mathsLines[4] - 1; // line before second block
  
  console.log(`Removing lines ${start+1} to ${end+1}`);
  console.log('First line:', lines[start]);
  console.log('Last line:', lines[end]);
  
  const newLines = [...lines.slice(0, start), ...lines.slice(end)];
  fs.writeFileSync('src/data/curriculum.ts', newLines.join('\n'), 'utf-8');
  console.log('Done. New line count:', newLines.length);
} else {
  console.log('Not enough Maths blocks found');
}