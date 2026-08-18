import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check if stream column already exists on content_entries
const { data: cols, error: colErr } = await supabase
  .from('content_entries')
  .select('stream')
  .limit(1);

if (colErr) {
  console.log('stream column does NOT exist on content_entries:', colErr.message);
} else {
  console.log('stream column exists on content_entries:', cols);
}