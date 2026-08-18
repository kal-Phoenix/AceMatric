import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const subjects = ['Geography', 'History', 'Economics'];
for (const subject of subjects) {
  const { count } = await supabase
    .from('content_entries')
    .select('*', { count: 'exact', head: true })
    .eq('subject', subject);
  console.log(`${subject}: ${count || 0} entries remaining`);
}