const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');
const clean = content.replace(/^\uFEFF/, '').replace(/\/\/[^\n]*\n/g, '').trim();
const arrayStart = clean.indexOf('[');
const arrayEnd = clean.lastIndexOf(']');
const jsonStr = clean.substring(arrayStart, arrayEnd + 1);
const data = JSON.parse(jsonStr);
console.log('Streams:', data.length);
for (const stream of data) {
  console.log(`\nStream: ${stream.stream} (${stream.subjects.length} subjects)`);
  for (const entry of stream.subjects) {
    console.log(`  ${entry.subject} Grade ${entry.grade}: ${entry.chapters.length} chapters`);
  }
}