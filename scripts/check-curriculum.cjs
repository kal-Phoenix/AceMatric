const fs = require('fs');

// Count lines and subjects in current file
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

// Check if the file has proper JSON structure
try {
  // Find the array
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
}