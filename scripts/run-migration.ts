import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const migrationFile = process.argv[2] || '015_add_past_exam_columns.sql';
const sql = fs.readFileSync(`server/migrations/${migrationFile}`, 'utf-8');

// Split by semicolons and execute each statement
const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

for (const stmt of statements) {
  console.log('Executing:', stmt.substring(0, 80) + '...');
  const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
  if (error) {
    console.error('  Error:', error.message);
  } else {
    console.log('  OK');
  }
}
console.log('Migration complete');