const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');
const clean = content.replace(/^\uFEFF/, '').replace(/\/\/[^\n]*\n/g, '').trim();

// Find the actual data array start - look for "stream": "Natural"
const dataStart = clean.indexOf('{\n    "stream": "Natural"');
const dataEnd = clean.lastIndexOf('];');
const jsonStr = clean.substring(dataStart, dataEnd + 1);

try {
  const data = JSON.parse(jsonStr);
  console.log('Valid! Entries:', data.length);
  for (const stream of data) {
    console.log(`\nStream: ${stream.stream}`);
    for (const entry of stream.subjects) {
      console.log(`  ${entry.subject} Grade ${entry.grade}: ${entry.chapters.length} chapters`);
    }
  }
} catch(e) {
  console.error('Error:', e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.error('Near:', JSON.stringify(jsonStr.substring(Math.max(0, pos - 20), pos + 20)));
  }
}