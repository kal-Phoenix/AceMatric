import { readFileSync, writeFileSync } from 'fs';

const file = 'storage/past-exams/math-2013ec.json';
const data = JSON.parse(readFileSync(file, 'utf-8'));

for (const q of data.questions) {
  // Fix matrix notation: [ {ll}1 & -7 6 & 5 ] → [1, -7; 6, 5]
  q.question = q.question.replace(/\[\s*\{ll\}(\d+)\s*&\s*(-?\d+)\s+(\d+)\s*&\s*(-?\d+)\s*\]/g, '[$1, $2; $3, $4]');
  // Fix mathbf{u} → u
  q.question = q.question.replace(/mathbf\{(\w+)\}/g, '$1');
  // Fix options with mathbf
  q.options = q.options.map((o: string) => o.replace(/mathbf\{(\w+)\}/g, '$1'));
}

writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Cleaned up ${data.questions.length} questions`);
