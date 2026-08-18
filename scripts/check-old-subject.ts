import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data } = await supabase
  .from('content_entries')
  .select('id, grade, chapter_number, title')
  .eq('subject', 'Scholastic Aptitude Test (SAT)')
  .order('grade')
  .order('chapter_number');

data?.forEach(r => console.log(`Grade ${r.grade} Ch${r.chapter_number}: ${r.title}`));