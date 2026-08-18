import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const NATURAL = ['Biology', 'Chemistry', 'Physics', 'Maths', 'English', 'SAT'];
const SOCIAL = ['Geography', 'History', 'Economics'];

// Check current state
const { data: entries } = await supabase
  .from('content_entries')
  .select('subject, stream')
  .order('subject');

const subjects = [...new Set(entries?.map(e => e.subject) || [])];
console.log('Subjects in DB:', subjects);

const withStream = entries?.filter(e => e.stream && e.stream !== '').length || 0;
const withoutStream = entries?.filter(e => !e.stream || e.stream === '').length || 0;
console.log(`Entries with stream: ${withStream}, without stream: ${withoutStream}`);

// Show what needs updating
for (const subj of subjects) {
  const isNatural = NATURAL.includes(subj);
  const isSocial = SOCIAL.includes(subj);
  const targetStream = isNatural ? 'Natural Science' : isSocial ? 'Social Science' : '';
  const count = entries?.filter(e => e.subject === subj).length || 0;
  console.log(`  ${subj}: ${count} entries -> stream="${targetStream}"`);
}