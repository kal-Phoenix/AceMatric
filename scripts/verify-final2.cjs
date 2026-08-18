const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');
// Find the main array assignment
const match = content.match(/export const ETHIOPIAN_CURRICULUM.*?=\s*(\[[\s\S]*\]);/);
if (!match) { console.error('No match'); process.exit(1); }
const data = JSON.parse(match[1]);
console.log('Streams:', data.length);
for (const stream of data) {
  console.log(`\nStream: ${stream.stream} (${stream.subjects.length} subjects)`);
  for (const entry of stream.subjects) {
    console.log(`  ${entry.subject} Grade ${entry.grade}: ${entry.chapters.length} chapters`);
  }
}