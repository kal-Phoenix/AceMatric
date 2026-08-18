const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');
const clean = content.replace(/^\uFEFF/, '').replace(/\/\/[^\n]*\n/g, '').trim();
const arrayStart = clean.indexOf('[');
const arrayEnd = clean.lastIndexOf(']');
console.log('arrayStart:', arrayStart, 'arrayEnd:', arrayEnd);
console.log('First 100 chars after [:', JSON.stringify(clean.substring(arrayStart, arrayStart + 100)));
console.log('Last 100 chars before ]:', JSON.stringify(clean.substring(arrayEnd - 100, arrayEnd + 1)));
const jsonStr = clean.substring(arrayStart, arrayEnd + 1);
console.log('JSON length:', jsonStr.length);
// Try parsing first 200 chars
try {
  JSON.parse('[ ' + JSON.stringify(JSON.parse(jsonStr.substring(0, 200) + ']}]')) + ']');
} catch(e) {}
// Just check if it starts with [
console.log('Starts with [:', jsonStr.startsWith('['));
console.log('Char at arrayStart:', JSON.stringify(clean[arrayStart]));
console.log('Char at arrayEnd:', JSON.stringify(clean[arrayEnd]));