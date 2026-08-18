import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check if stream column exists by querying it
const { data, error } = await supabase
  .from('content_entries')
  .select('id, subject, grade, stream')
  .limit(3);

if (error) {
  console.log('stream column does NOT exist:', error.message);
} else {
  console.log('stream column exists:');
  data?.forEach(e => console.log(`  ${e.id}: stream="${e.stream}"`));
}