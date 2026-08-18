import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data } = await supabase
  .from('content_entries')
  .select('id')
  .eq('subject', 'Scholastic Aptitude Test (SAT)');

const ids = data?.map(r => r.id) || [];
console.log(`Deleting ${ids.length} entries...`);

const { error } = await supabase
  .from('content_entries')
  .delete()
  .eq('subject', 'Scholastic Aptitude Test (SAT)');

if (error) console.error(error);
else console.log('Deleted successfully');

// Verify
const { count } = await supabase
  .from('content_entries')
  .select('id', { count: 'exact', head: true })
  .eq('subject', 'Scholastic Aptitude Test (SAT)');
console.log(`Remaining: ${count}`);