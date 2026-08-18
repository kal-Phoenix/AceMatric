const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Check subjects
const subjects = new Set();
for (const line of lines) {
  const m = line.match(/"subject":\s*"([^"]+)"/);
  if (m) subjects.add(m[1]);
}
console.log('Subjects found:', [...subjects]);

// Try parse
try {
  const arrayStart = content.indexOf('[');
  const arrayEnd = content.lastIndexOf(']');
  const jsonStr = content.substring(arrayStart, arrayEnd + 1);
  const data = JSON.parse(jsonStr);
  console.log('Valid JSON entries:', data.length);
  for (const entry of data) {
    console.log(`  ${entry.subject} Grade ${entry.grade}: ${entry.chapters.length} chapters`);
  }
} catch (e) {
  console.error('JSON parse error:', e.message);
  // Find the error location
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const before = content.substring(Math.max(0, pos - 50), pos);
    const after = content.substring(pos, pos + 50);
    console.error('Context before:', JSON.stringify(before));
    console.error('Context after:', JSON.stringify(after));
  }
}