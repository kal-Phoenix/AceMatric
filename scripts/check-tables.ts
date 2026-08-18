import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check all tables
const tables = ['content_entries', 'content_versions'];
for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  console.log(`${table}: ${count || 0} rows`);
  if (error) console.error(`  Error: ${error.message}`);
}

// Check if content_entries has data with different approach
const { data, error } = await supabase
  .from('content_entries')
  .select('id, subject, grade')
  .limit(5);

console.log('\nSample entries:', data?.length || 0);
data?.forEach(e => console.log(`  ${e.id}: ${e.subject} g${e.grade}`));
if (error) console.error('Error:', error.message);