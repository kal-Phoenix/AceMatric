import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check all unique subjects
const { data } = await supabase
  .from('content_entries')
  .select('subject')
  .order('subject');

const subjects = [...new Set(data?.map(r => r.subject) || [])];
console.log('All subjects in DB:', subjects);

// Check for Civics with different names
const { data: civics } = await supabase
  .from('content_entries')
  .select('subject, grade, chapter_number, title')
  .or('subject.ilike.%civic%,subject.ilike.%civics%')
  .order('subject');

console.log('\nCivic-related entries:', civics?.length || 0);
civics?.forEach(r => console.log(`  ${r.subject} g${r.grade} ch${r.chapter_number}: ${r.title}`));