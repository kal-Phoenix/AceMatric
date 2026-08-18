import fs from 'fs';
const c = fs.readFileSync('src/data/practiceQuestions.ts', 'utf8');

// Count "id": occurrences as a proxy for question count
const idMatches = c.match(/"id":\s*"[^"]+"/g) || [];
console.log('Total "id" fields found:', idMatches.length);

// Count by subject
const subjectMatches = c.match(/"subject":\s*"[^"]+"/g) || [];
const subjects = {};
subjectMatches.forEach(m => {
  const v = m.match(/"subject":\s*"([^"]+)"/)[1];
  subjects[v] = (subjects[v] || 0) + 1;
});
console.log('\nBy subject:', JSON.stringify(subjects, null, 2));

// Count by grade from chapter
const chapterMatches = c.match(/"chapter":\s*"[^"]+"/g) || [];
const grades = {};
chapterMatches.forEach(m => {
  const v = m.match(/"chapter":\s*"([^"]+)"/)[1];
  const gm = v.match(/Grade (\d+)/);
  const g = gm ? 'Grade ' + gm[1] : 'No Grade';
  grades[g] = (grades[g] || 0) + 1;
});
console.log('\nBy grade:', JSON.stringify(grades, null, 2));

// Count chapters
const chapters = {};
chapterMatches.forEach(m => {
  const v = m.match(/"chapter":\s*"([^"]+)"/)[1];
  chapters[v] = (chapters[v] || 0) + 1;
});
console.log('\nTotal unique chapters:', Object.keys(chapters).length);

// Show incomplete chapters
const incomplete = Object.entries(chapters).filter(([, count]) => count < 30);
if (incomplete.length > 0) {
  console.log('\nChapters with < 30 questions (' + incomplete.length + '):');
  incomplete.forEach(([ch, count]) => console.log('  ' + count.toString().padStart(3) + ' | ' + ch));
}

// Show all chapters sorted
console.log('\nAll chapters:');
Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0])).forEach(([ch, count]) => {
  console.log(count.toString().padStart(4) + ' | ' + ch);
});
