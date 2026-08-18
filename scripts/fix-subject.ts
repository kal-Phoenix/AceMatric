import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fix() {
  // Find exams with "General Science" subject
  const { data: exams, error: fetchError } = await supabase
    .from('past_exam_entries')
    .select('id, subject, title')
    .eq('subject', 'General Science');
  
  console.log('Found exams:', exams?.length || 0);
  
  if (exams && exams.length > 0) {
    for (const exam of exams) {
      console.log(`Updating ${exam.id}: "${exam.subject}" -> "Biology"`);
      const { error } = await supabase
        .from('past_exam_entries')
        .update({ subject: 'Biology' })
        .eq('id', exam.id);
      
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('OK');
      }
    }
  }
  
  // Also check what subjects exist
  const { data: allExams } = await supabase
    .from('past_exam_entries')
    .select('id, subject, title, year_ec');
  
  console.log('\nAll past exams in database:');
  allExams?.forEach(e => console.log(`  - ${e.title} (${e.subject}, ${e.year_ec})`));
}

fix();