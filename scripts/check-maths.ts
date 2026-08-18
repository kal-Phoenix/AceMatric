import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data } = await supabase
  .from('content_entries')
  .select('subject, grade, chapter_number, title')
  .eq('subject', 'Maths')
  .eq('grade', 12)
  .order('chapter_number');

console.log(`Found ${data?.length || 0} Maths Grade 12 entries:`);
data?.forEach(r => console.log(`  Ch${r.chapter_number}: ${r.title}`));