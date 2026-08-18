import 'dotenv/config';
import { getSupabase } from './db';

async function main() {
  const supabase = getSupabase();
  
  // Try to add the passage column using RPC
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage TEXT;'
  });
  
  if (error) {
    console.log('[migration] RPC failed, trying direct query...');
    // Try querying the table to see if column exists
    const { error: selectError } = await supabase
      .from('questions')
      .select('passage')
      .limit(1);
    
    if (selectError && selectError.message.includes('passage')) {
      console.log('[migration] Column does not exist. Please add it manually in Supabase dashboard:');
      console.log('  ALTER TABLE questions ADD COLUMN passage TEXT;');
    } else {
      console.log('[migration] Column "passage" already exists or was added successfully');
    }
  } else {
    console.log('[migration] Column added successfully');
  }
}

main().catch(console.error);
