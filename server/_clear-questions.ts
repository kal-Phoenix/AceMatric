import 'dotenv/config';
import { supabase } from './db';

async function main() {
  // Delete all questions
  const { data, error } = await supabase.from('questions').delete().neq('id', '__nonexistent__');
  if (error) {
    console.error('Delete failed:', error);
    return;
  }
  
  const { count } = await supabase.from('questions').select('id', { count: 'exact', head: true });
  console.log('Questions remaining after delete:', count);
}
main();
