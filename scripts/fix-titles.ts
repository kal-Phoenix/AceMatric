import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Get all SAT entries with the prefix pattern
const { data: entries } = await supabase
  .from('content_entries')
  .select('id, title')
  .eq('subject', 'SAT')
  .like('title', 'Grade%Sat - Unit%');

console.log(`Found ${entries?.length} entries to fix`);

for (const entry of entries || []) {
  // Remove "Grade X Sat - Unit X: " prefix
  const cleanTitle = entry.title.replace(/^Grade \d+ Sat - Unit \d+: /, '');
  console.log(`"${entry.title}" -> "${cleanTitle}"`);
  
  const { error } = await supabase
    .from('content_entries')
    .update({ title: cleanTitle })
    .eq('id', entry.id);
  
  if (error) console.error(`Error updating ${entry.id}:`, error);
}
console.log('Done');