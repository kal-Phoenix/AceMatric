import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check current state
const { data } = await supabase
  .from('content_entries')
  .select('id, grade, chapter_number, title')
  .eq('subject', 'Maths')
  .eq('grade', 12)
  .order('chapter_number');

console.log('Current Grade 12 Maths entries:');
data?.forEach(r => console.log(`  Ch${r.chapter_number}: ${r.title} (${r.id})`));

// Delete old entries with prefix
const oldEntries = data?.filter(r => r.title.startsWith('Grade 12')) || [];
console.log(`\nDeleting ${oldEntries.length} old entries with prefix...`);

for (const entry of oldEntries) {
  const { error } = await supabase.from('content_entries').delete().eq('id', entry.id);
  if (error) console.error(`Error: ${error.message}`);
  else console.log(`  Deleted: ${entry.title}`);
}

// Verify
const { data: remaining } = await supabase
  .from('content_entries')
  .select('chapter_number, title')
  .eq('subject', 'Maths')
  .eq('grade', 12)
  .order('chapter_number');

console.log('\nRemaining entries:');
remaining?.forEach(r => console.log(`  Ch${r.chapter_number}: ${r.title}`));