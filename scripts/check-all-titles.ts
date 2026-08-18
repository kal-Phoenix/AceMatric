import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

for (const grade of [9, 10, 11, 12]) {
  const { data } = await supabase
    .from('content_entries')
    .select('chapter_number, title')
    .eq('subject', 'SAT')
    .eq('grade', grade)
    .order('chapter_number');
  console.log(`\n--- Grade ${grade} ---`);
  data!.forEach(r => console.log(`Ch${r.chapter_number}: ${r.title}`));
}