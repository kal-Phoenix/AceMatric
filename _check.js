import fs from 'fs';
const c = fs.readFileSync('src/data/practiceQuestions.ts', 'utf8');

// Extract array content between [ and ] (ignoring the as PracticeQuestion[] suffix)
const startIdx = c.indexOf('[');
let depth = 0;
let endIdx = -1;
for (let i = startIdx; i < c.length; i++) {
  if (c[i] === '[') depth++;
  if (c[i] === ']') depth--;
  if (depth === 0) { endIdx = i; break; }
}

const arrStr = c.substring(startIdx, endIdx + 1);
const a = JSON.parse(arrStr);

console.log('Total questions:', a.length);

// Count by subject
const subjects = {};
a.forEach(q => { subjects[q.subject] = (subjects[q.subject] || 0) + 1; });
console.log('\nBy subject:', JSON.stringify(subjects, null, 2));

// Count by grade
const grades = {};
a.forEach(q => {
  const m = (q.chapter || '').match(/Grade (\d+)/);
  const g = m ? 'Grade ' + m[1] : 'No Grade';
  grades[g] = (grades[g] || 0) + 1;
});
console.log('\nBy grade:', JSON.stringify(grades, null, 2));

// Count chapters per subject per grade
const chapters = {};
a.forEach(q => {
  const key = q.subject + ' | ' + q.chapter;
  chapters[key] = (chapters[key] || 0) + 1;
});

// Show chapters with < 30 questions (incomplete)
const incomplete = Object.entries(chapters).filter(([, count]) => count < 30);
if (incomplete.length > 0) {
  console.log('\nChapters with < 30 questions:');
  incomplete.forEach(([ch, count]) => console.log('  ' + count + ' | ' + ch));
}

// Show total chapters
console.log('\nTotal unique chapters:', Object.keys(chapters).length);

// Check for duplicate IDs
const ids = a.map(q => q.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length > 0) {
  console.log('\nDuplicate IDs (' + dupes.length + '):', [...new Set(dupes)].slice(0, 10).join(', '));
}

// Show all chapters with counts
console.log('\nAll chapters:');
const sorted = Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0]));
sorted.forEach(([ch, count]) => console.log(count.toString().padStart(4) + ' | ' + ch));
