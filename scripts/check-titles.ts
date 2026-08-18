import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data, error } = await supabase
  .from('content_entries')
  .select('id, title, chapter_number')
  .eq('subject', 'SAT')
  .eq('grade', 9)
  .order('chapter_number');

if (error) { console.error(error); process.exit(1); }
data!.forEach(r => console.log(`Ch${r.chapter_number}: ${r.title}`));