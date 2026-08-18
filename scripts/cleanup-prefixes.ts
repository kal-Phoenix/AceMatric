import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Clean up all prefix entries for Geography, History, Economics
const subjects = ['Geography', 'History', 'Economics'];

for (const subject of subjects) {
  const { data } = await supabase
    .from('content_entries')
    .select('id, grade, chapter_number, title')
    .eq('subject', subject)
    .order('grade');

  const toDelete = data?.filter(r => /Grade \d+/.test(r.title)) || [];
  console.log(`${subject}: ${toDelete.length} entries with prefix to delete`);

  for (const entry of toDelete) {
    const { error } = await supabase.from('content_entries').delete().eq('id', entry.id);
    if (error) console.error(`  Error: ${error.message}`);
  }
}

console.log('\nDone cleaning up prefixes');