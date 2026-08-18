import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fix() {
  const { error } = await supabase
    .from('past_exam_entries')
    .update({ title: 'Grade 12 Biology - 2000 E.C. National Exam' })
    .eq('id', 'past-general-science-g12-1786564675287');
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Fixed: Title updated to "Grade 12 Biology - 2000 E.C. National Exam"');
  }
}

fix();