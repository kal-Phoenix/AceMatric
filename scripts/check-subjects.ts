import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const subjects = ['Geography', 'History', 'Civics', 'Economics'];
for (const subject of subjects) {
  const { data } = await supabase
    .from('content_entries')
    .select('grade, chapter_number, title')
    .eq('subject', subject)
    .order('grade')
    .order('chapter_number');
  
  console.log(`\n${subject}: ${data?.length || 0} entries`);
  const byGrade: Record<number, {ch: number, title: string}[]> = {};
  for (const r of data || []) {
    if (!byGrade[r.grade]) byGrade[r.grade] = [];
    byGrade[r.grade].push({ch: r.chapter_number, title: r.title});
  }
  for (const [grade, entries] of Object.entries(byGrade)) {
    console.log(`  Grade ${grade}:`);
    for (const e of entries) {
      console.log(`    Ch${e.ch}: ${e.title}`);
    }
  }
}